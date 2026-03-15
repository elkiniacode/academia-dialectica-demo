"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface BalanceData {
  id: string;
  year: number;
  month: number;
  status: string;
  createdAt: string;
  entries: {
    clientName: string;
    individualCost: number;
    hours: number;
    totalCost: number;
  }[];
  grandTotal: number;
}

export async function fetchMonthlyBalance(
  year: number,
  month: number
): Promise<BalanceData | null> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return null;

  const balance = await prisma.monthlyBalance.findUnique({
    where: { year_month: { year, month } },
    include: {
      entries: {
        orderBy: { clientName: "asc" },
      },
    },
  });

  if (!balance) return null;

  const grandTotal = balance.entries.reduce((sum, e) => sum + e.totalCost, 0);

  return {
    id: balance.id,
    year: balance.year,
    month: balance.month,
    status: balance.status,
    createdAt: balance.createdAt.toISOString(),
    entries: balance.entries.map((e) => ({
      clientName: e.clientName,
      individualCost: e.individualCost,
      hours: e.hours,
      totalCost: e.totalCost,
    })),
    grandTotal,
  };
}

export async function getPreviousMonthTotal(
  year: number,
  month: number
): Promise<number | null> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return null;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const balance = await prisma.monthlyBalance.findUnique({
    where: { year_month: { year: prevYear, month: prevMonth } },
    include: { entries: { select: { totalCost: true } } },
  });

  if (!balance) return null;
  return balance.entries.reduce((sum, e) => sum + e.totalCost, 0);
}

export async function getAvailableBalances(): Promise<
  { year: number; month: number }[]
> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  const balances = await prisma.monthlyBalance.findMany({
    select: { year: true, month: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return balances;
}
