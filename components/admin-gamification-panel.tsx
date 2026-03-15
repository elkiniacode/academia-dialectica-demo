"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClientStats } from "@/lib/actions/gamification-actions";

interface Props {
  clientId: string;
  initialHp: number;
  initialXp: number;
  level: number;
}

export function AdminGamificationPanel({
  clientId,
  initialHp,
  initialXp,
  level,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hpChange, setHpChange] = useState("");
  const [xpChange, setXpChange] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hp = parseInt(hpChange || "0", 10);
    const xp = parseInt(xpChange || "0", 10);
    if (hp === 0 && xp === 0) return;

    setError(null);
    startTransition(async () => {
      const result = await updateClientStats(clientId, hp, xp);
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        setHpChange("");
        setXpChange("");
        router.refresh();
      }
    });
  }

  const hpPercent = Math.round((initialHp / 100) * 100);

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Gamificacion
      </h2>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-100 space-y-4">
        {/* Current stats */}
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-400 uppercase">HP</p>
            <p className="text-lg font-bold text-gray-800">{initialHp}/100</p>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-400 uppercase">XP</p>
            <p className="text-lg font-bold text-gray-800">{initialXp}</p>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-400 uppercase">Nivel</p>
            <p className="text-lg font-bold text-blue-600">{level}</p>
          </div>
        </div>

        {/* HP bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>HP</span>
            <span>{initialHp}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                hpPercent > 50
                  ? "bg-green-500"
                  : hpPercent > 25
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Adjustment form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs text-gray-500 block mb-1">
                Ajuste HP
              </label>
              <input
                type="number"
                placeholder="ej: -10"
                value={hpChange}
                onChange={(e) => setHpChange(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs text-gray-500 block mb-1">
                Ajuste XP
              </label>
              <input
                type="number"
                placeholder="ej: 50"
                value={xpChange}
                onChange={(e) => setXpChange(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Actualizar Stats"}
            </button>
          </div>
        </form>

        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
