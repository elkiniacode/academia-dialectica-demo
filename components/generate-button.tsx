"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateMonthlyBalance } from "@/lib/actions/generate-balance";

interface Props {
  year: number;
  month: number;
  label?: string;
}

export function GenerateButton({
  year,
  month,
  label = "Generar Balance",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[] | null>(null);
  const router = useRouter();

  const handleClick = () => {
    setError(null);
    setSkipped(null);
    startTransition(async () => {
      const result = await generateMonthlyBalance(year, month);
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        if (result.skippedClients) {
          setSkipped(result.skippedClients);
        }
        router.refresh();
      }
    });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Generando..." : label}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {skipped && (
        <p className="text-amber-600 text-sm mt-2">
          Clientes no encontrados: {skipped.join(", ")}
        </p>
      )}
    </div>
  );
}
