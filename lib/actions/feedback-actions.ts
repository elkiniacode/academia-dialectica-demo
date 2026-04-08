"use server";

import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["GENERAL_ISSUE", "GENERAL_IDEA", "GAME_RATING"] as const;
type FeedbackType = (typeof VALID_TYPES)[number];

export async function createPublicFeedback(data: {
  type: FeedbackType;
  rating?: number;
  message?: string;
  email?: string;
  page?: string;
}): Promise<{ success: boolean; error?: string }> {
  const type = data.type;
  const message = data.message?.trim() || null;
  const email = data.email?.trim().toLowerCase() || null;
  const page = data.page || "/";
  const rating = data.rating ?? null;

  if (!VALID_TYPES.includes(type)) {
    return { success: false, error: "Tipo de feedback inválido." };
  }

  if (type === "GAME_RATING" && (rating == null || rating < 1 || rating > 5)) {
    return { success: false, error: "La calificación debe ser entre 1 y 5." };
  }

  if (!message && rating == null) {
    return { success: false, error: "Debes enviar un mensaje o una calificación." };
  }

  if (message && message.length > 2000) {
    return { success: false, error: "El mensaje es demasiado largo (máximo 2000 caracteres)." };
  }

  try {
    await prisma.publicFeedback.create({
      data: { type, rating, message, email, page },
    });
    return { success: true };
  } catch (error) {
    console.error("[Feedback Action Error]:", error);
    return { success: false, error: "Error interno al enviar el feedback. Intenta de nuevo." };
  }
}
