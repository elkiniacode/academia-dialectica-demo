"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStory, updateStory } from "@/lib/actions/story-actions";

interface StoryData {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
}

interface Props {
  story?: StoryData;
  onClose: () => void;
}

export function StoryForm({ story, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = story
        ? await updateStory(story.id, formData)
        : await createStory(formData);

      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">
            {story ? "Editar Historia" : "Agregar Historia"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titulo *
              </label>
              <input
                name="title"
                defaultValue={story?.title ?? ""}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenido *
              </label>
              <textarea
                name="content"
                defaultValue={story?.content ?? ""}
                required
                rows={6}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de Imagen (opcional)
              </label>
              <input
                name="imageUrl"
                type="url"
                defaultValue={story?.imageUrl ?? ""}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Guardando..." : story ? "Guardar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
