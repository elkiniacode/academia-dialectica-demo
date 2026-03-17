"use client";

import { useState } from "react";
import Image from "next/image";

interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
}

export function StoriesSection({ stories }: { stories: Story[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (stories.length === 0) return null;

  const totalSlides = stories.length;

  const prev = () =>
    setCurrentSlide((c) => (c === 0 ? totalSlides - 1 : c - 1));
  const next = () =>
    setCurrentSlide((c) => (c === totalSlides - 1 ? 0 : c + 1));

  return (
    <section id="historias" className="py-20 md:py-28 bg-blue-300">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header with Eyebrow */}
        <div className="text-center mb-16">
          <p className="tracking-widest uppercase text-sm font-bold text-blue-600 mb-2">
            Historias
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Historias de Éxito
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Conoce cómo nuestros estudiantes han alcanzado sus metas académicas
          </p>
        </div>

        {/* Slider container */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl shadow-blue-900/10 border border-blue-100 border-t-4 border-t-blue-500">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {stories.map((story) => (
              <article key={story.id} className="w-full flex-shrink-0 flex flex-col h-full">
                {story.imageUrl && (
                  <div className="relative w-full h-64 flex-shrink-0">
                    <Image
                      src={story.imageUrl}
                      alt={story.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 896px"
                    />
                  </div>
                )}
                <div className="p-8 flex-grow">
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-3">
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

        {/* Navigation */}
        {totalSlides > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300 ease-out hover:-translate-y-0.5"
              aria-label="Anterior"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {stories.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === currentSlide ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label={`Ir a historia ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300 ease-out hover:-translate-y-0.5"
              aria-label="Siguiente"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
