import { auth } from "@/lib/auth";
import {
  fetchMonthlyBalance,
  getAvailableBalances,
  getPreviousMonthTotal,
} from "@/lib/actions/fetch-balance";
import { MonthTabs } from "@/components/month-tabs";
import { BalanceTable } from "@/components/balance-table";
import { GenerateButton } from "@/components/generate-button";

const MONTH_NAMES = [
  "",
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
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function BalancePage({ searchParams }: Props) {
  await auth();

  const params = await searchParams;
  const year = parseInt(params.year ?? String(new Date().getFullYear()));
  const month = parseInt(params.month ?? String(new Date().getMonth() + 1));

  const [balance, availableBalances, previousMonthTotal] = await Promise.all([
    fetchMonthlyBalance(year, month),
    getAvailableBalances(),
    getPreviousMonthTotal(year, month),
  ]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Balance Mensual &mdash; {MONTH_NAMES[month]} {year}
      </h1>

      <MonthTabs
        year={year}
        currentMonth={month}
        availableBalances={availableBalances}
      />

      {balance ? (
        <>
          <BalanceTable balance={balance} previousMonthTotal={previousMonthTotal} />
          <div className="mt-4 flex justify-end">
            <GenerateButton
              year={year}
              month={month}
              label="Regenerar Balance"
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">
            No hay balance generado para {MONTH_NAMES[month]} {year}.
          </p>
          <GenerateButton year={year} month={month} />
        </div>
      )}
    </div>
  );
}
