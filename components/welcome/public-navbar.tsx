"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPublicFeedback } from "@/lib/actions/feedback-actions";

const NAV_LINKS = [
  { href: "#caracteristicas", label: "Características" },
  { href: "#modalidades", label: "Modalidades" },
  { href: "#historias", label: "Historias de Éxito" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#footer", label: "Contáctanos" },
];

type FeedbackStep = "select" | "compose";
type FeedbackType = "GENERAL_ISSUE" | "GENERAL_IDEA";

function FeedbackDropdown({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<FeedbackStep>("select");
  const [type, setType] = useState<FeedbackType>("GENERAL_IDEA");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    setError("");
    const result = await createPublicFeedback({ type, message });
    if (result.success) {
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } else {
      setError(result.error || "Error al enviar.");
    }
    setSubmitting(false);
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out]"
    >
      {submitted ? (
        <div className="p-6 text-center">
          <div className="text-green-400 text-3xl mb-2">✓</div>
          <p className="text-white font-medium">¡Gracias por tu feedback!</p>
        </div>
      ) : step === "select" ? (
        <div className="p-5">
          <p className="text-white font-semibold text-sm mb-4">
            ¿Qué quieres compartir?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setType("GENERAL_ISSUE"); setStep("compose"); }}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-800 border border-gray-700 hover:border-orange-500/50 transition-all"
            >
              <span className="text-2xl">⚠️</span>
              <span className="text-white text-sm font-medium">Problema</span>
              <span className="text-gray-400 text-xs">con la página</span>
            </button>
            <button
              type="button"
              onClick={() => { setType("GENERAL_IDEA"); setStep("compose"); }}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-800 border border-gray-700 hover:border-yellow-500/50 transition-all"
            >
              <span className="text-2xl">💡</span>
              <span className="text-white text-sm font-medium">Idea</span>
              <span className="text-gray-400 text-xs">para mejorar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={4}
            autoFocus
            placeholder={
              type === "GENERAL_ISSUE"
                ? "Describe el problema..."
                : "Mi idea para mejorar es..."
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
          />
          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={() => { setStep("select"); setMessage(""); setError(""); }}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Atrás
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackBtnRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Toggle that avoids the double-toggle race with outside-click listener
  const toggleFeedback = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFeedback((prev) => !prev);
  }, []);

  const closeFeedback = useCallback(() => setShowFeedback(false), []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center h-16">
        {/* Logo */}
        <a href="#hero">
          <Image
            src="/logo.png"
            alt="Academia Dialéctica"
            width={75}
            height={54}
            priority
          />
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-all duration-300 ease-out hover:text-blue-600"
            >
              {link.label}
            </a>
          ))}

          {/* Feedback button */}
          <div className="relative">
            <button
              ref={feedbackBtnRef}
              type="button"
              onClick={toggleFeedback}
              className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-full transition-all duration-300 ease-out hover:border-blue-400 hover:text-blue-600"
            >
              Feedback
            </button>
            {showFeedback && (
              <FeedbackDropdown onClose={closeFeedback} />
            )}
          </div>

          <Link
            href="/login"
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full transition-all duration-300 ease-out hover:bg-blue-700 hover:-translate-y-0.5"
          >
            Acceso
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xl">
          <div className="flex flex-col p-6 gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-gray-800 py-2 transition-all duration-300 ease-out hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={toggleFeedback}
                className="text-base font-medium text-gray-800 py-2 text-left transition-all duration-300 ease-out hover:text-blue-600"
              >
                Feedback
              </button>
              {showFeedback && (
                <FeedbackDropdown onClose={closeFeedback} />
              )}
            </div>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="mt-2 px-5 py-3 bg-blue-600 text-white text-base font-semibold rounded-full text-center transition-all duration-300 ease-out hover:bg-blue-700"
            >
              Acceso
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
