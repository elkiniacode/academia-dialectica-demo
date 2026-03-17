"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteStory,
  toggleStoryVisibility,
} from "@/lib/actions/story-actions";
import { StoryForm } from "./story-form";

interface StoryData {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  visible: boolean;
  createdAt: Date;
}

interface Props {
  stories: StoryData[];
  readOnly?: boolean;
}

export function StoryTable({ stories, readOnly = false }: Props) {
  const [editing, setEditing] = useState<StoryData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (s: StoryData) => {
    if (!confirm(`¿Eliminar historia "${s.title}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteStory(s.id);
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        router.refresh();
      }
    });
  };

  const handleToggle = (s: StoryData) => {
    startTransition(async () => {
      const result = await toggleStoryVisibility(s.id);
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{stories.length} historias</p>
        {!readOnly && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            + Agregar Historia
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-blue-500 px-3 py-2 text-center">
                No.
              </th>
              <th className="border border-blue-500 px-3 py-2 text-left">
                Titulo
              </th>
              <th className="border border-blue-500 px-3 py-2 text-left">
                Contenido
              </th>
              <th className="border border-blue-500 px-3 py-2 text-center">
                Imagen
              </th>
              <th className="border border-blue-500 px-3 py-2 text-center">
                Visible
              </th>
              <th className="border border-blue-500 px-3 py-2 text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {stories.map((s, i) => (
              <tr
                key={s.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {i + 1}
                </td>
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {s.title}
                </td>
                <td className="border border-gray-300 px-3 py-2 max-w-[300px] truncate">
                  {s.content}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {s.imageUrl ? (
                    <a
                      href={s.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Ver
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {readOnly ? (
                    <span className={`text-xs px-2 py-1 rounded ${s.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.visible ? "Visible" : "Oculto"}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggle(s)}
                      disabled={isPending}
                      className={`text-xs px-2 py-1 rounded ${
                        s.visible
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.visible ? "Visible" : "Oculto"}
                    </button>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap">
                  {readOnly ? (
                    <span className="text-xs text-gray-400">Solo lectura</span>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(s)}
                        className="text-blue-600 hover:underline text-xs mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={isPending}
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && showCreate && <StoryForm onClose={() => setShowCreate(false)} />}
      {!readOnly && editing && (
        <StoryForm story={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
