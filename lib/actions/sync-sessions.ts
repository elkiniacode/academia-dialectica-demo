"use server";

import { prisma } from "@/lib/prisma";
import type { ClassSession } from "@/lib/google-calendar";

export interface SyncResult {
  synced: number;
  skippedUnknownClients: string[];
}

/**
 * Matches ClassSession[] records against the Client table, calculates the cost,
 * and upserts each session keyed on eventId to prevent duplicates.
 */
export async function syncSessionsToDatabase(
  sessions: ClassSession[]
): Promise<SyncResult> {
  if (sessions.length === 0) return { synced: 0, skippedUnknownClients: [] };

  // Collect the unique client names present in this batch
  const uniqueNames = [...new Set(sessions.map((s) => s.clientName))];

  // Fetch only the clients we actually need (case-sensitive match via DB)
  const clients = await prisma.client.findMany({
    where: { name: { in: uniqueNames } },
  });

  const clientMap = new Map(clients.map((c) => [c.name, c]));

  const skippedUnknownClients: string[] = [];
  let synced = 0;

  // Upsert in a transaction so we either persist all or none
  await prisma.$transaction(
    sessions.map((session) => {
      const client = clientMap.get(session.clientName);

      if (!client) {
        // Collect unknowns outside the transaction map — just record and skip
        if (!skippedUnknownClients.includes(session.clientName)) {
          skippedUnknownClients.push(session.clientName);
        }
        // Return a no-op query so the transaction array stays valid
        return prisma.$queryRaw`SELECT 1`;
      }

      const calculatedCost =
        Math.round(session.durationHours * client.hourlyRate * 100) / 100;

      synced++;

      return prisma.session.upsert({
        where: { eventId: session.eventId },
        update: {
          date: new Date(session.date),
          durationHours: session.durationHours,
          calculatedCost,
        },
        create: {
          eventId: session.eventId,
          clientId: client.id,
          date: new Date(session.date),
          durationHours: session.durationHours,
          calculatedCost,
        },
      });
    })
  );

  return { synced, skippedUnknownClients };
}
