"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ProgressNoteResult {
  success: boolean;
  error?: string;
}

// S2: For CLIENT role, always use session.userId — ignore clientId argument
export async function getProgressNotes(clientId?: string) {
  const session = await auth();
  if (!session) return [];

  const resolvedClientId =
    session.role === "CLIENT" ? session.userId : clientId;
  if (!resolvedClientId) return [];

  return prisma.progressNote.findMany({
    where: { clientId: resolvedClientId },
    orderBy: { date: "desc" },
  });
}

// S1: ADMIN only
export async function createProgressNote(
  clientId: string,
  data: { content: string; date: string; color: string }
): Promise<ProgressNoteResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  if (!data.content.trim())
    return { success: false, error: "El contenido es obligatorio" };

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime()))
    return { success: false, error: "Fecha inválida" };

  await prisma.progressNote.create({
    data: {
      clientId,
      content: data.content.trim(),
      date: dateObj,
      color: data.color || "#3b82f6",
    },
  });

  revalidatePath("/client/dashboard");
  revalidatePath("/admin/clients", "layout");
  return { success: true };
}

// S1: ADMIN only
export async function updateProgressNote(
  noteId: string,
  data: { content: string; date: string; color: string }
): Promise<ProgressNoteResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  if (!data.content.trim())
    return { success: false, error: "El contenido es obligatorio" };

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime()))
    return { success: false, error: "Fecha inválida" };

  await prisma.progressNote.update({
    where: { id: noteId },
    data: {
      content: data.content.trim(),
      date: dateObj,
      color: data.color || "#3b82f6",
    },
  });

  revalidatePath("/client/dashboard");
  revalidatePath("/admin/clients", "layout");
  return { success: true };
}

// S1: ADMIN only
export async function deleteProgressNote(
  noteId: string
): Promise<ProgressNoteResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  await prisma.progressNote.delete({ where: { id: noteId } });
  revalidatePath("/client/dashboard");
  revalidatePath("/admin/clients", "layout");
  return { success: true };
}
