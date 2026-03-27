"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export function GraciasConversion() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const conversionLabel = process.env.NEXT_PUBLIC_GA_CONVERSION_LABEL;

    if (gaId && conversionLabel && typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "conversion", {
        send_to: `${gaId}/${conversionLabel}`,
      });
    }
  }, []);

  return null;
}
