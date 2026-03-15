const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const TEMPLATE = `Cliente:
Estudiante:
Modalidad: Presencial Online
Grado:
Celular:
Direccion:
Correo:
Costo:`;

export function buildTemplate(): string {
  return TEMPLATE;
}

export interface ParsedClient {
  name: string;
  student: string | null;
  modalidad: string | null;
  grado: string | null;
  celular: string | null;
  direccion: string | null;
  correo: string | null;
  hourlyRate: number;
}

export function parseClientMessage(text: string): ParsedClient | null {
  const lines = text.split("\n").map((l) => l.trim());
  const fields = new Map<string, string>();

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();
    if (key && value) fields.set(key, value);
  }

  const name = fields.get("cliente");
  const rawCost = fields.get("costo");

  if (!name || !rawCost) return null;

  const hourlyRate = parseFloat(rawCost.replace(/[\$,.\s]/g, ""));
  if (isNaN(hourlyRate) || hourlyRate <= 0) return null;

  return {
    name,
    student: fields.get("estudiante") ?? null,
    modalidad: fields.get("modalidad") ?? null,
    grado: fields.get("grado") ?? null,
    celular: fields.get("celular") ?? null,
    direccion: fields.get("direccion") ?? null,
    correo: fields.get("correo") ?? null,
    hourlyRate,
  };
}

export async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<void> {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
