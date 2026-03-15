"use client";

import { useState, useTransition } from "react";
import { initializeCharacter } from "@/lib/actions/gamification-actions";

const CLASSES = [
  {
    id: "guerrero",
    name: "Guerrero",
    icon: "\u2694\uFE0F",
    description: "Fuerte y disciplinado. Gana la batalla con constancia.",
    color: "bg-red-100 border-red-400 text-red-800 hover:bg-red-50",
  },
  {
    id: "mago",
    name: "Mago",
    icon: "\uD83D\uDD2E",
    description: "Sabio y anal\u00EDtico. Domina la l\u00F3gica y la teor\u00EDa.",
    color: "bg-purple-100 border-purple-400 text-purple-800 hover:bg-purple-50",
  },
  {
    id: "explorador",
    name: "Explorador",
    icon: "\uD83C\uDFF9",
    description: "Curioso y veloz. Encuentra soluciones creativas.",
    color: "bg-green-100 border-green-400 text-green-800 hover:bg-green-50",
  },
];

export function CharacterCreationForm({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !selectedClass) {
      setError("Por favor elige un nombre y una clase para tu personaje.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await initializeCharacter(clientId, name, selectedClass);
      if (!result.success) {
        setError(result.error ?? "Ocurri\u00F3 un error al crear tu personaje.");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mt-10">
      <div className="bg-gray-900 text-white p-6 text-center">
        <h1 className="text-3xl font-black mb-2">\u00A1Crea tu Personaje!</h1>
        <p className="text-gray-300 text-sm">
          Bienvenido a Academia Dial\u00E9ctica. Elige tu camino y comienza a ganar experiencia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Nombre de tu H\u00E9roe
          </label>
          <input
            type="text"
            maxLength={20}
            placeholder="Ej: Sir Arthur, Gandalf, Lara..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-lg border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
        </div>

        {/* Class Selection Grid */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Elige tu Clase
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CLASSES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClass(c.id)}
                className={`flex flex-col items-center text-center p-4 border-2 rounded-xl transition-all transform ${
                  selectedClass === c.id
                    ? `${c.color} scale-105 shadow-md ring-2 ring-offset-2 ring-gray-400`
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <span className="text-4xl mb-2">{c.icon}</span>
                <span className="font-bold text-gray-900 mb-1">{c.name}</span>
                <span className="text-xs text-gray-600">{c.description}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || !name || !selectedClass}
          className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isPending ? "Forjando destino..." : "\u00A1Empezar Aventura!"}
        </button>
      </form>
    </div>
  );
}
