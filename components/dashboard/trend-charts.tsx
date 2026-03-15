"use client";

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { MonthlyKPI } from "@/lib/actions/dashboard-actions";

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  kpis: MonthlyKPI[];
}

export function TrendCharts({ kpis }: Props) {
  const chartData = kpis.map((k) => ({
    name: MONTH_SHORT[k.month - 1],
    revenue: k.totalRevenue,
    classes: k.totalClasses,
    avgCost: k.avgCostPerClass,
  }));

  const hasAnyData = kpis.some((k) => k.totalRevenue > 0);

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        No hay datos de tendencia para este año
      </div>
    );
  }

  const monthsWithRevenue = kpis.filter((k) => k.totalRevenue > 0);
  const avgRevenue = monthsWithRevenue.length > 0
    ? monthsWithRevenue.reduce((a, b) => a + b.totalRevenue, 0) / monthsWithRevenue.length
    : 0;

  const avgClasses = monthsWithRevenue.length > 0
    ? monthsWithRevenue.reduce((a, b) => a + b.totalClasses, 0) / monthsWithRevenue.length
    : 0;

  const avgCostPerClass = monthsWithRevenue.length > 0
    ? monthsWithRevenue.reduce((a, b) => a + b.avgCostPerClass, 0) / monthsWithRevenue.length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Ingresos por Mes
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              labelFormatter={(label) => `Mes: ${label}`}
              formatter={(value) => [formatCOP(Number(value)), "Ingresos"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <ReferenceLine
              y={avgRevenue}
              label={{ value: "Promedio", position: "right", fill: "#94a3b8", fontSize: 10 }}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2563eb" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Clases por Mes
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) => `Mes: ${label}`}
              formatter={(value) => [Number(value).toFixed(1), "Clases"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <ReferenceLine
              y={avgClasses}
              label={{ value: "Promedio", position: "right", fill: "#94a3b8", fontSize: 10 }}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />
            <Bar dataKey="classes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Promedio Costo/Clase por Mes
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              labelFormatter={(label) => `Mes: ${label}`}
              formatter={(value) => [formatCOP(Number(value)), "Costo/Clase"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <ReferenceLine
              y={avgCostPerClass}
              label={{ value: "Promedio", position: "right", fill: "#94a3b8", fontSize: 10 }}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="avgCost"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
