"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

const SECTION_IDS = [
  "hero",
  "caracteristicas",
  "modalidades",
  "testimonios",
  "historias",
  "footer",
];

const SECTION_NAMES: Record<string, string> = {
  hero: "Hero",
  caracteristicas: "Características",
  modalidades: "Modalidades",
  testimonios: "Testimonios",
  historias: "Historias",
  footer: "Footer",
};

export function SectionTracker() {
  const posthog = usePostHog();
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!posthog) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seen.current.has(entry.target.id)) {
            seen.current.add(entry.target.id);

            posthog.capture("section_viewed", {
              section_id: entry.target.id,
              section_name: SECTION_NAMES[entry.target.id] ?? entry.target.id,
            });

            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.3 },
    );

    const timeoutId = setTimeout(() => {
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [posthog]);

  return null;
}
