import { auth } from "@/lib/auth";
import { ClientNavBar } from "@/components/client-nav-bar";
import { CharacterCompanion } from "@/components/character-companion";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavBar />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {children}
      </main>
      {session?.user && session?.characterClass && (
        <CharacterCompanion
          characterClass={session.characterClass as string}
          level={Number(session.level) || 1}
        />
      )}
    </div>
  );
}
