import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
] as const;

type SupportedType = (typeof SUPPORTED_TYPES)[number];

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

const PROMPT = `Analiza este archivo y extrae la información de TODOS los clientes que puedas encontrar.
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
          "Formato no soportado. Sube una imagen (JPG, PNG, WEBP) o video (MP4, MOV, WEBM).",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error:
          "El archivo es demasiado grande. El límite es 200 MB. Intenta con un video más corto o de menor resolución.",
      },
      { status: 413 }
    );
  }

  const buffer = await file.arrayBuffer();
  const isVideo = file.type.startsWith("video/");

  const blob = new Blob([buffer], { type: file.type });
  let uploadedFile: Awaited<ReturnType<typeof ai.files.upload>>;
  try {
    uploadedFile = await ai.files.upload({
      file: blob,
      config: { mimeType: file.type, displayName: file.name },
    });
  } catch (err) {
    console.error("Gemini upload error:", err);
    return NextResponse.json(
      {
        error:
          "Error al subir el archivo a Gemini. Verifica la API key o intenta de nuevo.",
      },
      { status: 502 }
    );
  }

  // For videos, poll until Gemini finishes processing
  let fileRef = uploadedFile;
  if (isVideo) {
    let attempts = 0;
    while (fileRef.state === "PROCESSING" && attempts < 30) {
      await new Promise((r) => setTimeout(r, 2000));
      fileRef = await ai.files.get({ name: uploadedFile.name! });
      attempts++;
    }
    if (fileRef.state !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "El video tardó demasiado en procesar (más de 60 segundos). Intenta con un video más corto o de menor resolución.",
        },
        { status: 422 }
      );
    }
  }

  let text = "";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { fileData: { fileUri: fileRef.uri!, mimeType: file.type } },
            { text: PROMPT },
          ],
        },
      ],
    });
    text = response.text ?? "";
  } catch (err) {
    console.error("Gemini generateContent error:", err);
    return NextResponse.json(
      { error: "Error al analizar con Gemini. Intenta de nuevo." },
      { status: 502 }
    );
  } finally {
    await ai.files.delete({ name: uploadedFile.name! }).catch(() => {});
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
