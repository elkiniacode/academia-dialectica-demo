import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type SupportedType = (typeof SUPPORTED_TYPES)[number];

const PROMPT = `Analiza esta imagen y extrae la información del cliente para un sistema de clases de tutoría.
Devuelve ÚNICAMENTE un JSON válido con estos campos (usa null si no encuentras el valor):

{
  "name": "Nombre completo del cliente o tutor responsable",
  "student": "Nombre del estudiante (si es diferente al cliente/pagador)",
  "modalidad": "Presencial u Online (solo esos dos valores, o null)",
  "grado": "Grado escolar, nivel universitario, o institución (ej: '10', 'Universidad Andes')",
  "celular": "Número de celular/teléfono como texto",
  "correo": "Dirección de email",
  "direccion": "Dirección física",
  "hourlyRate": número entero o null
}

Solo devuelve el JSON sin ningún texto adicional, sin bloques de código markdown.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
  }

  if (!SUPPORTED_TYPES.includes(file.type as SupportedType)) {
    return NextResponse.json(
      { error: "Formato no soportado. Sube una imagen (JPG, PNG, GIF, WEBP)." },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  let text = "";
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as SupportedType,
                data: base64,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
    text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
  } catch (err) {
    console.error("Claude vision error:", err);
    return NextResponse.json(
      { error: "Error al analizar con Claude. Verifica la API key o intenta de nuevo." },
      { status: 502 }
    );
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "No se pudo extraer información. Intenta con una imagen más clara." },
      { status: 422 }
    );
  }

  try {
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { error: "Respuesta inválida del modelo. Intenta de nuevo." },
      { status: 422 }
    );
  }
}
