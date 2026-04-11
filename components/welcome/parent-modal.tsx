"use client";

import { useEffect, useRef } from "react";
import { trackParentModalViewed, trackParentVideoEngaged } from "@/lib/analytics";

interface ParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

export function ParentModal({ isOpen, onClose, onRegister }: ParentModalProps) {
  const videoEngagedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "unset";
      return;
    }

    document.body.style.overflow = "hidden";
    trackParentModalViewed();

    if (videoEngagedRef.current) return;

    const timeoutId = setTimeout(() => {
      if (!videoEngagedRef.current) {
        videoEngagedRef.current = true;
        trackParentVideoEngaged();
      }
    }, 15_000);

    return () => {
      clearTimeout(timeoutId);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto"
      style={{ zIndex: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white p-6 md:p-8 rounded-3xl max-w-lg w-full shadow-2xl ring-1 ring-gray-900/5 my-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors text-xl font-bold"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* YouTube Video */}
        <div className="w-full rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[65vh] mx-auto">
          <iframe
            src="https://www.youtube.com/embed/VBW_-zDuLG0?rel=0"
            title="Matías aprende matemáticas con videojuegos"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Persuasive text */}
        <p className="text-gray-600 leading-relaxed text-sm md:text-base mt-6">
          Matías odiaba las matemáticas, pero amaba los videojuegos. Ahora resuelve fracciones
          haciendo lo que más le gusta. Usamos tecnología, videojuegos e IA para que tus hijos
          aprendan sin darse cuenta, les encante y mejoren sus notas.{" "}
          <strong className="text-gray-800">Más de 10 años y 500 estudiantes lo confirman.</strong>
        </p>

        {/* CTA */}
        <button
          onClick={onRegister}
          className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:-translate-y-0.5"
        >
          Sé parte de la familia
        </button>
      </div>
    </div>
  );
}
