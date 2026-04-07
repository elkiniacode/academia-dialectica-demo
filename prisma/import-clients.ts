// prisma/import-clients.ts — Import real clients from clients.csv
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { resolve } from "path";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function parseCost(raw: string): number {
  if (!raw || raw === "(Not visible)") return 0;
  // Remove $, commas, spaces → parse as number
  return parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
}

async function main() {
  const csvPath = resolve(__dirname, "../clients.csv");
  const content = readFileSync(csvPath, "utf-8");
  const lines = content.trim().split("\n").slice(1); // skip header

  // Delete all existing demo data (cascade will handle related records)
  console.log("Cleaning demo data...");
  await prisma.suggestion.deleteMany();
  await prisma.progressNote.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.session.deleteMany();
  await prisma.balanceEntry.deleteMany();
  await prisma.monthlyBalance.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.story.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.client.deleteMany();
  console.log("Demo data cleaned.\n");

  let imported = 0;
  const seen = new Set<string>();

  for (const line of lines) {
    // Parse CSV (handle quoted fields with commas)
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    const [name, student, grado, cost, celular, correo, direccion] = fields;

    if (!name) continue;

    // Skip duplicates (Gabriela, Jerónimo appear twice — use the later entry with more data)
    const key = name.toLowerCase();
    if (seen.has(key)) {
      console.log(`  Skipping duplicate: ${name}`);
      continue;
    }
    seen.add(key);

    const hourlyRate = parseCost(cost);

    await prisma.client.create({
      data: {
        name,
        student: student || null,
        grado: grado || null,
        hourlyRate,
        celular: celular || null,
        correo: correo || null,
        direccion: direccion || null,
      },
    });

    console.log(`  ✓ ${name} — $${hourlyRate.toLocaleString()}`);
    imported++;
  }

  console.log(`\nDone! Imported ${imported} clients.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
