"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkCreateClients, BulkCreateResult } from "@/lib/actions/client-actions";

export interface BulkClientRow {
  name: string;
  hourlyRate: number | null;
  student: string | null;
  modalidad: string | null;
  grado: string | null;
  celular: string | null;
  correo: string | null;
  direccion: string | null;
}

interface Props {
  initialData: BulkClientRow[];
  onClose: () => void;
}

export function BulkImportPreview({ initialData, onClose }: Props) {
  const [rows, setRows] = useState<BulkClientRow[]>(
    initialData.map((r) => ({
      ...r,
      hourlyRate: r.hourlyRate ?? 0,
    }))
  );
  const [importResult, setImportResult] = useState<BulkCreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const updateRow = (index: number, field: keyof BulkClientRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === "hourlyRate") {
          return { ...row, hourlyRate: value === "" ? 0 : parseFloat(value) || 0 };
        }
        return { ...row, [field]: value || null };
      })
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const isRowInvalid = (row: BulkClientRow) =>
    !row.name?.trim() || row.hourlyRate == null || row.hourlyRate < 0;

  const handleImport = () => {
    setError(null);
    startTransition(async () => {
      const payload = rows.map((r) => ({
        name: r.name?.trim() ?? "",
        hourlyRate: r.hourlyRate ?? 0,
        student: r.student,
        modalidad: r.modalidad,
        grado: r.grado,
        celular: r.celular,
        correo: r.correo,
        direccion: r.direccion,
      }));

      const result = await bulkCreateClients(payload);
      if (result.error && result.created === 0) {
        setError(result.error);
      } else {
        setImportResult(result);
        router.refresh();
      }
    });
  };

  const inputClass =
    "w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500";

  // Success screen
  if (importResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h2 className="text-lg font-bold mb-4 text-green-700">Importación Completa</h2>
          <p className="text-sm mb-2">
            <span className="font-semibold">{importResult.created}</span> cliente{importResult.created !== 1 ? "s" : ""} creado{importResult.created !== 1 ? "s" : ""} exitosamente.
          </p>
          {importResult.skipped.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-amber-700 mb-1">
                {importResult.skipped.length} omitido{importResult.skipped.length !== 1 ? "s" : ""}:
              </p>
              <ul className="text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                {importResult.skipped.map((s, i) => (
                  <li key={i} className="bg-amber-50 px-2 py-1 rounded">
                    <span className="font-medium">{s.name}</span> — {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">
            Importación Masiva — Vista Previa
          </h2>
          <p className="text-sm text-gray-500">
            {rows.length} cliente{rows.length !== 1 ? "s" : ""} detectado{rows.length !== 1 ? "s" : ""}. Revisa y edita antes de importar.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {rows.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No hay clientes para importar. Todos fueron eliminados.
            </p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-green-600 text-white">
                  <th className="border border-green-500 px-2 py-1.5 text-center w-8">#</th>
                  <th className="border border-green-500 px-2 py-1.5 text-left">Nombre *</th>
                  <th className="border border-green-500 px-2 py-1.5 text-left">Estudiante</th>
                  <th className="border border-green-500 px-2 py-1.5 text-center">Modalidad</th>
                  <th className="border border-green-500 px-2 py-1.5 text-left">Grado</th>
                  <th className="border border-green-500 px-2 py-1.5 text-right">Costo/Hora *</th>
                  <th className="border border-green-500 px-2 py-1.5 text-left">Celular</th>
                  <th className="border border-green-500 px-2 py-1.5 text-left">Correo</th>
                  <th className="border border-green-500 px-2 py-1.5 text-left">Dirección</th>
                  <th className="border border-green-500 px-2 py-1.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                      isRowInvalid(row) ? "ring-1 ring-inset ring-red-300" : ""
                    }`}
                  >
                    <td className="border border-gray-300 px-2 py-1 text-center text-gray-400">
                      {i + 1}
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        value={row.name ?? ""}
                        onChange={(e) => updateRow(i, "name", e.target.value)}
                        className={`${inputClass} ${!row.name?.trim() ? "border-red-400 bg-red-50" : ""}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        value={row.student ?? ""}
                        onChange={(e) => updateRow(i, "student", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <select
                        value={row.modalidad ?? ""}
                        onChange={(e) => updateRow(i, "modalidad", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">—</option>
                        <option value="Presencial">Presencial</option>
                        <option value="Online">Online</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        value={row.grado ?? ""}
                        onChange={(e) => updateRow(i, "grado", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={row.hourlyRate ?? 0}
                        onChange={(e) => updateRow(i, "hourlyRate", e.target.value)}
                        className={`${inputClass} text-right ${
                          row.hourlyRate == null || row.hourlyRate < 0
                            ? "border-red-400 bg-red-50"
                            : ""
                        }`}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        value={row.celular ?? ""}
                        onChange={(e) => updateRow(i, "celular", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="email"
                        value={row.correo ?? ""}
                        onChange={(e) => updateRow(i, "correo", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        value={row.direccion ?? ""}
                        onChange={(e) => updateRow(i, "direccion", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1 text-center">
                      <button
                        onClick={() => removeRow(i)}
                        className="text-red-500 hover:text-red-700 font-bold text-sm"
                        title="Eliminar fila"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {error && (
          <div className="px-4 pb-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={isPending || rows.length === 0 || rows.some(isRowInvalid)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isPending
              ? "Importando..."
              : `Importar Todos (${rows.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
