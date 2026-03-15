interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
}

export function StoriesSection({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Historias de Exito
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          Conoce como nuestros estudiantes han alcanzado sus metas academicas
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((story) => (
            <article
              key={story.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {story.imageUrl && (
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {story.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {story.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
