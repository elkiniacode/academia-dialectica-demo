import { auth } from "@/lib/auth";
import { getClients, getArchivedClients } from "@/lib/actions/client-actions";
import { ClientTable } from "@/components/client-table";

export default async function ClientsPage() {
  await auth();

  const [clients, archivedClients] = await Promise.all([
    getClients(),
    getArchivedClients(),
  ]);

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 pb-60">
      <h1 className="text-2xl font-bold mb-2">Clientes</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-3xl">
        Aquí encuentras la información importante de cada cliente: datos de
        contacto, modalidad, grado y acceso al portal. Puedes agregar clientes
        manualmente o usar{" "}
        <span className="font-medium text-gray-700">
          &ldquo;Importación Masiva (Foto)&rdquo;
        </span>{" "}
        para subir una imagen con un formulario — la IA extrae los datos
        automáticamente. Haz clic en{" "}
        <span className="font-medium text-gray-700">&ldquo;Ver&rdquo;</span> para ver el
        detalle académico de cada estudiante.
      </p>
      {archivedClients.length > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>
            <span className="font-semibold">Clientes archivados con nombre único: </span>
            {archivedClients.map((c) => c.name).join(", ")}
            {" — "}debes eliminarlos de la base de datos antes de poder reutilizar estos nombres.
          </span>
        </div>
      )}
      <ClientTable clients={clients} />
    </div>
  );
}
