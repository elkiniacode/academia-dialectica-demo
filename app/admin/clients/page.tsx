import { auth } from "@/lib/auth";
import { getClients } from "@/lib/actions/client-actions";
import { ClientTable } from "@/components/client-table";

export default async function ClientsPage() {
  await auth();

  const clients = await getClients();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>
      <ClientTable clients={clients} />
    </div>
  );
}
