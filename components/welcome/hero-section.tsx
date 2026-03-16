"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { NeuronCanvas } from "./neuron-canvas";
import { SpriteAnimator } from "../sprite-animator";
import { createLead } from "@/lib/actions/lead-actions";

const PALETTE_NAMES = ["Cian", "Púrpura", "Verde Azulado", "Azul", "Rosa"];

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_MULTIPLIER = { easy: 1.0, medium: 1.5, hard: 2.0 } as const;

export function HeroSection() {
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

  // Refs for values needed in memoized callbacks (synced via useLayoutEffect)
  const difficultyRef = useRef(difficulty);
  const timeLeftRef = useRef(timeLeft);
  const scoreRef = useRef(score);

  useLayoutEffect(() => {
    difficultyRef.current = difficulty;
    timeLeftRef.current = timeLeft;
    scoreRef.current = score;
  }, [difficulty, timeLeft, score]);

  // Countdown timer — pure updates + safe side-effects via ref
  useEffect(() => {
    if (!gameActive || gameOver) return;

    const intervalId = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        // Side effects outside the state updater (React Strict Mode safe)
        setGameOver(true);
        setGameActive(false);
        setTimeLeft(0);
      } else {
        // Pure state updater
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

    // Calculate final score: 50pts/neuron + 10pts/second remaining × difficulty multiplier
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

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white min-h-screen">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
      </div>

      {/* LAYER 1: Physics engine — key forces fresh mount on game reset */}
      <NeuronCanvas
        key={gameSessionId}
        gameActive={gameActive}
        targetPaletteIdx={targetPaletteIdx}
        score={score}
        difficulty={difficulty}
        onNeuronClicked={handleNeuronClicked}
        onGameComplete={handleGameComplete}
      />

      {/* LAYER 2: Hero content */}
      {!gameActive && !gameComplete && !gameOver && !showRules && (
        <div
          className="relative max-w-5xl mx-auto px-6 py-24 md:py-32 text-center pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            <span className="text-blue-200">Academia Dialéctica</span>
            <br />
            Clases Particulares y Tutoría Personalizada
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Acompañamiento académico adaptado a cada estudiante. Clases
            presenciales y online para todos los niveles, desde colegio hasta
            universidad.
          </p>
          {/* Character showcase */}
          <div className="flex justify-center gap-6 md:gap-10 mb-12">
            {["guerrero", "mago", "explorador"].map((cls) => (
              <div key={cls} className="flex flex-col items-center group">
                <div className="p-2 rounded-full bg-blue-500/10 animate-character-glow transition-transform group-hover:scale-110">
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
                <span className="text-xs font-bold text-blue-300 mt-3 tracking-widest uppercase opacity-80">
                  {cls}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-lg"
            >
              Acceso Administrador
            </Link>
            <button
              onClick={() => setShowRules(true)}
              className="px-8 py-4 bg-blue-500/40 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-blue-500/60 transition-colors text-lg border border-white/20 animate-bounce"
            >
              Empieza el Juego
            </button>
          </div>
        </div>
      )}

      {/* LAYER 2b: Rules modal with difficulty selection */}
      {showRules && !gameActive && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 50 }}
        >
          <div className="bg-white p-8 rounded-xl max-w-lg text-center shadow-2xl mx-4">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              Reglas del Juego
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-6 text-left">
              Hola, en este juego debes darle click a las neuronas. Explotalas y
              ganaras puntos. Usa las paredes de los bordes y del centro para
              encerrar las neuronas. Tu puntaje se decide por el tiempo que
              demores y la dificultad que escojas. Dependiendo de tu puntaje
              obtendras tu premio. ¡Así que buena suerte amigo y a jugar!
            </p>
            <p className="text-gray-600 text-sm font-semibold mb-4">
              Elige tu dificultad:
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDifficultyStart("easy")}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
              >
                Fácil
              </button>
              <button
                onClick={() => handleDifficultyStart("medium")}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors"
              >
                Medio
              </button>
              <button
                onClick={() => handleDifficultyStart("hard")}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
              >
                Difícil
              </button>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      )}

      {/* LAYER 3: Game HUD — responsive wrapping for mobile */}
      {gameActive && targetPaletteIdx !== null && (
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[90%] md:w-auto bg-white/10 backdrop-blur-md px-4 py-3 md:px-6 rounded-3xl md:rounded-full border border-white/20 text-white flex flex-wrap items-center justify-center gap-2 md:gap-4"
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
                ? "bg-red-500/70 text-white"
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

      {/* LAYER 4a: Game Over modal (timer ran out) */}
      {gameOver && !gameComplete && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 50 }}
        >
          <div className="bg-white p-8 rounded-xl max-w-md text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-red-500 mb-4">
              ¡Perdiste!
            </h2>
            <p className="text-gray-700 mb-2 font-semibold">
              Se acabó el tiempo.
            </p>
            <p className="text-gray-600 mb-6 text-sm">
              Alcanzaste <strong>{score} puntos</strong>. ¡Inténtalo de nuevo!
            </p>
            <button
              onClick={() => {
                setGameOver(false);
                setShowRules(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Jugar de Nuevo
            </button>
          </div>
        </div>
      )}

      {/* LAYER 4b: Completion modal with score + lead form */}
      {gameComplete && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 50 }}
        >
          <div className="bg-white p-8 rounded-xl max-w-md text-center shadow-2xl">
            {formSubmitted ? (
              <>
                <div className="text-5xl mb-4 text-green-500 animate-bounce">
                  ✓
                </div>
                <h2 className="text-3xl font-bold text-blue-600 mb-4">
                  ¡Gracias por registrarte!
                </h2>
                <p className="text-gray-600 mb-6">
                  Nos pondremos en contacto contigo pronto.
                </p>
                <button
                  onClick={() => {
                    setGameComplete(false);
                    setShowRules(true);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                >
                  Jugar de Nuevo
                </button>
              </>
            ) : showForm ? (
              <>
                <h2 className="text-2xl font-bold text-blue-600 mb-6">
                  Regístrate
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Nombre"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Correo electrónico"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Teléfono (opcional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errorMsg && (
                    <p className="text-red-600 text-sm font-medium">
                      {errorMsg}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    {submitting ? "Enviando..." : "Enviar"}
                  </button>
                </form>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setErrorMsg("");
                  }}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Volver
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-blue-600 mb-4">
                  ¡Felicidades!
                </h2>
                <p className="text-gray-700 mb-2 font-semibold">
                  Acabas de desbloquear tu amigo digital y ganaste{" "}
                  <strong className="text-blue-600 text-xl">
                    {finalCerebritos} cerebritos
                  </strong>
                  .
                </p>
                <p className="text-gray-600 mb-2 text-left text-sm leading-relaxed">
                  Para desbloquear este nuevo mundo, ingresa tus datos.
                  Evaluaremos tu perfil y, si haces <em>match</em> con nuestra
                  metodología, te enviaremos tu acceso exclusivo por correo o
                  por WhatsApp.
                </p>
                <p className="text-gray-600 mb-6 text-left text-sm leading-relaxed">
                  El cerebro es como esta red: un universo de posibilidades. Al
                  aprender algo nuevo, creas nuevas conexiones
                  (neuroplasticidad). En{" "}
                  <strong>Academia Dialéctica</strong>, una educación
                  personalizada y una buena tutoría actúan como el catalizador
                  que fortalece estos enlaces, haciendo que tu aprendizaje sea
                  más rápido, profundo y duradero.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Reclama tu Premio
                  </button>
                  <button
                    onClick={() => {
                      setGameComplete(false);
                      setShowRules(true);
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                  >
                    Jugar de Nuevo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
