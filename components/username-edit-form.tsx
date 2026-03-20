"use client";

import { useState } from "react";
import { updateUsername } from "@/lib/actions/client-actions";

export function UsernameEditForm({ currentUsername }: { currentUsername: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentUsername);
  const [saved, setSaved] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmedValue = value.trim();

    if (trimmedValue === saved) {
      setEditing(false);
      return;
    }

    // Client-side validation before hitting the server
    if (trimmedValue.length < 3 || /\s/.test(trimmedValue)) {
      setError("El usuario debe tener al menos 3 caracteres y no contener espacios.");
      return;
    }

    setSaving(true);
    setError("");
    const result = await updateUsername(trimmedValue);
    setSaving(false);

    if (result.success) {
      setSaved(trimmedValue);
      setEditing(false);
    } else {
      setError(result.error ?? "Error al guardar");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500">Usuario:</span>
      {editing ? (
        <>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-3 py-1 rounded-lg transition-colors"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(saved); setError(""); }}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1 transition-colors"
          >
            Cancelar
          </button>
          {error && <p className="w-full text-xs text-red-500 mt-1">{error}</p>}
        </>
      ) : (
        <>
          <span className="text-sm font-mono text-gray-700">{saved}</span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Editar
          </button>
        </>
      )}
    </div>
  );
}
