"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getStories() {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  return prisma.story.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createStory(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { success: false, error: "No autorizado" };
  if (session.userId) return { success: false, error: "La cuenta demo no puede crear historias" };

  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const imageUrl = formData.get("imageUrl")?.toString().trim() || null;

  if (!title) return { success: false, error: "El titulo es obligatorio" };
  if (!content)
    return { success: false, error: "El contenido es obligatorio" };

  await prisma.story.create({
    data: { title, content, imageUrl },
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateStory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { success: false, error: "No autorizado" };
  if (session.userId) return { success: false, error: "La cuenta demo no puede editar historias" };

  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const imageUrl = formData.get("imageUrl")?.toString().trim() || null;

  if (!title) return { success: false, error: "El titulo es obligatorio" };
  if (!content)
    return { success: false, error: "El contenido es obligatorio" };

  await prisma.story.update({
    where: { id },
    data: { title, content, imageUrl },
  });

  revalidatePath("/");
  return { success: true };
}

export async function deleteStory(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { success: false, error: "No autorizado" };
  if (session.userId) return { success: false, error: "La cuenta demo no puede eliminar historias" };

  await prisma.story.delete({ where: { id } });
  revalidatePath("/");
  return { success: true };
}

export async function toggleStoryVisibility(
  id: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { success: false, error: "No autorizado" };
  if (session.userId) return { success: false, error: "La cuenta demo no puede modificar historias" };

  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) return { success: false, error: "Historia no encontrada" };

  await prisma.story.update({
    where: { id },
    data: { visible: !story.visible },
  });

  revalidatePath("/");
  return { success: true };
}
