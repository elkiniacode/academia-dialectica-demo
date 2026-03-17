"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface SuggestionResult {
  success: boolean;
  error?: string;
}

// "Buzón de Sugerencias" — clients send messages TO the admin

// CLIENT only — uses session.userId as author (S2: no clientId argument)
export async function createSuggestion(
  message: string
): Promise<SuggestionResult> {
  const session = await auth();
  if (!session || !session.userId)
    return { success: false, error: "No autenticado" };
  if (session.role !== "CLIENT")
    return { success: false, error: "Solo los estudiantes pueden enviar sugerencias" };

  const trimmed = message.trim();
  if (!trimmed) return { success: false, error: "El mensaje es obligatorio" };

  await prisma.suggestion.create({
    data: {
      clientId: session.userId,
      message: trimmed,
    },
  });

  revalidatePath("/client/dashboard");
  revalidatePath(`/admin/clients/${session.userId}`);
  return { success: true };
}

// ADMIN sees all (or filtered by clientId); CLIENT sees only their own
export async function getSuggestions(clientId?: string) {
  const session = await auth();
  if (!session) return [];

  if (session.role === "CLIENT") {
    return prisma.suggestion.findMany({
      where: { clientId: session.userId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ADMIN
  if (session.role !== "ADMIN") return [];

  return prisma.suggestion.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: { select: { name: true, student: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// ADMIN only — marks a student's suggestion as read
export async function markSuggestionRead(
  suggestionId: string
): Promise<SuggestionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  const suggestion = await prisma.suggestion.update({
    where: { id: suggestionId },
    data: { status: "read" },
  });

  revalidatePath(`/admin/clients/${suggestion.clientId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}
