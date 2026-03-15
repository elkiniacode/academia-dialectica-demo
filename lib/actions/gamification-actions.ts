"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface GamificationResult {
  success: boolean;
  error?: string;
}

const VALID_CLASSES = ["guerrero", "mago", "explorador"];

// S1: ADMIN only
export async function updateClientStats(
  clientId: string,
  hpChange: number,
  xpChange: number
): Promise<GamificationResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  if (isNaN(hpChange) || isNaN(xpChange))
    return { success: false, error: "Valores inválidos" };

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { hp: true, xp: true },
  });
  if (!client) return { success: false, error: "Cliente no encontrado" };

  const newHp = Math.max(0, Math.min(100, client.hp + hpChange));
  const newXp = Math.max(0, client.xp + xpChange);
  const newLevel = Math.floor(newXp / 100) + 1;

  await prisma.client.update({
    where: { id: clientId },
    data: { hp: newHp, xp: newXp, level: newLevel },
  });

  revalidatePath("/admin/clients", "layout");
  revalidatePath("/client/dashboard");
  return { success: true };
}

// S2: CLIENT only — uses session.userId, must match clientId (IDOR prevention)
export async function initializeCharacter(
  clientId: string,
  name: string,
  charClass: string
): Promise<GamificationResult> {
  const session = await auth();
  if (!session || !session.userId)
    return { success: false, error: "No autorizado" };

  // IDOR prevention: CLIENT can only set their own character
  if (session.userId !== clientId)
    return { success: false, error: "No autorizado" };

  const trimmedName = name.trim();
  if (!trimmedName)
    return { success: false, error: "El nombre es obligatorio" };

  const lowerClass = charClass.toLowerCase();
  if (!VALID_CLASSES.includes(lowerClass))
    return { success: false, error: "Clase inválida" };

  // Only allow one-time setup
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { characterName: true },
  });
  if (!client) return { success: false, error: "Cliente no encontrado" };
  if (client.characterName !== null)
    return { success: false, error: "El personaje ya fue creado" };

  await prisma.client.update({
    where: { id: clientId },
    data: { characterName: trimmedName, characterClass: lowerClass },
  });

  revalidatePath("/client/dashboard");
  return { success: true };
}
