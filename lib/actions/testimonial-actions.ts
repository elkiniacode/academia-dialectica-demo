"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getTestimonials() {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  return prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createTestimonial(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { success: false, error: "No autorizado" };
  if (session.userId) return { success: false, error: "La cuenta demo no puede crear testimonios" };

  const clientName = formData.get("clientName")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const ratingStr = formData.get("rating")?.toString().trim();

  if (!clientName)
    return { success: false, error: "El nombre del cliente es obligatorio" };
  if (!content)
    return { success: false, error: "El contenido es obligatorio" };

  const rating = ratingStr ? parseInt(ratingStr) : null;
  if (rating !== null && (isNaN(rating) || rating < 1 || rating > 5))
    return { success: false, error: "La puntuacion debe ser entre 1 y 5" };

  await prisma.testimonial.create({
    data: { clientName, content, rating },
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateTestimonial(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { success: false, error: "No autorizado" };
  if (session.userId) return { success: false, error: "La cuenta demo no puede editar testimonios" };

  const clientName = formData.get("clientName")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const ratingStr = formData.get("rating")?.toString().trim();

  if (!clientName)
    return { success: false, error: "El nombre del cliente es obligatorio" };
  if (!content)
    return { success: false, error: "El contenido es obligatorio" };

  const rating = ratingStr ? parseInt(ratingStr) : null;
  if (rating !== null && (isNaN(rating) || rating < 1 || rating > 5))
    return { success: false, error: "La puntuacion debe ser entre 1 y 5" };

  await prisma.testimonial.update({
    where: { id },
    data: { clientName, content, rating },
  });

  revalidatePath("/");
  return { success: true };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { success: false, error: "No autorizado" };
  if (session.userId) return { success: false, error: "La cuenta demo no puede eliminar testimonios" };

  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/");
  return { success: true };
}

export async function toggleTestimonialVisibility(
  id: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { success: false, error: "No autorizado" };
  if (session.userId) return { success: false, error: "La cuenta demo no puede modificar testimonios" };

  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial)
    return { success: false, error: "Testimonio no encontrado" };

  await prisma.testimonial.update({
    where: { id },
    data: { visible: !testimonial.visible },
  });

  revalidatePath("/");
  return { success: true };
}
