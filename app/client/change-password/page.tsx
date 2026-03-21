"use client";

import { useState } from "react";
import { changePassword } from "@/lib/actions/client-actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { update } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Client-side strength check before hitting the server
    const isValid =
      newPassword.length >= 8 &&
      /[a-zA-Z]/.test(newPassword) &&
      /[0-9]/.test(newPassword);

    if (!isValid) {
      setError("La contraseña debe tener al menos 8 caracteres, una letra y un número.");
      return;
    }

    setSubmitting(true);
    const result = await changePassword(newPassword);
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      // Update the JWT so requirePasswordChange=false, then redirect
      await update();
      setTimeout(() => router.push("/client/dashboard"), 1500);
    } else {
      setError(result.error ?? "Error inesperado.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md ring-1 ring-gray-900/5">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Establece tu contraseña</h1>
        <p className="text-gray-500 text-sm mb-8">
          Por tu seguridad, elige una contraseña personal antes de continuar.
        </p>

        {success ? (
          <div className="text-center text-green-600 font-semibold py-6">
            ✓ Contraseña actualizada. Redirigiendo…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-widest uppercase mb-2">
                Nueva contraseña
              </label>
              <input
                name="newPassword"
                type="password"
                required
                placeholder="Mínimo 8 caracteres, letra y número"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-widest uppercase mb-2">
                Confirmar contraseña
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                placeholder="Repite tu nueva contraseña"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/30"
            >
              {submitting ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
