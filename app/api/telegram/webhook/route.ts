import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseClientMessage,
  sendTelegramMessage,
  buildTemplate,
} from "@/lib/telegram";

// Fail fast: crash on startup if security env vars are missing
if (!process.env.TELEGRAM_ALLOWED_USER_ID) {
  throw new Error("TELEGRAM_ALLOWED_USER_ID is missing from .env!");
}
if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
  throw new Error("TELEGRAM_WEBHOOK_SECRET is missing from .env!");
}

const ALLOWED_USER_ID = parseInt(process.env.TELEGRAM_ALLOWED_USER_ID);
if (isNaN(ALLOWED_USER_ID)) {
  throw new Error("TELEGRAM_ALLOWED_USER_ID must be a valid number!");
}
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(req: Request) {
  // Verify Telegram secret token header (set via setWebhook?secret_token=...)
  const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (headerSecret !== WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await req.json();
  const message = body?.message;

  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const chatId: number = message.chat.id;
  const userId: number = message.from?.id;
  const text: string = message.text.trim();

  // Restrict to allowed user
  if (userId !== ALLOWED_USER_ID) {
    await sendTelegramMessage(chatId, "No autorizado.");
    return NextResponse.json({ ok: true });
  }

  // Greeting or /start — send the template
  if (
    text.toLowerCase() === "hola" ||
    text.toLowerCase() === "/start" ||
    text.toLowerCase() === "hi"
  ) {
    await sendTelegramMessage(chatId, buildTemplate());
    return NextResponse.json({ ok: true });
  }

  // Try to parse as client data
  const parsed = parseClientMessage(text);

  if (!parsed) {
    await sendTelegramMessage(
      chatId,
      "No pude leer los datos. Usa este formato:\n\n" + buildTemplate()
    );
    return NextResponse.json({ ok: true });
  }

  // Upsert the client
  try {
    await prisma.client.upsert({
      where: { name: parsed.name },
      update: {
        hourlyRate: parsed.hourlyRate,
        currency: "COP",
        student: parsed.student,
        modalidad: parsed.modalidad,
        grado: parsed.grado,
        celular: parsed.celular,
        direccion: parsed.direccion,
        correo: parsed.correo,
      },
      create: {
        name: parsed.name,
        hourlyRate: parsed.hourlyRate,
        currency: "COP",
        student: parsed.student,
        modalidad: parsed.modalidad,
        grado: parsed.grado,
        celular: parsed.celular,
        direccion: parsed.direccion,
        correo: parsed.correo,
      },
    });

    await sendTelegramMessage(
      chatId,
      `Estudiante correctamente añadido a la base de datos. Ten un lindo dia`
    );
  } catch (err) {
    console.error("Telegram webhook DB error:", err);
    await sendTelegramMessage(
      chatId,
      "Error al guardar en la base de datos. Intenta de nuevo."
    );
  }

  return NextResponse.json({ ok: true });
}
