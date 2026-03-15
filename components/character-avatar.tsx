"use client";

import { useState } from "react";
import { SpriteAnimator } from "./sprite-animator";

interface Props {
  characterClass: string;
  level: number;
  variant?: "default" | "idle" | "companion";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const CLASS_COLORS: Record<string, string> = {
  guerrero: "bg-red-500",
  mago: "bg-purple-500",
  explorador: "bg-green-500",
};

const SPRITE_CONFIG = {
  frameWidth: 256,
  frameHeight: 256,
  frameCount: 4,
  duration: 0.8,
} as const;

const SIZE_MAP = {
  sm: 48,
  md: 128,
  lg: 192,
} as const;

const SIZE_CLASSES = {
  sm: "w-12 h-12",
  md: "w-32 h-32",
  lg: "w-48 h-48 md:w-64 md:h-64",
} as const;

export function CharacterAvatar({
  characterClass,
  level,
  variant = "default",
  size = "md",
  animated = false,
}: Props) {
  const [spriteFailed, setSpriteFailed] = useState(false);
  const [imgError, setImgError] = useState(false);

  const safeClass = characterClass || "Desconocido";
  const cls = safeClass.toLowerCase();
  const cappedLevel = Math.min(level, 3);
  const letter = safeClass.charAt(0).toUpperCase();
  const bgColor = CLASS_COLORS[cls] ?? "bg-gray-500";

  const spriteSrc = `/characters/${cls}/idle.png`;
  const levelSrc = `/characters/${cls}/level-${cappedLevel}.png`;
  const displaySize = SIZE_MAP[size];

  // 1. First Priority: The Animated Sprite
  if (animated && (variant === "idle" || variant === "companion") && !spriteFailed) {
    return (
      <SpriteAnimator
        src={spriteSrc}
        frameWidth={SPRITE_CONFIG.frameWidth}
        frameHeight={SPRITE_CONFIG.frameHeight}
        frameCount={SPRITE_CONFIG.frameCount}
        duration={SPRITE_CONFIG.duration}
        displayWidth={displaySize}
        displayHeight={displaySize}
        alt={`${safeClass} nivel ${cappedLevel}`}
        className="rounded-xl"
        onError={() => setSpriteFailed(true)}
      />
    );
  }

  // 2. Last Resort: The Colored Letter
  if (imgError) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} rounded-xl flex items-center justify-center shadow-md border-4 border-white transform transition-transform hover:scale-105 ${bgColor}`}
      >
        <span className={`text-white font-black ${size === "sm" ? "text-lg" : size === "lg" ? "text-6xl" : "text-5xl"}`}>
          {letter}
        </span>
      </div>
    );
  }

  // 3. Middle Fallback / Default: The Static Image
  return (
    <img
      src={levelSrc}
      alt={`${safeClass} nivel ${cappedLevel}`}
      className={`${SIZE_CLASSES[size]} bg-gray-100 rounded-xl object-cover shadow-md border-4 border-white transform transition-transform hover:scale-105`}
      style={{ imageRendering: "pixelated" }}
      onError={() => setImgError(true)}
    />
  );
}
