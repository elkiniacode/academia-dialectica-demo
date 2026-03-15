"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createLead(data: {
  name: string;
  email: string;
  phone?: string;
  gameScore?: number;
  difficulty?: string;
}): Promise<{ success: boolean; error?: string }> {
  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const phone = data.phone?.trim() || null;
  const gameScore = data.gameScore ?? null;
  const difficulty = data.difficulty?.trim() || null;

  if (!name || !email) {
    return { success: false, error: "El nombre y correo son obligatorios." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "El formato del correo es inválido." };
  }

  try {
    await prisma.lead.create({
      data: { name, email, phone, gameScore, difficulty },
    });

    revalidatePath("/admin/leads");

    return { success: true };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { success: false, error: "Este correo ya está registrado." };
    }
    console.error("createLead error:", error);
    return { success: false, error: "Error al registrar. Intenta de nuevo." };
  }
}

export async function getLeads(limit: number = 100) {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  return prisma.lead.findMany({
    take: limit,
    orderBy: { number: "desc" },
  });
}

export async function getLeadsByRange(from: number, to: number) {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  const min = Math.min(from, to);
  const max = Math.max(from, to);

  return prisma.lead.findMany({
    where: {
      number: { gte: min, lte: max },
    },
    orderBy: { number: "asc" },
  });
}
