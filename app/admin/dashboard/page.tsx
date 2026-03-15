import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getDashboardKPIs,
  getClientRevenueMatrix,
  getClientGrowthData,
  getYearComparisonData,
} from "@/lib/actions/dashboard-actions";
import { getSuggestions } from "@/lib/actions/suggestion-actions";
import { YearNav } from "@/components/dashboard/year-nav";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { TrendCharts } from "@/components/dashboard/trend-charts";
import { RevenueMatrix } from "@/components/dashboard/revenue-matrix";
import { ClientGrowthChart } from "@/components/dashboard/client-growth-chart";
import { YearComparison } from "@/components/dashboard/year-comparison";

interface Props {
  searchParams: Promise<{ year?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/");

  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  const [kpis, matrix, growth, yearComparison, allSuggestions] = await Promise.all([
    getDashboardKPIs(year),
    getClientRevenueMatrix(year),
    getClientGrowthData(year),
    getYearComparisonData(),
    getSuggestions(),
  ]);

  const unreadCount = allSuggestions.filter((s: { status: string }) => s.status === "unread").length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <YearNav year={year} />
      </div>

      {unreadCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-yellow-700 text-sm font-medium">
            📬 {unreadCount} {unreadCount === 1 ? "sugerencia sin leer" : "sugerencias sin leer"} de estudiantes
          </span>
          <Link href="/admin/clients" className="text-xs text-yellow-700 hover:underline font-semibold">
            Ver clientes →
          </Link>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Resumen Mensual
        </h2>
        <KPICards kpis={kpis} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Tendencias
        </h2>
        <TrendCharts kpis={kpis} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Matriz de Ingresos
        </h2>
        <RevenueMatrix matrix={matrix} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Clientes
        </h2>
        <ClientGrowthChart growth={growth} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Comparación Año vs Año
        </h2>
        <YearComparison data={yearComparison} />
      </section>
    </div>
  );
}
