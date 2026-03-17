import { auth } from "@/lib/auth";
import { getClients } from "@/lib/actions/client-actions";
import { ClientTable } from "@/components/client-table";

export default async function ClientsPage() {
  await auth();

  const clients = await getClients();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Clientes</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-3xl">
        Aquí encuentras la información importante de cada cliente: datos de
        contacto, modalidad, grado y acceso al portal. Puedes agregar clientes
        manualmente o usar{" "}
        <span className="font-medium text-gray-700">
          "Importación Masiva (Video/Foto)"
        </span>{" "}
        para subir una imagen o video con varios formularios a la vez — la IA
        extrae los datos automáticamente. Haz clic en{" "}
        <span className="font-medium text-gray-700">"Ver"</span> para ver el
        detalle académico de cada estudiante.
      </p>
      <ClientTable clients={clients} />
    </div>
  );
}
