"use client";

import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { YearComparisonData } from "@/lib/actions/dashboard-actions";

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const YEAR_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#f59e0b"];

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  data: YearComparisonData;
}

export function YearComparison({ data }: Props) {
  const { years, annualRevenue, monthlyData } = data;

  if (years.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        No hay datos para comparar entre años
      </div>
    );
  }

  // Annual revenue bar chart data
  const annualData = years.map((yr, i) => ({
    name: String(yr),
    revenue: annualRevenue[yr],
    fill: YEAR_COLORS[i % YEAR_COLORS.length],
  }));

  // Monthly overlay data for line charts
  const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
    const point: Record<string, string | number | null> = { name: MONTH_SHORT[i] };
    for (const yr of years) {
      const m = monthlyData[yr]?.[i];
      point[`classes_${yr}`] = m?.classes ?? null;
      point[`avgCost_${yr}`] = m?.avgCost ?? null;
    }
    return point;
  });

  // Custom tooltip showing all years at once for seasonal comparison
  const MultiYearTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number | null; color: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload
          .filter((p) => p.value != null)
          .map((p) => (
            <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
              <span>{p.name.replace(/.*_/, "")}</span>
              <span className="font-medium">
                {p.name.startsWith("avgCost")
                  ? formatCOP(p.value!)
                  : p.value!.toFixed(1)}
              </span>
            </p>
          ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Annual revenue bar chart */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Ingresos por Año
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={annualData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value) => [formatCOP(Number(value)), "Ingresos"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {annualData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly overlay line charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Clases por Mes vs Año
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<MultiYearTooltip />} />
              <Legend />
              {years.map((yr, i) => (
                <Line
                  key={yr}
                  type="monotone"
                  dataKey={`classes_${yr}`}
                  name={String(yr)}
                  stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Costo/Clase por Mes vs Año
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<MultiYearTooltip />} />
              <Legend />
              {years.map((yr, i) => (
                <Line
                  key={yr}
                  type="monotone"
                  dataKey={`avgCost_${yr}`}
                  name={String(yr)}
                  stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
