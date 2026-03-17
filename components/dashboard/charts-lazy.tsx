"use client";

import dynamic from "next/dynamic";
import type { MonthlyKPI, ClientGrowthMonth, YearComparisonData } from "@/lib/actions/dashboard-actions";

const TrendCharts = dynamic(
  () => import("@/components/dashboard/trend-charts").then((m) => m.TrendCharts),
  { ssr: false }
);

const ClientGrowthChart = dynamic(
  () => import("@/components/dashboard/client-growth-chart").then((m) => m.ClientGrowthChart),
  { ssr: false }
);

const YearComparison = dynamic(
  () => import("@/components/dashboard/year-comparison").then((m) => m.YearComparison),
  { ssr: false }
);

export function TrendChartsLazy({ kpis }: { kpis: MonthlyKPI[] }) {
  return <TrendCharts kpis={kpis} />;
}

export function ClientGrowthChartLazy({ growth }: { growth: ClientGrowthMonth[] }) {
  return <ClientGrowthChart growth={growth} />;
}

export function YearComparisonLazy({ data }: { data: YearComparisonData }) {
  return <YearComparison data={data} />;
}
