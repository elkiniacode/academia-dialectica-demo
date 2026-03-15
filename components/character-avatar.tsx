"use client";

import { useState } from "react";

interface Props {
  characterClass: string;
  level: number;
}

const CLASS_COLORS: Record<string, string> = {
  guerrero: "bg-red-500",
  mago: "bg-purple-500",
  explorador: "bg-green-500",
};

export function CharacterAvatar({ characterClass, level }: Props) {
  const [imgError, setImgError] = useState(false);
  const cappedLevel = Math.min(level, 3);

  const safeClass = characterClass || "Desconocido";
  const src = `/characters/${safeClass.toLowerCase()}/level-${cappedLevel}.png`;
  const letter = safeClass.charAt(0).toUpperCase();
  const bgColor = CLASS_COLORS[safeClass.toLowerCase()] ?? "bg-gray-500";

  if (imgError) {
    return (
      <div
        className={`w-32 h-32 rounded-xl flex items-center justify-center shadow-md border-4 border-white transform transition-transform hover:scale-105 ${bgColor}`}
      >
        <span className="text-white text-5xl font-black">{letter}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${safeClass} nivel ${cappedLevel}`}
      className="w-32 h-32 bg-gray-100 rounded-xl object-cover shadow-md border-4 border-white transform transition-transform hover:scale-105"
      onError={() => setImgError(true)}
    />
  );
}
