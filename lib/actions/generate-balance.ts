"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassSessions } from "@/lib/google-calendar";

export interface GenerateBalanceResult {
  success: boolean;
  balanceId?: string;
  entryCount?: number;
  skippedClients?: string[];
  error?: string;
}

export async function generateMonthlyBalance(
  year: number,
  month: number
): Promise<GenerateBalanceResult> {
  const session = await auth();
  if (!session?.accessToken || session.role !== "ADMIN") {
    return { success: false, error: "No autorizado" };
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const classSessions = await getClassSessions(
    session.accessToken,
    startDate,
    endDate
  );

  // Aggregate by client name: sum hours
  const aggregated = new Map<string, number>();
  for (const cs of classSessions) {
    aggregated.set(cs.clientName, (aggregated.get(cs.clientName) ?? 0) + cs.durationHours);
  }

  // Normalize a name: strip accents (preserving ñ), trim, lowercase for comparison
  const normalizeKey = (n: string) =>
    n.normalize("NFD").replace(/[\u0300-\u0302\u0304-\u036f]/g, "").trim().toLowerCase();

  // Look up all clients and build a normalized-key → client map
  const clientNames = [...aggregated.keys()];
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, hourlyRate: true },
  });
  const clientMap = new Map(clients.map((c) => [normalizeKey(c.name), c]));

  const skippedClients: string[] = [];

  // Delete existing balance for this month (allows regeneration)
  await prisma.monthlyBalance.deleteMany({ where: { year, month } });

  // Create balance + entries
  const balance = await prisma.monthlyBalance.create({
    data: {
      year,
      month,
      entries: {
        create: clientNames
          .filter((name) => {
            if (!clientMap.has(normalizeKey(name))) {
              skippedClients.push(name);
              return false;
            }
            return true;
          })
          .map((name) => {
            const client = clientMap.get(normalizeKey(name))!;
            const hours = Math.round(aggregated.get(name)! * 100) / 100;
            return {
              clientId: client.id,
              clientName: client.name,
              individualCost: client.hourlyRate,
              hours,
              totalCost: client.hourlyRate * hours,
            };
          }),
      },
    },
    include: { entries: true },
  });

  return {
    success: true,
    balanceId: balance.id,
    entryCount: balance.entries.length,
    skippedClients: skippedClients.length > 0 ? skippedClients : undefined,
  };
}
