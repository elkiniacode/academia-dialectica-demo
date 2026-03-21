"use client";

import { useState } from "react";
import { changePassword } from "@/lib/actions/client-actions";
import { signIn } from "next-auth/react";

export function PasswordChangeForm({ currentUsername }: { currentUsername: string }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("Mínimo 8 caracteres, una letra y un número.");
      return;
    }

    setSaving(true);
    const result = await changePassword(newPassword);
    setSaving(false);

    if (result.success) {
      setSuccess(true);
      // Re-authenticate to refresh JWT
      await signIn("credentials", {
        username: currentUsername,
        password: newPassword,
        redirect: false,
      });
      setTimeout(() => {
        setSuccess(false);
        setEditing(false);
      }, 2000);
    } else {
      setError(result.error ?? "Error al guardar");
    }
  };

  return (
    <div className="flex items-start gap-2 flex-wrap">
      <span className="text-sm text-gray-500 mt-1">Contraseña:</span>
      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <input
            name="newPassword"
            type="password"
            placeholder="Nueva contraseña"
            required
            autoFocus
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirmar contraseña"
            required
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-3 py-1 rounded-lg transition-colors"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setError(""); }}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1 transition-colors"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-green-600 font-semibold">✓ Contraseña actualizada</p>}
        </form>
      ) : (
        <>
          <span className="text-sm text-gray-700">••••••••</span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Cambiar
          </button>
        </>
      )}
    </div>
  );
}
