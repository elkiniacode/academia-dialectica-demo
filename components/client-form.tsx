"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient, updateClient } from "@/lib/actions/client-actions";

interface ClientData {
  id: string;
  name: string;
  hourlyRate: number;
  student: string | null;
  modalidad: string | null;
  grado: string | null;
  celular: string | null;
  direccion: string | null;
  correo: string | null;
  username: string | null;
}

interface Props {
  client?: ClientData;
  onClose: () => void;
}

interface FormValues {
  name: string;
  hourlyRate: string;
  student: string;
  modalidad: string;
  grado: string;
  celular: string;
  correo: string;
  direccion: string;
  username: string;
  password: string;
}

export function ClientForm({ client, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<FormValues>({
    name: client?.name ?? "",
    hourlyRate: client?.hourlyRate?.toString() ?? "",
    student: client?.student ?? "",
    modalidad: client?.modalidad ?? "",
    grado: client?.grado ?? "",
    celular: client?.celular ?? "",
    correo: client?.correo ?? "",
    direccion: client?.direccion ?? "",
    username: client?.username ?? "",
    password: "",
  });

  const set =
    (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/analyze-client", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setAnalyzeError(json.error ?? "Error al analizar la imagen");
        return;
      }

      const d = json.data;
      setValues((v) => ({
        ...v,
        name: d.name ?? v.name,
        hourlyRate: d.hourlyRate != null ? String(d.hourlyRate) : v.hourlyRate,
        student: d.student ?? v.student,
        modalidad: d.modalidad ?? v.modalidad,
        grado: d.grado ?? v.grado,
        celular: d.celular ?? v.celular,
        correo: d.correo ?? v.correo,
        direccion: d.direccion ?? v.direccion,
      }));
    } catch (err) {
      console.error("Analyze client fetch error:", err);
      setAnalyzeError(
        err instanceof Error
          ? `Error: ${err.message}`
          : "Error de conexión al analizar la imagen"
      );
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = client
        ? await updateClient(client.id, formData)
        : await createClient(formData);

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
            {client ? "Editar Cliente" : "Agregar Cliente"}
          </h2>

          {/* AI Image Upload */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-2">
              Autocompletar con IA — sube una foto o video del formulario del cliente
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              disabled={isAnalyzing || isPending}
              className="hidden"
              id="ai-file-input"
            />
            <label
              htmlFor="ai-file-input"
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded cursor-pointer border transition-colors ${
                isAnalyzing || isPending
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Analizando...
                </>
              ) : (
                <>
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Subir foto / video
                </>
              )}
            </label>
            {analyzeError && (
              <p className="mt-1.5 text-xs text-red-600">{analyzeError}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Cliente *
              </label>
              <input
                name="name"
                value={values.name}
                onChange={set("name")}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo por Hora (COP) *
              </label>
              <input
                name="hourlyRate"
                type="number"
                min="0"
                step="1000"
                value={values.hourlyRate}
                onChange={set("hourlyRate")}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estudiante
              </label>
              <input
                name="student"
                value={values.student}
                onChange={set("student")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modalidad
              </label>
              <select
                name="modalidad"
                value={values.modalidad}
                onChange={set("modalidad")}
                className={inputClass}
              >
                <option value="">— Seleccionar —</option>
                <option value="Presencial">Presencial</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado
              </label>
              <input
                name="grado"
                value={values.grado}
                onChange={set("grado")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celular
              </label>
              <input
                name="celular"
                type="tel"
                value={values.celular}
                onChange={set("celular")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo
              </label>
              <input
                name="correo"
                type="email"
                value={values.correo}
                onChange={set("correo")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Direccion
              </label>
              <input
                name="direccion"
                value={values.direccion}
                onChange={set("direccion")}
                className={inputClass}
              />
            </div>

            {/* Portal access */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Acceso al Portal
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                  </label>
                  <input
                    name="username"
                    value={values.username}
                    onChange={set("username")}
                    autoComplete="off"
                    placeholder="ej. adriana.sophy"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {client ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={set("password")}
                    autoComplete="new-password"
                    placeholder={client ? "••••••••" : "Mínimo 8 caracteres"}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending || isAnalyzing}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || isAnalyzing}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Guardando..." : client ? "Guardar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
