"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyKPI {
  month: number;
  totalRevenue: number;
  totalHours: number;
  totalClasses: number;
  avgCostPerClass: number;
  avgClassesPerWeek: number;
  avgClassesPerDay: number;
}

export interface ClientRevenueMatrix {
  clients: string[];
  data: Record<string, number[]>;
  monthTotals: number[];
  clientTotals: Record<string, number>;
  grandTotal: number;
}

export interface ClientGrowthMonth {
  month: number;
  newClients: number;
  activeClients: number;
}

export interface YearComparisonData {
  years: number[];
  annualRevenue: Record<number, number>;
  monthlyData: Record<number, { month: number; classes: number | null; avgCost: number | null }[]>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekdaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let weekdays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) weekdays++;
  }
  return weekdays;
}

function getWeeksInMonth(year: number, month: number): number {
  const weekdays = getWeekdaysInMonth(year, month);
  return weekdays / 5;
}

// ── Server Actions ───────────────────────────────────────────────────────────

export async function getDashboardKPIs(
  year: number
): Promise<MonthlyKPI[]> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  const balances = await prisma.monthlyBalance.findMany({
    where: { year },
    include: { entries: true },
  });

  const result: MonthlyKPI[] = [];

  for (let m = 1; m <= 12; m++) {
    const b = balances.find((bal) => bal.month === m);
    const weekdays = getWeekdaysInMonth(year, m);
    const weeks = getWeeksInMonth(year, m);

    if (b) {
      const totalRevenue = b.entries.reduce((sum, e) => sum + e.totalCost, 0);
      const totalHours = b.entries.reduce((sum, e) => sum + e.hours, 0);
      const totalClasses = totalHours / 2;

      result.push({
        month: m,
        totalRevenue,
        totalHours,
        totalClasses,
        avgCostPerClass: totalClasses > 0 ? totalRevenue / totalClasses : 0,
        avgClassesPerWeek: weeks > 0 ? totalClasses / weeks : 0,
        avgClassesPerDay: weekdays > 0 ? totalClasses / weekdays : 0,
      });
    } else {
      result.push({
        month: m,
        totalRevenue: 0,
        totalHours: 0,
        totalClasses: 0,
        avgCostPerClass: 0,
        avgClassesPerWeek: 0,
        avgClassesPerDay: 0,
      });
    }
  }

  return result;
}

export async function getClientRevenueMatrix(
  year: number
): Promise<ClientRevenueMatrix> {
  const session = await auth();
  if (!session) {
    return { clients: [], data: {}, monthTotals: Array(12).fill(0), clientTotals: {}, grandTotal: 0 };
  }

  const balances = await prisma.monthlyBalance.findMany({
    where: { year },
    include: { entries: true },
  });

  const data: Record<string, number[]> = {};
  const monthTotals = Array(12).fill(0) as number[];

  for (const b of balances) {
    const mi = b.month - 1;
    for (const e of b.entries) {
      if (!data[e.clientName]) {
        data[e.clientName] = Array(12).fill(0);
      }
      data[e.clientName][mi] += e.totalCost;
      monthTotals[mi] += e.totalCost;
    }
  }

  const clientTotals: Record<string, number> = {};
  for (const name of Object.keys(data)) {
    clientTotals[name] = data[name].reduce((a, b) => a + b, 0);
  }
  const clients = Object.keys(data).sort((a, b) => clientTotals[b] - clientTotals[a]);
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);

  return { clients, data, monthTotals, clientTotals, grandTotal };
}

export async function getClientGrowthData(
  year: number
): Promise<ClientGrowthMonth[]> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  const [allClients, balances] = await Promise.all([
    prisma.client.findMany({ select: { id: true, createdAt: true } }),
    prisma.monthlyBalance.findMany({
      where: { year },
      include: { entries: { select: { clientId: true } } },
    }),
  ]);

  const result: ClientGrowthMonth[] = [];

  for (let m = 1; m <= 12; m++) {
    const newClients = allClients.filter((c) => {
      const d = c.createdAt;
      return d.getFullYear() === year && d.getMonth() + 1 === m;
    }).length;

    const balance = balances.find((b) => b.month === m);
    const activeClients = balance
      ? new Set(balance.entries.map((e) => e.clientId)).size
      : 0;

    result.push({ month: m, newClients, activeClients });
  }

  return result;
}

export async function getYearComparisonData(): Promise<YearComparisonData> {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return { years: [], annualRevenue: {}, monthlyData: {} };

  const distinctYears = await prisma.monthlyBalance.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "asc" },
  });

  const years = distinctYears.map((b) => b.year).slice(-3);
  if (years.length === 0) return { years: [], annualRevenue: {}, monthlyData: {} };

  const balances = await prisma.monthlyBalance.findMany({
    where: { year: { in: years } },
    include: { entries: true },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const annualRevenue: Record<number, number> = {};
  const monthlyData: YearComparisonData["monthlyData"] = {};

  for (const yr of years) {
    const yearBalances = balances.filter((b) => b.year === yr);
    let annualTotal = 0;
    const monthly: YearComparisonData["monthlyData"][number] = [];

    for (let m = 1; m <= 12; m++) {
      if (yr === currentYear && m > currentMonth) {
        monthly.push({ month: m, classes: null, avgCost: null });
        continue;
      }

      const b = yearBalances.find((bal) => bal.month === m);
      if (b) {
        const revenue = b.entries.reduce((s, e) => s + e.totalCost, 0);
        const hours = b.entries.reduce((s, e) => s + e.hours, 0);
        const classes = hours / 2;
        annualTotal += revenue;
        monthly.push({
          month: m,
          classes,
          avgCost: classes > 0 ? revenue / classes : 0,
        });
      } else {
        monthly.push({ month: m, classes: 0, avgCost: 0 });
      }
    }

    annualRevenue[yr] = annualTotal;
    monthlyData[yr] = monthly;
  }

  return { years, annualRevenue, monthlyData };
}
