import { auth } from "@/lib/auth";
import { getStories } from "@/lib/actions/story-actions";
import { StoryTable } from "@/components/story-table";

export default async function StoriesPage() {
  const session = await auth();
  const stories = await getStories();
  // Demo admin (credentials-based ADMIN) has userId set; real admin (Google OAuth) does not
  const readOnly = !!session?.userId;

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6">
      <h1 className="text-2xl font-bold mb-2">Historias de Éxito</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-3xl">
        Estas historias aparecen en la{" "}
        <span className="font-medium text-gray-700">página principal</span>{" "}
        dentro del carrusel de la sección "Historias de Éxito". Agrega casos
        reales de estudiantes que han mejorado sus resultados — son poderosas
        para generar confianza con nuevas familias. Puedes marcar cada historia
        como visible u oculta sin eliminarla.
      </p>
      {readOnly && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          Modo demo: solo lectura. No puedes agregar, editar ni eliminar historias.
        </p>
      )}
      <StoryTable stories={stories} readOnly={readOnly} />
    </div>
  );
}
