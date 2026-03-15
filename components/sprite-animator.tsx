"use client";

import { CSSProperties, useId, useState, useEffect } from "react";

interface SpriteAnimatorProps {
  /** URL to the horizontal spritesheet image */
  src: string;
  /** Width of a single frame in px */
  frameWidth: number;
  /** Height of a single frame in px */
  frameHeight: number;
  /** Total number of frames in the spritesheet */
  frameCount: number;
  /** Animation duration for one full cycle in seconds */
  duration?: number;
  /** CSS size to render at (scales the frame) */
  displayWidth?: number;
  displayHeight?: number;
  /** Additional className */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Called if the spritesheet image fails to load */
  onError?: () => void;
}

export function SpriteAnimator({
  src,
  frameWidth,
  frameHeight,
  frameCount,
  duration = 0.8,
  displayWidth,
  displayHeight,
  className = "",
  alt,
  onError,
}: SpriteAnimatorProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const id = useId().replace(/:/g, "");
  const animName = `sprite-${id}`;

  const dw = displayWidth ?? frameWidth;
  const dh = displayHeight ?? frameHeight;
  const scaleX = dw / frameWidth;
  const totalWidth = frameWidth * frameCount;

  // Preload the spritesheet to detect load errors safely
  useEffect(() => {
    let isMounted = true;
    setLoaded(false);
    setFailed(false);

    const img = new Image();

    img.onload = () => {
      if (isMounted) setLoaded(true);
    };

    img.onerror = () => {
      if (isMounted) {
        setFailed(true);
        if (onError) onError();
      }
    };

    img.src = src;

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (failed || !loaded) return null;

  const style: CSSProperties = {
    width: dw,
    height: dh,
    backgroundImage: `url(${src})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${totalWidth * scaleX}px ${dh}px`,
    backgroundPosition: "0 0",
    animation: `${animName} ${duration}s steps(${frameCount}) infinite`,
    imageRendering: "pixelated",
  };

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          from { background-position: 0 0; }
          to { background-position: -${totalWidth * scaleX}px 0; }
        }
      `}</style>
      <div
        className={className}
        style={style}
        role="img"
        aria-label={alt}
      />
    </>
  );
}
