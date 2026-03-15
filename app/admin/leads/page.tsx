import { auth } from "@/lib/auth";
import { getLeads } from "@/lib/actions/lead-actions";
import { LeadsDownload } from "@/components/leads-download";

export const metadata = {
  title: "Leads | Admin Dashboard",
};

export default async function LeadsPage() {
  await auth();

  const leads = await getLeads();
  const maxNumber = leads.length > 0 ? leads[0].number : 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Leads</h1>
      {leads.length === 0 ? (
        <p className="text-gray-500">No hay leads registrados aún.</p>
      ) : (
        <>
          <LeadsDownload maxNumber={maxNumber} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Teléfono
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="text-right px-4 py-3 text-sm text-gray-500 font-mono">
                      {lead.number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 break-all">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {lead.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {lead.createdAt.toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
