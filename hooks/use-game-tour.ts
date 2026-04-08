"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "neuron-hunt-tour-seen";
const TOTAL_STEPS = 4;

function markTourSeen() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
}

export function useGameTour() {
  const [tourStep, setTourStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  const tourStepRef = useRef(tourStep);

  useEffect(() => {
    tourStepRef.current = tourStep;
  }, [tourStep]);

  const startTourIfFirstTime = useCallback(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTourStep(0);
        setIsTourActive(true);
      }
    } catch {
      // localStorage unavailable — skip tour
    }
  }, []);

  const nextStep = useCallback(() => {
    const next = tourStepRef.current + 1;
    if (next >= TOTAL_STEPS) {
      setIsTourActive(false);
      setTourStep(0);
      markTourSeen();
    } else {
      setTourStep(next);
    }
  }, []);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setTourStep(0);
    markTourSeen();
  }, []);

  const replayTour = useCallback(() => {
    setTourStep(0);
    setIsTourActive(true);
  }, []);

  return { tourStep, isTourActive, startTourIfFirstTime, nextStep, skipTour, replayTour };
}
