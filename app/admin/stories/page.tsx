import { getStories } from "@/lib/actions/story-actions";
import { StoryTable } from "@/components/story-table";

export default async function StoriesPage() {
  const stories = await getStories();

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
      <StoryTable stories={stories} readOnly={false} />
    </div>
  );
}
