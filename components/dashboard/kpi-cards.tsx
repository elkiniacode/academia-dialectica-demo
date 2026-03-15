"use client";

import { useState, useEffect } from "react";
import type { MonthlyKPI } from "@/lib/actions/dashboard-actions";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
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

export function KPICards({ kpis }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthsWithData = kpis.filter((k) => k.totalRevenue > 0);
    return monthsWithData.length > 0
      ? monthsWithData[monthsWithData.length - 1].month
      : new Date().getMonth() + 1;
  });

  useEffect(() => {
    const activeMonths = kpis.filter((k) => k.totalRevenue > 0);
    if (activeMonths.length > 0) {
      setSelectedMonth(activeMonths[activeMonths.length - 1].month);
    } else {
      setSelectedMonth(new Date().getMonth() + 1);
    }
  }, [kpis]);

  const kpi = kpis.find((k) => k.month === selectedMonth);
  const hasData = (kpi?.totalRevenue ?? 0) > 0;

  const cards = [
    { label: "Dinero Total", value: hasData ? formatCOP(kpi!.totalRevenue) : "—" },
    { label: "Total Clases", value: hasData ? kpi!.totalClasses.toFixed(1) : "—" },
    { label: "Promedio Costo/Clase", value: hasData ? formatCOP(kpi!.avgCostPerClass) : "—" },
    { label: "Promedio Clases/Semana", value: hasData ? kpi!.avgClassesPerWeek.toFixed(2) : "—" },
    { label: "Promedio Clases/Dia", value: hasData ? kpi!.avgClassesPerDay.toFixed(2) : "—" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1;
          const monthHasData = kpis.find((k) => k.month === m && k.totalRevenue > 0);
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedMonth === m
                  ? "bg-blue-600 text-white"
                  : monthHasData
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-default"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-xl font-bold mt-1 ${hasData ? "text-gray-800" : "text-gray-300"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
