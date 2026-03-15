"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Exam } from "@prisma/client";
import { createExam, deleteExam } from "@/lib/actions/exam-actions";

interface Props {
  clientId: string;
  initialExams: Exam[];
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-green-600 font-bold text-lg";
  if (score >= 5) return "text-yellow-600 font-bold text-lg";
  return "text-red-600 font-bold text-lg";
}

const todayISO = new Date().toISOString().slice(0, 10);

export function AdminExamPanel({ clientId, initialExams }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [date, setDate] = useState(todayISO);
  const [commentary, setCommentary] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !score || !date) return;

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      setError("La nota debe estar entre 0 y 10");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createExam(clientId, {
        title,
        score: numScore,
        date: new Date(date + "T00:00:00").toISOString(),
        commentary,
      });
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        setTitle("");
        setScore("");
        setDate(todayISO);
        setCommentary("");
        router.refresh();
      }
    });
  }

  function handleDelete(examId: string) {
    if (!confirm("¿Eliminar este examen?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteExam(examId);
      if (!result.success) setError(result.error ?? "Error desconocido");
      else router.refresh();
    });
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Exámenes
      </h2>

      {/* Add form */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-100">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Título del examen"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 min-w-[160px] border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <input
              type="number"
              placeholder="Nota (0–10)"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              min="0"
              max="10"
              step="0.1"
              className="w-28 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <textarea
            placeholder="Comentario (opcional)"
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Agregar Examen"}
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

      {/* Exam list */}
      {initialExams.length === 0 ? (
        <p className="text-gray-400 text-center py-6 bg-white rounded-lg shadow">
          No hay exámenes registrados aún
        </p>
      ) : (
        <div className="space-y-3">
          {initialExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800">{exam.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(exam.date).toLocaleDateString("es-CO")}
                </p>
                {exam.commentary && (
                  <p className="text-sm text-gray-500 mt-1">{exam.commentary}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={scoreColor(exam.score)}>{exam.score.toFixed(1)}</span>
                <button
                  onClick={() => handleDelete(exam.id)}
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
