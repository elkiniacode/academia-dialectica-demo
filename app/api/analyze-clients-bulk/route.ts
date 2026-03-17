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

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB (Claude base64 limit)

const PROMPT = `Analiza esta imagen y extrae la información de TODOS los clientes que puedas encontrar.
Este es un sistema de clases de tutoría. Cada cliente tiene los siguientes campos.
Devuelve ÚNICAMENTE un JSON array válido con objetos que tengan estos campos (usa null si no encuentras el valor):

[
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
]

Si solo encuentras un cliente, devuelve un array con un solo elemento.
Solo devuelve el array JSON sin ningún texto adicional, sin bloques de código markdown.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No se proporcionó archivo" },
      { status: 400 }
    );
  }

  if (!SUPPORTED_TYPES.includes(file.type as SupportedType)) {
    return NextResponse.json(
      {
        error:
          "Formato no soportado. Sube una imagen (JPG, PNG, GIF, WEBP).",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error:
          "La imagen es demasiado grande. El límite es 20 MB.",
      },
      { status: 413 }
    );
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  let text = "";
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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

  // Strip markdown fences if present
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "");

  // Try to extract JSON array
  let data: unknown;
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      data = JSON.parse(arrayMatch[0]);
    } catch {
      // fall through to single-object fallback
    }
  }

  // Fallback: single object → wrap in array
  if (!Array.isArray(data)) {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        const single = JSON.parse(objMatch[0]);
        data = [single];
      } catch {
        return NextResponse.json(
          {
            error:
              "No se pudo extraer información. Intenta con una imagen más clara.",
          },
          { status: 422 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "No se pudo extraer información. Intenta con una imagen más clara.",
        },
        { status: 422 }
      );
    }
  }

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json(
      { error: "No se encontraron clientes en el archivo." },
      { status: 422 }
    );
  }

  return NextResponse.json({ success: true, data });
}
