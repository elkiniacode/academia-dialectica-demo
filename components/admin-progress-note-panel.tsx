"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProgressNote } from "@prisma/client";
import { createProgressNote, deleteProgressNote } from "@/lib/actions/progress-note-actions";

interface Props {
  clientId: string;
  initialNotes: ProgressNote[];
}

const COLORS = [
  { hex: "#3b82f6", label: "Azul" },
  { hex: "#22c55e", label: "Verde" },
  { hex: "#eab308", label: "Amarillo" },
  { hex: "#a855f7", label: "Morado" },
  { hex: "#f97316", label: "Naranja" },
  { hex: "#ec4899", label: "Rosa" },
];

const todayISO = new Date().toISOString().slice(0, 10);

export function AdminProgressNotePanel({ clientId, initialNotes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [date, setDate] = useState(todayISO);
  const [color, setColor] = useState(COLORS[0].hex);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createProgressNote(clientId, {
        content,
        date: new Date(date + "T00:00:00").toISOString(),
        color,
      });
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        setContent("");
        setDate(todayISO);
        setColor(COLORS[0].hex);
        router.refresh();
      }
    });
  }

  function handleDelete(noteId: string) {
    if (!confirm("¿Eliminar esta nota?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProgressNote(noteId);
      if (!result.success) setError(result.error ?? "Error desconocido");
      else router.refresh();
    });
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Notas de Progreso
      </h2>

      {/* Add form */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-100">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Color:</span>
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c.hex
                      ? "border-gray-800 scale-110"
                      : "border-transparent hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
          <textarea
            placeholder="Nota de progreso..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Agregar Nota"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Notes list */}
      {initialNotes.length === 0 ? (
        <p className="text-gray-400 text-center py-6 bg-white rounded-lg shadow">
          No hay notas de progreso aún
        </p>
      ) : (
        <div className="space-y-3">
          {initialNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-sm p-4 border-l-4"
              style={{ borderLeftColor: note.color }}
            >
              <p className="text-sm text-gray-700">{note.content}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  {new Date(note.date).toLocaleDateString("es-CO")}
                </p>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={isPending}
                  className="text-red-600 hover:underline text-xs disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
