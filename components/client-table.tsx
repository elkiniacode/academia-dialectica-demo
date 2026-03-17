"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteClient } from "@/lib/actions/client-actions";
import { ClientForm } from "./client-form";
import { BulkImportPreview, BulkClientRow } from "./bulk-import-preview";

interface ClientData {
  id: string;
  name: string;
  hourlyRate: number;
  currency: string;
  student: string | null;
  modalidad: string | null;
  grado: string | null;
  celular: string | null;
  direccion: string | null;
  correo: string | null;
  username: string | null;
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  clients: ClientData[];
}

export function ClientTable({ clients }: Props) {
  const [editing, setEditing] = useState<ClientData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Bulk import state
  const [bulkData, setBulkData] = useState<BulkClientRow[] | null>(null);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkAnalyzing(true);
    setBulkError(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/analyze-clients-bulk", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setBulkError(json.error ?? "Error al analizar el archivo");
        return;
      }

      setBulkData(json.data as BulkClientRow[]);
    } catch (err) {
      console.error("Bulk analyze error:", err);
      setBulkError(
        err instanceof Error
          ? `Error: ${err.message}`
          : "Error de conexión al analizar el archivo"
      );
    } finally {
      setIsBulkAnalyzing(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
    }
  };

  const handleDelete = (client: ClientData) => {
    if (!confirm(`¿Eliminar a "${client.name}"?`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteClient(client.id);
      if (!result.success) {
        setDeleteError(result.error ?? "Error desconocido");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      {/* Hidden file input for bulk import */}
      <input
        ref={bulkFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleBulkFileChange}
        className="hidden"
      />

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{clients.length} clientes</p>
        <div className="flex gap-2">
          <button
            onClick={() => bulkFileInputRef.current?.click()}
            disabled={isBulkAnalyzing}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isBulkAnalyzing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analizando...
              </span>
            ) : (
              "Importación Masiva (Foto)"
            )}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            + Agregar Cliente
          </button>
        </div>
      </div>

      {bulkError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-3">
          <span>{bulkError}</span>
          <button onClick={() => setBulkError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">✕</button>
        </div>
      )}

      {deleteError && (
        <p className="text-red-500 text-sm mb-3">{deleteError}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-blue-500 px-3 py-2 text-center">No.</th>
              <th className="border border-blue-500 px-3 py-2 text-left">Nombre</th>
              <th className="border border-blue-500 px-3 py-2 text-left">Estudiante</th>
              <th className="border border-blue-500 px-3 py-2 text-center">Modalidad</th>
              <th className="border border-blue-500 px-3 py-2 text-left">Grado</th>
              <th className="border border-blue-500 px-3 py-2 text-right">Costo/Hora</th>
              <th className="border border-blue-500 px-3 py-2 text-left">Celular</th>
              <th className="border border-blue-500 px-3 py-2 text-left">Correo</th>
              <th className="border border-blue-500 px-3 py-2 text-left">Direccion</th>
              <th className="border border-blue-500 px-3 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, i) => (
              <tr
                key={client.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {i + 1}
                </td>
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {client.name}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {client.student ?? "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {client.modalidad ?? "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {client.grado ?? "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {formatCOP(client.hourlyRate)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {client.celular ?? "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {client.correo ?? "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2 max-w-[200px] truncate">
                  {client.direccion ?? "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-green-600 hover:underline text-xs mr-2"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => setEditing(client)}
                    className="text-blue-600 hover:underline text-xs mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(client)}
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
        <ClientForm onClose={() => setShowCreate(false)} />
      )}
      {editing && (
        <ClientForm client={editing} onClose={() => setEditing(null)} />
      )}
      {bulkData && (
        <BulkImportPreview
          initialData={bulkData}
          onClose={() => setBulkData(null)}
        />
      )}
    </>
  );
}
