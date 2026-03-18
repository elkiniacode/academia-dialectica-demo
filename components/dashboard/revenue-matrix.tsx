"use client";

import type { ClientRevenueMatrix } from "@/lib/actions/dashboard-actions";

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
  matrix: ClientRevenueMatrix;
}

export function RevenueMatrix({ matrix }: Props) {
  if (matrix.clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        No hay datos de clientes para este año
      </div>
    );
  }

  const activeMonths = matrix.monthTotals
    .map((total, i) => ({ index: i, total }))
    .filter((m) => m.total > 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 p-4 pb-0">
        Ingresos por Cliente / Mes
      </h3>
      <div className="overflow-x-auto p-4 pt-3">
        <table className="w-full border-collapse border border-gray-300 text-xs md:text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-blue-500 px-2 py-1.5 md:px-3 md:py-2 text-left sticky left-0 bg-blue-600 z-10 border-r-2 border-r-blue-400 min-w-[100px] md:min-w-[140px]">
                Cliente
              </th>
              {activeMonths.map((m) => (
                <th key={m.index} className="border border-blue-500 px-2 py-1.5 md:px-3 md:py-2 text-right min-w-[80px] md:min-w-[110px]">
                  {MONTH_SHORT[m.index]}
                </th>
              ))}
              <th className="border border-blue-500 px-2 py-1.5 md:px-3 md:py-2 text-right min-w-[120px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.clients.map((client, i) => {
              const rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50";
              return (
                <tr key={client} className={`${rowBg} hover:bg-blue-50/50 transition-colors group`}>
                  <td className={`border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 font-medium sticky left-0 z-10 border-r-2 border-r-gray-200 ${rowBg} group-hover:bg-blue-50/50`}>
                    {client}
                  </td>
                  {activeMonths.map((m) => {
                    const val = matrix.data[client][m.index];
                    return (
                      <td key={m.index} className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right">
                        {val > 0 ? formatCOP(val) : "—"}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right font-medium">
                    {formatCOP(matrix.clientTotals[client])}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-yellow-100 font-bold">
              <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right sticky left-0 bg-yellow-100 z-10 border-r-2 border-r-gray-200">
                TOTAL
              </td>
              {activeMonths.map((m) => (
                <td key={m.index} className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right">
                  {formatCOP(matrix.monthTotals[m.index])}
                </td>
              ))}
              <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right">
                {formatCOP(matrix.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
