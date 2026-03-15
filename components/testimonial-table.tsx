"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteTestimonial,
  toggleTestimonialVisibility,
} from "@/lib/actions/testimonial-actions";
import { TestimonialForm } from "./testimonial-form";

interface TestimonialData {
  id: string;
  clientName: string;
  content: string;
  rating: number | null;
  visible: boolean;
  createdAt: Date;
}

interface Props {
  testimonials: TestimonialData[];
}

export function TestimonialTable({ testimonials }: Props) {
  const [editing, setEditing] = useState<TestimonialData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (t: TestimonialData) => {
    if (!confirm(`¿Eliminar testimonio de "${t.clientName}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTestimonial(t.id);
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        router.refresh();
      }
    });
  };

  const handleToggle = (t: TestimonialData) => {
    startTransition(async () => {
      const result = await toggleTestimonialVisibility(t.id);
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
        <p className="text-sm text-gray-500">
          {testimonials.length} testimonios
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          + Agregar Testimonio
        </button>
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
                Cliente
              </th>
              <th className="border border-blue-500 px-3 py-2 text-left">
                Contenido
              </th>
              <th className="border border-blue-500 px-3 py-2 text-center">
                Puntuacion
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
            {testimonials.map((t, i) => (
              <tr
                key={t.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {i + 1}
                </td>
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {t.clientName}
                </td>
                <td className="border border-gray-300 px-3 py-2 max-w-[300px] truncate">
                  {t.content}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {t.rating ? `${t.rating}/5` : "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <button
                    onClick={() => handleToggle(t)}
                    disabled={isPending}
                    className={`text-xs px-2 py-1 rounded ${
                      t.visible
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.visible ? "Visible" : "Oculto"}
                  </button>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap">
                  <button
                    onClick={() => setEditing(t)}
                    className="text-blue-600 hover:underline text-xs mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={isPending}
                    className="text-red-600 hover:underline text-xs disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <TestimonialForm onClose={() => setShowCreate(false)} />
      )}
      {editing && (
        <TestimonialForm
          testimonial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
