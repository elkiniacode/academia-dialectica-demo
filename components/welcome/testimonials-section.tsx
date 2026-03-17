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
    <section id="testimonios" className="py-20 md:py-28 bg-blue-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header with Eyebrow and tight tracking */}
        <div className="text-center mb-16">
          <p className="tracking-widest uppercase text-sm font-bold text-blue-600 mb-2">
            Testimonios
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Lo que dicen nuestros estudiantes
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Testimonios de estudiantes y familias que han confiado en nuestras clases
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex flex-col h-full bg-white rounded-2xl p-8 shadow-xl shadow-blue-900/10 border border-blue-100 border-t-4 border-t-blue-500 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-t-blue-600 hover:shadow-blue-100"
            >
              {t.rating && <StarRating rating={t.rating} />}
              <p className="text-gray-700 leading-relaxed mb-6 italic">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-auto">
                <p className="font-semibold text-gray-900">{t.clientName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
