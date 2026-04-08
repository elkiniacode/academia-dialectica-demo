import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";
import { welcomeStudentEmail } from "@/lib/email-templates";

// Spanish word pool for password generation
const WORDS = [
  "sol", "luna", "rio", "mar", "luz", "paz", "flor", "roca",
  "viento", "fuego", "cielo", "nube", "arbol", "hoja", "campo",
];

function generatePassword(): string {
  const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const digits = String(Math.floor(Math.random() * 90) + 10);
  // Capitalize first word to satisfy: letter + number + 8+ chars + not in weak list
  return w1.charAt(0).toUpperCase() + w1.slice(1) + w2 + digits;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]/g, "")       // keep only alphanumeric
    .slice(0, 15);
}

export async function POST(req: NextRequest) {
  // Protect endpoint with a secret token
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Find unprocessed leads with a chosen character class, created >= 2 days ago
  const leads = await prisma.lead.findMany({
    where: {
      processedAt: null,
      characterClass: { not: null },
      createdAt: { lte: twoDaysAgo },
    },
  });

  const results: { lead: string; status: string; reason?: string }[] = [];

  for (const lead of leads) {
    try {
      // 1. Generate username from name (name-based + 3 random digits)
      const base = slugifyName(lead.name) || "estudiante";
      const suffix = String(Math.floor(Math.random() * 900) + 100);
      let username = `${base}${suffix}`;

      // Collision check
      const existing = await prisma.client.findUnique({ where: { username } });
      if (existing) {
        username = `${base}${Date.now() % 10000}`;
      }

      // 2. Generate password meeting validation rules
      const plainPassword = generatePassword();
      const hashedPw = await hashPassword(plainPassword);

      // 3. Check for name collision in clients table
      const existingByName = await prisma.client.findUnique({ where: { name: lead.name } });
      if (existingByName) {
        await prisma.lead.update({ where: { id: lead.id }, data: { processedAt: new Date() } });
        results.push({ lead: lead.email, status: "skipped", reason: "client_name_exists" });
        continue;
      }

      const siteUrl = process.env.NEXTAUTH_URL ?? process.env.SITE_URL ?? "https://academiadialectica.com";

      // 4. Send email FIRST — if this throws, we skip the DB write and retry tomorrow
      const html = welcomeStudentEmail({
        name: lead.name,
        username,
        password: plainPassword,
        characterClass: lead.characterClass!,
        siteUrl,
      });
      await sendEmail(lead.email, "¡Bienvenido a Academia Dialéctica!", html);

      // 5. Only if email succeeded: create client + mark lead processed
      await prisma.$transaction([
        prisma.client.create({
          data: {
            name: lead.name,
            hourlyRate: 0,
            correo: lead.email,
            celular: lead.phone ?? null,
            username,
            password: hashedPw,
            characterClass: lead.characterClass,
            characterName: lead.name,
            requirePasswordChange: true,
          },
        }),
        prisma.lead.update({
          where: { id: lead.id },
          data: { processedAt: new Date() },
        }),
      ]);

      results.push({ lead: lead.email, status: "processed" });
    } catch (error) {
      // Log but don't mark as processed — will retry on next cron run
      console.error(`[cron] Failed to process lead ${lead.id}:`, error);
      results.push({ lead: lead.email, status: "error", reason: String(error) });
    }
  }

  return NextResponse.json({
    total: leads.length,
    processed: results.filter((r) => r.status === "processed").length,
    results,
  });
}
