"use client";

import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ClientGrowthMonth } from "@/lib/actions/dashboard-actions";

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

interface Props {
  growth: ClientGrowthMonth[];
}

export function ClientGrowthChart({ growth }: Props) {
  const hasAnyData = growth.some((g) => g.newClients > 0 || g.activeClients > 0);

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        No hay datos de crecimiento de clientes para este año
      </div>
    );
  }

  const chartData = growth.map((g) => ({
    name: MONTH_SHORT[g.month - 1],
    nuevos: g.newClients,
    activos: g.activeClients,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Crecimiento de Clientes
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            labelFormatter={(label) => `Mes: ${label}`}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="nuevos" name="Clientes Nuevos" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="activos" name="Clientes Activos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
