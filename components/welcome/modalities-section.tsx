"use client";

import { useState } from "react";

const TABS = [
  {
    label: "Presencial",
    title: "Aprende cara a cara en Bogotá",
    content:
      "Clases individuales o en grupos pequeños en un espacio dedicado al aprendizaje. La interacción directa permite una retroalimentación inmediata, resolver dudas al instante y construir una relación de confianza entre tutor y estudiante.",
  },
  {
    label: "Online",
    title: "Conéctate desde cualquier lugar",
    content:
      "Sesiones en vivo por videollamada con pizarra interactiva y recursos compartidos en tiempo real. Ideal para estudiantes fuera de Bogotá o con horarios exigentes. La misma calidad de enseñanza, sin importar la distancia.",
  },
  {
    label: "Híbrido",
    title: "Lo mejor de ambos mundos",
    content:
      "Combina sesiones presenciales y online según tu conveniencia. Perfecto para semanas de exámenes donde necesitas más intensidad, o cuando prefieres alternar entre la comodidad de casa y el enfoque del aula.",
  },
];

export function ModalitiesSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="modalidades" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="tracking-widest uppercase text-sm font-bold text-blue-600 mb-2">
          Modalidades
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-12">
          Escoge la modalidad que se adapte a ti
        </h2>

        {/* Tab buttons — flex-wrap for mobile stacking */}
        <div className="flex justify-center flex-wrap gap-2 md:gap-4 mb-10">
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ease-out ${
                activeTab === i
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-600 hover:-translate-y-0.5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content panel — key forces fade animation on tab switch */}
        <div
          key={activeTab}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-xl shadow-blue-900/5 ring-1 ring-gray-900/5 text-left max-w-3xl mx-auto animate-[fadeIn_0.5s_ease-out]"
        >
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 mb-4">
            {TABS[activeTab].title}
          </h3>
          <p className="text-gray-600 leading-relaxed text-lg">
            {TABS[activeTab].content}
          </p>
        </div>
      </div>
    </section>
  );
}
