interface Testimonial {
  id: string;
  clientName: string;
  content: string;
  rating: number | null;
  createdAt: Date;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 mb-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Lo que dicen nuestros estudiantes
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          Testimonios de estudiantes y familias que han confiado en nuestras
          clases
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-gray-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {t.rating && <StarRating rating={t.rating} />}
              <p className="text-gray-700 leading-relaxed mb-4 italic">
                &ldquo;{t.content}&rdquo;
              </p>
              <p className="font-semibold text-gray-900">{t.clientName}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
