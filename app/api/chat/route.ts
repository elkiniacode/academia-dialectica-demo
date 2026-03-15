import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

type Provider = "claude" | "openai" | "gemini";

function getModel(provider: Provider) {
  switch (provider) {
    case "claude":
      return anthropic("claude-sonnet-4-20250514");
    case "openai":
      return openai("gpt-4o-mini");
    case "gemini":
      return google("gemini-2.5-flash");
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { messages, provider = "claude" } = await req.json();

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      sessions: { orderBy: { date: "desc" }, take: 10 },
      _count: { select: { sessions: true, balanceEntries: true } },
    },
  });

  // Redact PII before sending to third-party AI providers
  const redactedClients = clients.map(({ celular, direccion, correo, password, username, ...client }) => client);

  const systemPrompt = `Eres un asistente de IA para un negocio de tutorías privadas. Tienes acceso a la base de datos de clientes.

Responde ÚNICAMENTE basándote en el JSON proporcionado. Si la respuesta no está en los datos, di exactamente: 'No tengo esa información en la base de datos'. No inventes nombres, precios ni fechas.

Responde siempre en español. Sé conciso y útil. Cuando menciones tarifas, usa el formato de moneda del cliente (campo "currency").

Datos de clientes:
${JSON.stringify(redactedClients, null, 2)}`;

  const result = streamText({
    model: getModel(provider as Provider),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
