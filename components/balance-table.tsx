import type { BalanceData } from "@/lib/actions/fetch-balance";

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  balance: BalanceData;
  previousMonthTotal: number | null;
}

export function BalanceTable({ balance, previousMonthTotal }: Props) {
  const growthPercent =
    previousMonthTotal === null
      ? null
      : previousMonthTotal === 0
        ? 100
        : ((balance.grandTotal - previousMonthTotal) / previousMonthTotal) * 100;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-xs md:text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="border border-blue-500 px-2 py-1.5 md:px-3 md:py-2 text-center">
              No.
            </th>
            <th className="border border-blue-500 px-2 py-1.5 md:px-3 md:py-2 text-left">
              Nombre del Cliente
            </th>
            <th className="border border-blue-500 px-2 py-1.5 md:px-3 md:py-2 text-right">
              Costo Individual
            </th>
            <th className="border border-blue-500 px-2 py-1.5 md:px-3 md:py-2 text-center">
              Horas
            </th>
            <th className="border border-blue-500 px-2 py-1.5 md:px-3 md:py-2 text-right">
              Dinero Total del Cliente (COP)
            </th>
          </tr>
        </thead>
        <tbody>
          {balance.entries.map((entry, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-center">
                {i + 1}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2">
                {entry.clientName}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right">
                {formatCOP(entry.individualCost)}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-center">
                {entry.hours % 1 === 0 ? entry.hours : entry.hours.toFixed(1)}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right font-medium">
                {formatCOP(entry.totalCost)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-yellow-100 font-bold">
            <td
              colSpan={4}
              className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right"
            >
              TOTAL
            </td>
            <td className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right">
              {formatCOP(balance.grandTotal)}
            </td>
          </tr>
          {growthPercent !== null && (
            <tr className="bg-yellow-50">
              <td
                colSpan={4}
                className="border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right text-sm text-gray-500"
              >
                vs. mes anterior
              </td>
              <td
                className={`border border-gray-300 px-2 py-1.5 md:px-3 md:py-2 text-right font-semibold text-sm ${
                  growthPercent > 0
                    ? "text-green-600"
                    : growthPercent < 0
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                {growthPercent > 0
                  ? `↑ +${growthPercent.toFixed(1)}%`
                  : growthPercent < 0
                    ? `↓ ${growthPercent.toFixed(1)}%`
                    : "— 0%"}
              </td>
            </tr>
          )}
        </tfoot>
      </table>
      <p className="text-xs text-gray-400 mt-2">
        Generado: {new Date(balance.createdAt).toLocaleString("es-CO")}
      </p>
    </div>
  );
}
