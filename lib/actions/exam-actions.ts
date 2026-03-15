"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ExamResult {
  success: boolean;
  error?: string;
}

// S2: For CLIENT role, always use session.userId — ignore clientId argument
export async function getExams(clientId?: string) {
  const session = await auth();
  if (!session) return [];

  const resolvedClientId =
    session.role === "CLIENT" ? session.userId : clientId;
  if (!resolvedClientId) return [];

  return prisma.exam.findMany({
    where: { clientId: resolvedClientId },
    orderBy: { date: "desc" },
  });
}

// S1: ADMIN only
export async function createExam(
  clientId: string,
  data: { title: string; score: number; date: string; commentary: string }
): Promise<ExamResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  if (!data.title.trim()) return { success: false, error: "El título es obligatorio" };
  if (isNaN(data.score)) return { success: false, error: "La nota es inválida" };

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) return { success: false, error: "Fecha inválida" };

  await prisma.exam.create({
    data: {
      clientId,
      title: data.title.trim(),
      score: data.score,
      date: dateObj,
      commentary: data.commentary.trim(),
    },
  });

  revalidatePath("/client/dashboard");
  revalidatePath("/admin/clients", "layout");
  return { success: true };
}

// S1: ADMIN only
export async function updateExam(
  examId: string,
  data: { title: string; score: number; date: string; commentary: string }
): Promise<ExamResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  if (!data.title.trim()) return { success: false, error: "El título es obligatorio" };
  if (isNaN(data.score)) return { success: false, error: "La nota es inválida" };

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) return { success: false, error: "Fecha inválida" };

  await prisma.exam.update({
    where: { id: examId },
    data: {
      title: data.title.trim(),
      score: data.score,
      date: dateObj,
      commentary: data.commentary.trim(),
    },
  });

  revalidatePath("/client/dashboard");
  revalidatePath("/admin/clients", "layout");
  return { success: true };
}

// S1: ADMIN only
export async function deleteExam(examId: string): Promise<ExamResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  await prisma.exam.delete({ where: { id: examId } });
  revalidatePath("/client/dashboard");
  revalidatePath("/admin/clients", "layout");
  return { success: true };
}
