"use client";

import { useEffect, useRef, useState } from "react";

interface TourStep {
  id: string;
  title: string;
  text: string;
  target: "inline" | "dom";
  domSelector?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "neurons",
    title: "Neuronas",
    text: "Esta es una neurona, dale click, estállala y gana puntos. ¡Entre más puntos más premios!",
    target: "inline",
  },
  {
    id: "walls",
    title: "Paredes",
    text: "Las neuronas rebotan en estas paredes. ¡Úsalas para atraparlas!",
    target: "inline",
  },
  {
    id: "timer",
    title: "Temporizador",
    text: "Tienes 2 minutos para completar el juego. ¡Apúrate!",
    target: "dom",
    domSelector: "[data-tour='timer']",
  },
  {
    id: "score",
    title: "Cerebritos",
    text: "Estos puntos se ganan por dificultad, tiempo que demoras en terminar y número de neuronas. Se llaman cerebritos y luego de registrarte te permiten reclamar los premios.",
    target: "dom",
    domSelector: "[data-tour='score']",
  },
];

function NeuronIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto mb-2">
      {/* Glow */}
      <circle cx="40" cy="40" r="30" fill="rgba(100,190,240,0.15)" />
      {/* Dendrites */}
      <line x1="40" y1="40" x2="15" y2="12" stroke="rgba(100,190,240,0.8)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="40" x2="68" y2="15" stroke="rgba(100,190,240,0.8)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="40" x2="72" y2="50" stroke="rgba(100,190,240,0.8)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="40" x2="60" y2="70" stroke="rgba(100,190,240,0.8)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="40" x2="12" y2="62" stroke="rgba(100,190,240,0.8)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="40" x2="8" y2="35" stroke="rgba(100,190,240,0.8)" strokeWidth="2" strokeLinecap="round" />
      {/* Synaptic knobs */}
      <circle cx="15" cy="12" r="3" fill="rgba(160,220,255,0.9)" />
      <circle cx="68" cy="15" r="3" fill="rgba(160,220,255,0.9)" />
      <circle cx="72" cy="50" r="3" fill="rgba(160,220,255,0.9)" />
      <circle cx="60" cy="70" r="3" fill="rgba(160,220,255,0.9)" />
      <circle cx="12" cy="62" r="3" fill="rgba(160,220,255,0.9)" />
      <circle cx="8" cy="35" r="3" fill="rgba(160,220,255,0.9)" />
      {/* Soma */}
      <circle cx="40" cy="40" r="12" fill="rgba(160,210,250,0.9)" />
      {/* Nucleus */}
      <circle cx="40" cy="40" r="5" fill="rgba(200,230,255,1)" />
      {/* Highlight */}
      <circle cx="37" cy="37" r="2" fill="white" opacity="0.6" />
    </svg>
  );
}

function WallIcon() {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" className="mx-auto mb-2">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.5)" />
        </marker>
      </defs>
      {/* Left L-wall */}
      <path d="M10 10 L10 40 L30 40" fill="none" stroke="rgba(100,190,240,0.7)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right L-wall */}
      <path d="M70 10 L70 40 L50 40" fill="none" stroke="rgba(100,190,240,0.7)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bouncing neuron */}
      <circle cx="40" cy="25" r="6" fill="rgba(160,210,250,0.8)" />
      {/* Motion arrows */}
      <path d="M34 25 L28 25" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrow)" />
      <path d="M46 25 L52 25" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrow)" />
    </svg>
  );
}

interface GameTourProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function GameTour({ step, onNext, onSkip, containerRef }: GameTourProps) {
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const currentStep = TOUR_STEPS[step];

  useEffect(() => {
    const calculatePosition = () => {
      if (!currentStep || currentStep.target !== "dom" || !currentStep.domSelector || !containerRef.current) {
        setTooltipPos(null);
        return;
      }

      const target = containerRef.current.querySelector(currentStep.domSelector);
      if (!target) { setTooltipPos(null); return; }

      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const rawLeft = targetRect.left - containerRect.left + targetRect.width / 2;
      const safeLeft = Math.max(160, Math.min(containerRect.width - 160, rawLeft));

      setTooltipPos({
        top: targetRect.bottom - containerRect.top + 12,
        left: safeLeft,
      });
    };

    calculatePosition();

    window.addEventListener("resize", calculatePosition);
    return () => window.removeEventListener("resize", calculatePosition);
  }, [step, currentStep, containerRef]);

  if (!currentStep) return null;

  const isInline = currentStep.target === "inline";

  return (
    <div
      className="absolute inset-0 z-30"
      style={{ pointerEvents: "auto" }}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/60 rounded-2xl" />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute z-40 w-72 sm:w-80 animate-[fadeIn_0.3s_ease-out]"
        style={
          isInline
            ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
            : tooltipPos
              ? { top: tooltipPos.top, left: tooltipPos.left, transform: "translateX(-50%)" }
              : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        {/* Arrow for DOM-targeted steps */}
        {!isInline && tooltipPos && (
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900 mx-auto -mb-px" />
        )}

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-2xl">
          {/* Inline illustration */}
          {currentStep.id === "neurons" && <NeuronIcon />}
          {currentStep.id === "walls" && <WallIcon />}

          <h3 className="text-white font-bold text-base mb-2">{currentStep.title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{currentStep.text}</p>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-4">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-blue-500" : "w-1.5 bg-gray-600"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onSkip}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Saltar
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {step === TOUR_STEPS.length - 1 ? "¡Empezar!" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
