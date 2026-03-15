"use client";

import { useRouter } from "next/navigation";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

interface Props {
  year: number;
  currentMonth: number;
  availableBalances: { year: number; month: number }[];
}

export function MonthTabs({ year, currentMonth, availableBalances }: Props) {
  const router = useRouter();

  const hasBalance = (m: number) =>
    availableBalances.some((b) => b.year === year && b.month === m);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() =>
            router.push(`/balance?year=${year - 1}&month=${currentMonth}`)
          }
          className="px-2 py-1 text-gray-500 hover:text-gray-800"
        >
          &larr;
        </button>
        <span className="font-semibold text-lg">{year}</span>
        <button
          onClick={() =>
            router.push(`/balance?year=${year + 1}&month=${currentMonth}`)
          }
          className="px-2 py-1 text-gray-500 hover:text-gray-800"
        >
          &rarr;
        </button>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b">
        {MONTH_NAMES.map((name, i) => {
          const month = i + 1;
          const isActive = month === currentMonth;
          const exists = hasBalance(month);
          return (
            <button
              key={month}
              onClick={() =>
                router.push(`/balance?year=${year}&month=${month}`)
              }
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : exists
                    ? "border-green-400 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
