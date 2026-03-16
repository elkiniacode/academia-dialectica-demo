"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { NeuronCanvas } from "./neuron-canvas";
import { SpriteAnimator } from "../sprite-animator";
import { createLead } from "@/lib/actions/lead-actions";

const PALETTE_NAMES = ["Cian", "Púrpura", "Verde Azulado", "Azul", "Rosa"];

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_MULTIPLIER = { easy: 1.0, medium: 1.5, hard: 2.0 } as const;

export function HeroSection() {
  // ==========================================
  // GAME STATE & LOGIC (100% UNTOUCHED)
  // ==========================================
  const [gameActive, setGameActive] = useState(false);
  const [targetPaletteIdx, setTargetPaletteIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameSessionId, setGameSessionId] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameOver, setGameOver] = useState(false);
  const [finalCerebritos, setFinalCerebritos] = useState(0);

  const difficultyRef = useRef(difficulty);
  const timeLeftRef = useRef(timeLeft);
  const scoreRef = useRef(score);

  useLayoutEffect(() => {
    difficultyRef.current = difficulty;
    timeLeftRef.current = timeLeft;
    scoreRef.current = score;
  }, [difficulty, timeLeft, score]);

  useEffect(() => {
    if (!gameActive || gameOver) return;

    const intervalId = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        setGameOver(true);
        setGameActive(false);
        setTimeLeft(0);
      } else {
        setTimeLeft((prev) => prev - 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameActive, gameOver]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    const [result] = await Promise.all([
      createLead({
        name,
        email,
        phone,
        gameScore: finalCerebritos,
        difficulty,
      }),
      new Promise((r) => setTimeout(r, 600)),
    ]);

    if (result.success) {
      setFormSubmitted(true);
    } else {
      setErrorMsg(result.error || "Error inesperado.");
    }
    setSubmitting(false);
  };

  const startGame = useCallback(() => {
    const idx = Math.floor(Math.random() * PALETTE_NAMES.length);
    setTargetPaletteIdx(idx);
    setGameActive(true);
    setScore(0);
    setRemaining(0);
    setGameComplete(false);
    setGameOver(false);
    setTimeLeft(120);
    setFinalCerebritos(0);
    setShowForm(false);
    setFormSubmitted(false);
    setShowRules(false);
    setErrorMsg("");
    setGameSessionId((prev) => prev + 1);
  }, []);

  const quitGame = useCallback(() => {
    setGameActive(false);
    setTargetPaletteIdx(null);
    setGameSessionId((prev) => prev + 1);
  }, []);

  const handleNeuronClicked = useCallback(
    (correct: boolean, neuronsRemaining: number) => {
      if (correct) {
        setScore((prev) => prev + 1);
        setRemaining(neuronsRemaining);
      }
    },
    []
  );

  const handleGameComplete = useCallback(() => {
    setGameActive(false);
    setGameComplete(true);

    const mult = DIFFICULTY_MULTIPLIER[difficultyRef.current];
    const basePoints = scoreRef.current * 50;
    const timeBonus = timeLeftRef.current * 10;
    setFinalCerebritos(Math.floor((basePoints + timeBonus) * mult));
  }, []);

  const handleDifficultyStart = (d: Difficulty) => {
    setDifficulty(d);
    startGame();
  };

  const timerMinutes = Math.floor(timeLeft / 60);
  const timerSeconds = String(timeLeft % 60).padStart(2, "0");

  // ==========================================
  // UPDATED JSX UI (BANKIST SPLIT-SCREEN)
  // ==========================================
  return (
    <section id="hero" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-blue-50 overflow-hidden">

      {/* THE GRID CONTAINER */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

        {/* LEFT COLUMN: Typography, Sprites, CTAs */}
        {!gameActive && !gameComplete && !gameOver && !showRules && (
          <div>
            <p className="tracking-widest uppercase text-sm font-bold text-blue-600 mb-4">
              ¿Listo para aprender?
            </p>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
              Academia Dialéctica: Tu Tutoría <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Personalizada</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Acompañamiento académico adaptado a cada estudiante. Clases presenciales y online para todos los niveles.
            </p>

            {/* Character sprites - Now in a clean flex row */}
            <div className="flex gap-6 mb-10">
              {["guerrero", "mago", "explorador"].map((cls) => (
                <div key={cls} className="flex flex-col items-center group">
                  <div className="p-2 rounded-full bg-blue-500/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-500/20">
                    <SpriteAnimator
                      src={`/characters/${cls}/idle.png`}
                      frameWidth={256}
                      frameHeight={256}
                      frameCount={4}
                      displayWidth={80}
                      displayHeight={80}
                      duration={0.8}
                      alt={cls}
                    />
                  </div>
                  <span className="text-xs font-bold text-blue-600 mt-3 tracking-widest uppercase">
                    {cls}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs - Redesigned & Flex wrapped */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowRules(true)}
                className="bg-blue-600 text-white text-center rounded-full px-8 py-3 font-semibold shadow-lg shadow-blue-600/30 hover:-translate-y-1 transition-all duration-300"
              >
                Empieza el Juego
              </button>
              <a
                href="#testimonios"
                className="bg-white text-gray-900 text-center border border-gray-200 rounded-full px-8 py-3 font-semibold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                Conoce Más
              </a>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: The Floating Game Container */}
        <div
          className={`relative w-full aspect-square lg:aspect-auto lg:h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 ring-1 ring-gray-900/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 transition-all duration-500 ease-in-out ${
            gameActive || showRules || gameOver || gameComplete
              ? 'lg:col-span-2 lg:h-[80vh] lg:max-h-[700px]'
              : ''
          }`}
        >
          {/* LAYER 1: Physics engine */}
          <NeuronCanvas
            key={gameSessionId}
            gameActive={gameActive}
            targetPaletteIdx={targetPaletteIdx}
            score={score}
            difficulty={difficulty}
            onNeuronClicked={handleNeuronClicked}
            onGameComplete={handleGameComplete}
          />

          {/* LAYER 2: Game HUD (Trapped inside the relative container) */}
          {gameActive && targetPaletteIdx !== null && (
            <div
              className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] md:w-auto bg-white/10 backdrop-blur-md px-4 py-3 md:px-6 rounded-3xl md:rounded-full border border-white/20 text-white flex flex-wrap items-center justify-center gap-2 md:gap-4 shadow-xl"
              style={{ zIndex: 20 }}
            >
              <span className="font-semibold">Objetivo:</span>
              <span className="text-xl font-bold tracking-wider uppercase">
                {PALETTE_NAMES[targetPaletteIdx]}
              </span>
              <span className="bg-white text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                Puntos: {score}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold tabular-nums ${
                  timeLeft <= 30
                    ? "bg-red-500/70 text-white animate-pulse"
                    : "bg-blue-500/50 text-white"
                }`}
              >
                {timerMinutes}:{timerSeconds}
              </span>
              {remaining > 0 && (
                <span className="bg-blue-500/50 px-3 py-1 rounded-full text-sm font-bold">
                  Faltan: {remaining}
                </span>
              )}
              <button
                onClick={quitGame}
                className="ml-2 text-white/70 hover:text-white font-bold transition-colors"
                aria-label="Salir del juego"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* OUTSIDE GRID: Global Modals */}

      {/* Rules modal */}
      {showRules && !gameActive && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" style={{ zIndex: 60 }}>
          <div className="bg-white p-8 rounded-2xl max-w-lg text-center shadow-2xl mx-4 ring-1 ring-gray-900/5">
            <h2 className="text-3xl font-bold tracking-tight text-blue-600 mb-4">
              Reglas del Juego
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8 text-left">
              Explota las neuronas correctas para ganar puntos. Usa las paredes para rebotar y encerrar las neuronas. Tu puntaje se decide por tu velocidad y la dificultad que elijas. ¡Demuestra tu agilidad mental!
            </p>
            <p className="text-gray-900 text-sm font-bold tracking-widest uppercase mb-4">
              Elige tu dificultad
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={() => handleDifficultyStart("easy")}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 hover:-translate-y-1 shadow-lg shadow-green-500/30 text-white font-bold rounded-xl transition-all"
              >
                Fácil
              </button>
              <button
                onClick={() => handleDifficultyStart("medium")}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 hover:-translate-y-1 shadow-lg shadow-yellow-500/30 text-white font-bold rounded-xl transition-all"
              >
                Medio
              </button>
              <button
                onClick={() => handleDifficultyStart("hard")}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 hover:-translate-y-1 shadow-lg shadow-red-500/30 text-white font-bold rounded-xl transition-all"
              >
                Difícil
              </button>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      )}

      {/* Game Over modal */}
      {gameOver && !gameComplete && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" style={{ zIndex: 60 }}>
          <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl ring-1 ring-gray-900/5">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
              ¡Perdiste!
            </h2>
            <p className="text-gray-500 mb-6 font-medium">Se acabó el tiempo.</p>
            <div className="bg-gray-50 rounded-xl py-6 mb-8">
              <p className="text-sm text-gray-500 tracking-widest uppercase font-bold mb-1">Puntaje Final</p>
              <p className="text-5xl font-bold text-blue-600">{score}</p>
            </div>
            <button
              onClick={() => {
                setGameOver(false);
                setShowRules(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 shadow-lg shadow-blue-600/30 text-white font-bold py-4 rounded-xl transition-all"
            >
              Jugar de Nuevo
            </button>
          </div>
        </div>
      )}

      {/* Completion modal */}
      {gameComplete && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto" style={{ zIndex: 60 }}>
          <div className="bg-white p-8 md:p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl ring-1 ring-gray-900/5 my-auto">
            {formSubmitted ? (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                  ✓
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                  ¡Registro Exitoso!
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Tus datos han sido enviados. Nos pondremos en contacto contigo muy pronto.
                </p>
                <button
                  onClick={() => {
                    setGameComplete(false);
                    setShowRules(true);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-xl transition-colors"
                >
                  Jugar de Nuevo
                </button>
              </div>
            ) : showForm ? (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                  Reclama tu Premio
                </h2>
                <p className="text-gray-500 mb-8">Ingresa tus datos para continuar.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-widest uppercase mb-2">Nombre</label>
                    <input
                      name="name" type="text" required placeholder="Tu nombre completo"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-widest uppercase mb-2">Email</label>
                    <input
                      name="email" type="email" required placeholder="tucorreo@ejemplo.com"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-widest uppercase mb-2">Teléfono (Opcional)</label>
                    <input
                      name="phone" type="tel" placeholder="+57 300 000 0000"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                  {errorMsg && <p className="text-red-500 text-sm font-medium mt-1">{errorMsg}</p>}

                  <button
                    type="submit" disabled={submitting}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30"
                  >
                    {submitting ? "Enviando..." : "Enviar Registro"}
                  </button>
                </form>
                <button
                  onClick={() => { setShowForm(false); setErrorMsg(""); }}
                  className="mt-6 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                >
                  ← Atrás
                </button>
              </div>
            ) : (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                  ¡Felicidades!
                </h2>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
                  <p className="text-gray-700 mb-2 font-medium">Acabas de desbloquear tu amigo digital y ganaste</p>
                  <p className="text-4xl font-bold text-blue-600">{finalCerebritos} Cerebritos</p>
                </div>

                <p className="text-gray-600 mb-4 text-left text-sm leading-relaxed">
                  Para desbloquear este nuevo mundo, ingresa tus datos. Evaluaremos tu perfil y, si haces <em>match</em> con nuestra metodología, te enviaremos tu acceso exclusivo.
                </p>
                <p className="text-gray-600 mb-8 text-left text-sm leading-relaxed">
                  En <strong>Academia Dialéctica</strong>, una educación personalizada actúa como el catalizador que fortalece tus conexiones neuronales, haciendo que tu aprendizaje sea más rápido y profundo.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 shadow-lg shadow-blue-600/30 text-white font-bold py-4 rounded-xl transition-all"
                  >
                    Reclama tu Premio
                  </button>
                  <button
                    onClick={() => {
                      setGameComplete(false);
                      setShowRules(true);
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors"
                  >
                    Jugar de Nuevo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
