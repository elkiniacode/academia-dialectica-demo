import Image from "next/image";

const FEATURES = [
  {
    number: "01",
    image: "/images/features/feature-2.jpg",
    title: "Tutoría Personalizada",
    description:
      "Cada estudiante recibe un plan de estudio adaptado a su ritmo, nivel y objetivos. No hay dos clases iguales porque no hay dos estudiantes iguales.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: "bg-blue-100 text-blue-600",
  },
  {
    number: "02",
    image: "/images/features/feature-1.jpg",
    title: "Seguimiento Académico",
    description:
      "Monitoreo continuo del progreso con reportes detallados, exámenes evaluados y notas de avance. Los padres y estudiantes siempre saben dónde están parados.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    number: "03",
    image: "/images/features/feature-3.jpg",
    title: "Flexibilidad Total",
    description:
      "Clases presenciales en Bogotá u online desde cualquier lugar. Horarios adaptados a tu agenda, con sesiones individuales o en grupos pequeños.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    color: "bg-sky-100 text-sky-600",
  },
];

export function FeaturesSection() {
  return (
    <section id="caracteristicas" className="py-20 md:py-28 bg-blue-50">
      <div className="max-w-6xl mx-auto px-6">
        <p className="tracking-widest uppercase text-sm font-bold text-blue-600 mb-2">
          Características
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-16">
          Todo lo que necesitas para alcanzar tus metas académicas
        </h2>

        <div className="space-y-24">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.number}
              className="group grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              {/* Visual side (Large Image) */}
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <div className="relative w-full aspect-video md:aspect-square rounded-2xl overflow-hidden shadow-xl shadow-blue-900/5 ring-1 ring-gray-900/5">
                  {feature.image ? (
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400">
                      [Imagen representativa {feature.number}]
                    </div>
                  )}
                </div>
              </div>

              {/* Text side (Icon + Text) */}
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                <div
                  className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mb-6 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-md`}
                >
                  {feature.icon}
                </div>
                <p className="tracking-widest uppercase text-xs font-bold text-blue-600 mb-3">
                  {feature.number}
                </p>
                <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
