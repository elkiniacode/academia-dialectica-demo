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
import { RevenueMatrix } from "@/components/dashboard/revenue-matrix";
import { TrendChartsLazy as TrendCharts, ClientGrowthChartLazy as ClientGrowthChart, YearComparisonLazy as YearComparison } from "@/components/dashboard/charts-lazy";

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
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen financiero y académico de tu academia. Usa las flechas para cambiar de año.
          </p>
        </div>
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Resumen Mensual
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Ingresos totales, horas de clase y promedios de cada mes del año seleccionado.
        </p>
        <KPICards kpis={kpis} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Tendencias
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Gráficas de ingresos y horas mes a mes para identificar picos y caídas durante el año.
        </p>
        <TrendCharts kpis={kpis} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Matriz de Ingresos
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Cuánto generó cada cliente por mes. Útil para ver quiénes son tus clientes más activos y en qué meses hay más actividad.
        </p>
        <RevenueMatrix matrix={matrix} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Crecimiento de Clientes
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Clientes nuevos vs. clientes activos por mes. Te muestra si tu academia está creciendo o si hay deserción.
        </p>
        <ClientGrowthChart growth={growth} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Comparación Año vs Año
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Compara ingresos anuales, clases mensuales y costo promedio entre los últimos 3 años para ver el crecimiento de tu negocio.
        </p>
        <YearComparison data={yearComparison} />
      </section>
    </div>
  );
}
