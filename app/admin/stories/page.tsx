import { getStories } from "@/lib/actions/story-actions";
import { StoryTable } from "@/components/story-table";

export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Historias de Exito</h1>
      <StoryTable stories={stories} />
    </div>
  );
}
