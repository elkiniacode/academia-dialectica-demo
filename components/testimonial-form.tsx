"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTestimonial,
  updateTestimonial,
} from "@/lib/actions/testimonial-actions";

interface TestimonialData {
  id: string;
  clientName: string;
  content: string;
  rating: number | null;
}

interface Props {
  testimonial?: TestimonialData;
  onClose: () => void;
}

export function TestimonialForm({ testimonial, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = testimonial
        ? await updateTestimonial(testimonial.id, formData)
        : await createTestimonial(formData);

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
            {testimonial ? "Editar Testimonio" : "Agregar Testimonio"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Cliente *
              </label>
              <input
                name="clientName"
                defaultValue={testimonial?.clientName ?? ""}
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
                defaultValue={testimonial?.content ?? ""}
                required
                rows={4}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puntuacion (1-5)
              </label>
              <input
                name="rating"
                type="number"
                min="1"
                max="5"
                defaultValue={testimonial?.rating ?? ""}
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
                {isPending
                  ? "Guardando..."
                  : testimonial
                    ? "Guardar"
                    : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
