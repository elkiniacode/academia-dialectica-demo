"use client";

import { useState, useEffect } from "react";

interface ParentBubbleProps {
  onClick: () => void;
}

export function ParentBubble({ onClick }: ParentBubbleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver;

    const timeoutId = setTimeout(() => {
      const hero = document.getElementById("hero");
      if (!hero) return;

      observer = new IntersectionObserver(
        ([entry]) => {
          setVisible(!entry.isIntersecting);
        },
        { threshold: 0.1 },
      );

      observer.observe(hero);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full px-5 py-3 shadow-lg shadow-orange-500/30 font-semibold text-xs sm:text-sm animate-companion-bob transition-all duration-500 hover:shadow-orange-500/50 hover:scale-105 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-label="Información para padres"
    >
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
        ¿Cansada de pelear por las tareas?
      </span>
    </button>
  );
}
