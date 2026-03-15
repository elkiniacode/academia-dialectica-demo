import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminExamPanel } from "@/components/admin-exam-panel";
import { AdminProgressNotePanel } from "@/components/admin-progress-note-panel";
import { AdminSuggestionView } from "@/components/admin-suggestion-view";
import { AdminGamificationPanel } from "@/components/admin-gamification-panel";

interface Props {
  params: Promise<{ id: string }>;
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ClientDetailPage({ params }: Props) {
  const session = await auth();
  // Defense in depth: only ADMIN can access this page
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      exams: { orderBy: { date: "desc" } },
      progressNotes: { orderBy: { date: "desc" } },
      suggestions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) notFound();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Back link */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Volver a Clientes
      </Link>

      {/* Client info header */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
            {client.student && (
              <p className="text-gray-500 mt-0.5">{client.student}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {client.modalidad && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {client.modalidad}
                </span>
              )}
              {client.grado && (
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  {client.grado}
                </span>
              )}
              {client.characterName && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {client.characterName} ({client.characterClass})
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-blue-600">
              {formatCOP(client.hourlyRate)}
            </p>
            <p className="text-xs text-gray-400">por hora</p>
          </div>
        </div>

        {/* Contact info */}
        {(client.celular || client.correo || client.direccion) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
            {client.celular && <span>📞 {client.celular}</span>}
            {client.correo && <span>✉️ {client.correo}</span>}
            {client.direccion && <span>📍 {client.direccion}</span>}
          </div>
        )}
      </div>

      {/* Panels — side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gamification takes full width at the top */}
        <div className="lg:col-span-2">
          <AdminGamificationPanel
            clientId={client.id}
            initialHp={client.hp}
            initialXp={client.xp}
            level={client.level}
          />
        </div>

        {/* Exams and Notes sit side-by-side below it */}
        <AdminExamPanel clientId={client.id} initialExams={client.exams} />
        <AdminProgressNotePanel clientId={client.id} initialNotes={client.progressNotes} />

        {/* Suggestions take full width at the bottom */}
        <div className="lg:col-span-2">
          <AdminSuggestionView clientId={client.id} initialSuggestions={client.suggestions} />
        </div>
      </div>
    </div>
  );
}
