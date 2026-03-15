"use client";

import { useState } from "react";
import { createSuggestion } from "@/lib/actions/suggestion-actions";
import { useRouter } from "next/navigation";

export function BuzonForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError("");
    try {
      await createSuggestion(message);
      setMessage("");
      router.refresh();
    } catch {
      setError("Hubo un error al enviar tu mensaje. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-100"
    >
      <label
        htmlFor="message"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Enviar un mensaje o sugerencia
      </label>
      <textarea
        id="message"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        placeholder="Escribe tu mensaje aquí..."
        required
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">
          {error}
        </p>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? "Enviando..." : "Enviar Mensaje"}
        </button>
      </div>
    </form>
  );
}
