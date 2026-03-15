"use client";

import { useState, useEffect } from "react";
import { CharacterAvatar } from "./character-avatar";

interface Props {
  characterClass: string;
  level: number;
}

export function CharacterCompanion({ characterClass, level }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("companion-visible");
    if (stored === "false") setVisible(false);
  }, []);

  const toggle = () => {
    setVisible((v) => {
      localStorage.setItem("companion-visible", String(!v));
      return !v;
    });
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-10 flex flex-col items-end gap-1">
      {visible && (
        <div className="animate-companion-bob">
          <CharacterAvatar
            characterClass={characterClass}
            level={level}
            variant="companion"
            size="sm"
            animated
          />
        </div>
      )}
      <button
        onClick={toggle}
        className="text-xs text-gray-400 hover:text-gray-600 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm transition-colors"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
