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

const PROMPT = `Analiza este archivo y extrae la información del cliente para un sistema de clases de tutoría.
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
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
  }

  if (!SUPPORTED_TYPES.includes(file.type as SupportedType)) {
    return NextResponse.json(
      { error: "Formato no soportado. Sube una imagen (JPG, PNG, WEBP) o video (MP4, MOV, WEBM)." },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const isVideo = file.type.startsWith("video/");

  // Upload to Gemini Files API (required for video, works for images too)
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
      { error: "Error al subir el archivo a Gemini. Verifica la API key o intenta de nuevo." },
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
        { error: "El video tardó demasiado en procesar. Intenta con un video más corto." },
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
    // Always clean up the uploaded file
    await ai.files.delete({ name: uploadedFile.name! }).catch(() => {});
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
