"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Suggestion } from "@prisma/client";
import { markSuggestionRead } from "@/lib/actions/suggestion-actions";

interface Props {
  clientId: string;
  initialSuggestions: Suggestion[];
}

export function AdminSuggestionView({ clientId: _clientId, initialSuggestions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMarkRead(suggestionId: string) {
    setError(null);
    startTransition(async () => {
      const result = await markSuggestionRead(suggestionId);
      if (!result.success) setError(result.error ?? "Error desconocido");
      else router.refresh();
    });
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Buzón de Sugerencias
      </h2>

      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">✕</button>
        </div>
      )}

      {initialSuggestions.length === 0 ? (
        <p className="text-gray-400 text-center py-6 bg-white rounded-lg shadow">
          Este estudiante no ha enviado sugerencias
        </p>
      ) : (
        <div className="space-y-3">
          {initialSuggestions.map((sug) => (
            <div
              key={sug.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{sug.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(sug.createdAt).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    sug.status === "unread"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {sug.status === "unread" ? "Sin leer" : "Leído"}
                </span>
                {sug.status === "unread" && (
                  <button
                    onClick={() => handleMarkRead(sug.id)}
                    disabled={isPending}
                    className="text-blue-600 hover:underline text-xs disabled:opacity-50"
                  >
                    Marcar leído
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
