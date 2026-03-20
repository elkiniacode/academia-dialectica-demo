import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BuzonForm } from "@/components/buzon-form";
import { CharacterCreationForm } from "@/components/character-creation-form";
import { CharacterAvatar } from "@/components/character-avatar";
import { UsernameEditForm } from "@/components/username-edit-form";

export default async function ClientDashboard() {
  const session = await auth();
  if (!session || !session.userId) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { id: session.userId },
    include: {
      exams: { orderBy: { date: "desc" }, take: 10 },
      progressNotes: { orderBy: { date: "desc" }, take: 10 },
      suggestions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!client) redirect("/login");

  const hasCharacter = client.characterName !== null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Bienvenido, {client.student || client.name}
      </h1>

      {/* RPG Section */}
      {!hasCharacter ? (
        <CharacterCreationForm clientId={client.id} />
      ) : (
        <section className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="relative flex items-center justify-center animate-character-glow">
              <CharacterAvatar
                characterClass={client.characterClass!}
                level={client.level}
                variant="idle"
                size="lg"
                animated
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {client.characterName}
                </h2>
                <p className="text-sm text-gray-500 capitalize">
                  {client.characterClass} &mdash; Nivel {client.level}
                </p>
                {client.username && (
                  <div className="mt-2">
                    <UsernameEditForm currentUsername={client.username} />
                  </div>
                )}
              </div>

              {/* HP Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>&#10084;&#65039; HP (Salud)</span>
                  <span>{client.hp} / 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      client.hp > 50
                        ? "bg-green-500"
                        : client.hp > 25
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${client.hp}%` }}
                  />
                </div>
              </div>

              {/* XP Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>&#10024; XP (Experiencia)</span>
                  <span>{client.xp % 100} / 100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${client.xp % 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Exams */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Mis Exámenes
        </h2>
        {client.exams.length === 0 ? (
          <p className="text-gray-400 bg-white rounded-lg shadow p-6 text-center">
            No hay exámenes registrados aún
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {client.exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-lg shadow p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">{exam.title}</h3>
                  <span className="text-lg font-bold text-blue-600">
                    {exam.score}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(exam.date).toLocaleDateString("es-CO")}
                </p>
                {exam.commentary && (
                  <p className="text-sm text-gray-600">{exam.commentary}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Progress Notes */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Notas de Progreso
        </h2>
        {client.progressNotes.length === 0 ? (
          <p className="text-gray-400 bg-white rounded-lg shadow p-6 text-center">
            No hay notas de progreso aún
          </p>
        ) : (
          <div className="space-y-3">
            {client.progressNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg shadow p-4 border-l-4 bg-white"
                style={{ borderLeftColor: note.color }}
              >
                <p className="text-sm text-gray-700">{note.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(note.date).toLocaleDateString("es-CO")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suggestions (Buzón) */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Mi Buzón de Sugerencias
        </h2>
        <BuzonForm />
        {client.suggestions.length === 0 ? (
          <p className="text-gray-400 bg-white rounded-lg shadow p-6 text-center">
            No has enviado sugerencias aún
          </p>
        ) : (
          <div className="space-y-3">
            {client.suggestions.map((sug) => (
              <div
                key={sug.id}
                className="bg-white rounded-lg shadow p-4 border border-gray-100 flex items-start justify-between"
              >
                <p className="text-sm text-gray-700">{sug.message}</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full shrink-0 ml-4 ${
                    sug.status === "unread"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {sug.status === "unread" ? "Enviado" : "Leído"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
