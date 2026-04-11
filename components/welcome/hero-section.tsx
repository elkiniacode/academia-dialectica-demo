"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NeuronCanvas } from "./neuron-canvas";
import { SpriteAnimator } from "../sprite-animator";
import { createLead } from "@/lib/actions/lead-actions";
import { trackGameStarted, trackGameCompleted, trackGameOver, trackRegistrationSubmitted, trackCTAClicked } from "@/lib/analytics";
import { createPublicFeedback } from "@/lib/actions/feedback-actions";
import { useGameTour } from "@/hooks/use-game-tour";
import { GameTour } from "./game-tour";

const PALETTE_NAMES = ["Cian", "Púrpura", "Verde Azulado", "Azul", "Rosa"];

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_MULTIPLIER = { easy: 1.0, medium: 1.5, hard: 2.0 } as const;

interface HeroSectionProps {
  onParentHookClick?: () => void;
  parentSource?: boolean;
  onParentFormOpened?: () => void;
}

export function HeroSection({ onParentHookClick, parentSource, onParentFormOpened }: HeroSectionProps = {}) {
  const router = useRouter();

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
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [formMode, setFormMode] = useState<"game" | "standalone" | "parent">("game");
  const [gameCharacterClass, setGameCharacterClass] = useState<string | null>(null);
  const [showCharacterStep, setShowCharacterStep] = useState(false);
  const [gameRating, setGameRating] = useState(0);
  const [gameComment, setGameComment] = useState("");
  const [showGameComment, setShowGameComment] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const difficultyRef = useRef(difficulty);
  const timeLeftRef = useRef(timeLeft);
  const scoreRef = useRef(score);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const { tourStep, isTourActive, startTourIfFirstTime, nextStep, skipTour, replayTour } = useGameTour();

  // Open registration form in parent mode when triggered by provider
  useEffect(() => {
    if (parentSource) {
      setFormMode("parent");
      setFormSubmitted(false);
      setShowForm(true);
      onParentFormOpened?.();
    }
  }, [parentSource, onParentFormOpened]);

  // Detect phone landscape (max-height: 500px excludes tablets/desktops)
  useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsLandscape(e.matches);
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useLayoutEffect(() => {
    difficultyRef.current = difficulty;
    timeLeftRef.current = timeLeft;
    scoreRef.current = score;
  }, [difficulty, timeLeft, score]);

  useEffect(() => {
    if (!gameActive || gameOver || isTourActive) return;

    const intervalId = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        setGameOver(true);
        setGameActive(false);
        setTimeLeft(0);
        trackGameOver(difficultyRef.current, scoreRef.current);
      } else {
        setTimeLeft((prev) => prev - 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameActive, gameOver, isTourActive]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    // Only attach game stats when the form was opened from a game win
    const leadData = {
      name,
      email,
      phone,
      gameScore: formMode === "game" ? finalCerebritos : undefined,
      difficulty: formMode === "game" ? difficulty : undefined,
      characterClass: formMode === "game" ? (gameCharacterClass ?? undefined) : undefined,
      source: formMode === "parent" ? "parent" : undefined,
    };

    const [result] = await Promise.all([
      createLead(leadData),
      new Promise((r) => setTimeout(r, 600)),
    ]);

    if (result.success) {
      trackRegistrationSubmitted(
        formMode === "game" ? difficulty : undefined,
        formMode === "game" ? finalCerebritos : undefined,
        formMode,
      );
      // Refresh canvas to ambient state as soon as the game flow is done
      setGameSessionId((prev) => prev + 1);
      router.push("/gracias");
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
    setShowCharacterStep(false);
    setGameCharacterClass(null);
    setFormMode("game");
    setGameSessionId((prev) => prev + 1);
    setGameRating(0);
    setGameComment("");
    setShowGameComment(false);
    setRatingSubmitted(false);
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
    const cerebritos = Math.floor((basePoints + timeBonus) * mult);
    setFinalCerebritos(cerebritos);
    trackGameCompleted(difficultyRef.current, cerebritos, timeLeftRef.current, scoreRef.current);
  }, []);

  const handleDifficultyStart = (d: Difficulty) => {
    setDifficulty(d);
    startGame();
    trackGameStarted(d);
    startTourIfFirstTime();
  };

  const timerMinutes = Math.floor(timeLeft / 60);
  const timerSeconds = String(timeLeft % 60).padStart(2, "0");

  // ==========================================
  // UPDATED JSX UI (BANKIST SPLIT-SCREEN)
  // ==========================================
  return (
    <section id="hero" className="relative pt-24 pb-20 lg:pt-10 lg:pb-10 bg-blue-200 overflow-hidden">

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
            <p className="text-xs font-semibold text-gray-500 tracking-widest uppercase mb-3">
              Escoge tu personaje favorito
            </p>
            <div className="flex gap-6 mb-10">
              {["guerrero", "mago", "explorador"].map((cls) => (
                <button
                  key={cls}
                  onClick={() => { setSelectedClass(cls); setShowClassModal(true); }}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  <div className={`p-2 rounded-full transition-all duration-300 group-hover:scale-110 ${
                    selectedClass === cls
                      ? "bg-blue-500/40 ring-2 ring-blue-500 scale-110"
                      : "bg-blue-500/10 group-hover:bg-blue-500/20"
                  }`}>
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
                  <span className={`text-xs font-bold mt-3 tracking-widest uppercase transition-colors ${
                    selectedClass === cls ? "text-blue-500" : "text-blue-600"
                  }`}>
                    {cls}
                  </span>
                </button>
              ))}
            </div>

            {/* CTAs - Redesigned & Flex wrapped */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => { trackCTAClicked("empieza_juego"); setShowRules(true); }}
                className="bg-blue-600 text-white text-center rounded-full px-8 py-3 font-semibold shadow-lg shadow-blue-600/30 hover:-translate-y-1 transition-all duration-300"
              >
                Empieza el Juego
              </button>
              <button
                onClick={() => {
                  trackCTAClicked("conoce_mas");
                  setFormMode("standalone");
                  setFormSubmitted(false);
                  setShowForm(true);
                }}
                className="bg-white text-gray-900 text-center border border-gray-200 rounded-full px-8 py-3 font-semibold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                Conoce Más
              </button>
              {onParentHookClick && (
                <button
                  onClick={onParentHookClick}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center rounded-full px-8 py-3 font-semibold shadow-lg shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300 animate-parent-pulse"
                >
                  ¿Se aburre estudiando?
                </button>
              )}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: The Floating Game Container */}
        <div
          ref={gameContainerRef}
          className={`relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 ring-1 ring-gray-900/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 transition-all duration-500 ease-in-out ${
            isLandscape ? 'aspect-auto h-[70vh]' : 'aspect-square'
          } lg:aspect-auto lg:h-[600px] ${
            gameActive || showRules || gameOver || gameComplete
              ? `lg:col-span-2 lg:h-[80vh] lg:max-h-[700px]${isLandscape ? ' h-[75vh]' : ''}`
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
            paused={isTourActive}
            onNeuronClicked={handleNeuronClicked}
            onGameComplete={handleGameComplete}
          />

          {/* LAYER 2: Game HUD (Trapped inside the relative container) */}
          {gameActive && targetPaletteIdx !== null && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-[95%] md:w-auto bg-white/10 backdrop-blur-md px-2 sm:px-4 md:px-6 rounded-2xl md:rounded-full border border-white/20 text-white flex flex-wrap items-center justify-center gap-1 sm:gap-2 md:gap-4 shadow-xl text-xs sm:text-sm ${isLandscape ? 'top-2 py-1' : 'top-4 sm:top-8 py-2 sm:py-3'}`}
              style={{ zIndex: 20 }}
            >
              <span className="font-semibold">Objetivo:</span>
              <span className="text-base sm:text-xl font-bold tracking-wider uppercase">
                {PALETTE_NAMES[targetPaletteIdx]}
              </span>
              <span data-tour="score" className="bg-white text-blue-900 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-sm font-bold">
                Puntos: {score}
              </span>
              <span
                data-tour="timer"
                className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-sm font-bold tabular-nums ${
                  timeLeft <= 30
                    ? "bg-red-500/70 text-white animate-pulse"
                    : "bg-blue-500/50 text-white"
                }`}
              >
                {timerMinutes}:{timerSeconds}
              </span>
              {remaining > 0 && (
                <span className="bg-blue-500/50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-sm font-bold">
                  Faltan: {remaining}
                </span>
              )}
              {!isTourActive && (
                <button
                  type="button"
                  onClick={replayTour}
                  className="ml-1 text-white/70 hover:text-white transition-colors"
                  aria-label="Ayuda"
                  title="Ayuda"
                >
                  ❓
                </button>
              )}
              <button
                onClick={quitGame}
                className="ml-1 text-white/70 hover:text-white font-bold transition-colors"
                aria-label="Salir del juego"
              >
                ✕
              </button>
            </div>
          )}

          {/* LAYER 3: Game Tour overlay */}
          {gameActive && isTourActive && (
            <GameTour
              step={tourStep}
              onNext={nextStep}
              onSkip={skipTour}
              containerRef={gameContainerRef}
            />
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

      {/* Character selection modal */}
      {showClassModal && selectedClass && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" style={{ zIndex: 60 }}>
          <div className="bg-white p-10 rounded-3xl max-w-sm w-full text-center shadow-2xl ring-1 ring-gray-900/5 mx-4">
            <div className="w-24 h-24 mx-auto mb-6 p-2 rounded-full bg-blue-500/10 ring-2 ring-blue-500">
              <SpriteAnimator
                src={`/characters/${selectedClass}/idle.png`}
                frameWidth={256}
                frameHeight={256}
                frameCount={4}
                displayWidth={80}
                displayHeight={80}
                duration={0.8}
                alt={selectedClass}
              />
            </div>
            <p className="tracking-widest uppercase text-xs font-bold text-blue-600 mb-2">Tu personaje</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2 capitalize">{selectedClass}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              ¡Gracias por tu elección! Dale click a <strong className="text-gray-700">Empieza el Juego</strong>, gana y cuando te registres, podrás comenzar tu aventura como <strong className="text-gray-700 capitalize">{selectedClass}</strong>.
            </p>
            <button
              onClick={() => setShowClassModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/30"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Completion modal */}
      {(gameComplete || ((formMode === "standalone" || formMode === "parent") && (showForm || formSubmitted))) && (
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
                {formMode === "game" ? (
                  <button
                    onClick={() => {
                      setGameComplete(false);
                      setShowRules(true);
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-xl transition-colors"
                  >
                    Jugar de Nuevo
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowForm(false); setFormSubmitted(false); setFormMode("game"); }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-xl transition-colors"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            ) : showForm ? (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                  {formMode === "parent" ? "Sé parte de la familia" : formMode === "standalone" ? "Regístrate para más información" : "Reclama tu Premio"}
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
                  onClick={() => {
                    setShowForm(false);
                    setErrorMsg("");
                    if (formMode === "standalone" || formMode === "parent") setFormMode("game");
                  }}
                  className="mt-6 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                >
                  ← Atrás
                </button>
              </div>
            ) : showCharacterStep ? (
              /* Character selection step — shown between score display and form */
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                  Para ratificar el personaje que quieres, escoge:
                </h2>
                <p className="text-gray-500 text-sm mb-8">Tu personaje define tu experiencia en Academia Dialéctica.</p>
                <div className="flex justify-center gap-6 mb-8">
                  {(["guerrero", "mago", "explorador"] as const).map((cls) => (
                    <button
                      key={cls}
                      onClick={() => { setGameCharacterClass(cls); setShowCharacterStep(false); setShowForm(true); }}
                      className={`flex flex-col items-center group focus:outline-none`}
                    >
                      <div className={`p-2 rounded-full transition-all duration-300 group-hover:scale-110 ${
                        gameCharacterClass === cls
                          ? "bg-blue-500/40 ring-2 ring-blue-500 scale-110"
                          : "bg-blue-500/10 group-hover:bg-blue-500/20"
                      }`}>
                        <SpriteAnimator
                          src={`/characters/${cls}/idle.png`}
                          frameWidth={256} frameHeight={256} frameCount={4}
                          displayWidth={80} displayHeight={80} duration={0.8} alt={cls}
                        />
                      </div>
                      <span className="text-xs font-bold mt-3 tracking-widest uppercase text-blue-600 capitalize">{cls}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowCharacterStep(false)}
                  className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
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

                {/* Game Rating */}
                <div className="mb-6 text-center">
                  <p className="text-gray-500 text-sm mb-2">
                    {ratingSubmitted ? "¡Gracias por tu calificación!" : "Califica tu experiencia"}
                  </p>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        disabled={ratingSubmitted}
                        onClick={async () => {
                          setGameRating(star);
                          if (!showGameComment) setShowGameComment(true);
                        }}
                        className={`text-2xl transition-transform hover:scale-110 ${
                          ratingSubmitted ? "cursor-default" : "cursor-pointer"
                        } ${star <= gameRating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {showGameComment && !ratingSubmitted && (
                    <div className="mt-3 animate-[fadeIn_0.3s_ease-out]">
                      <textarea
                        value={gameComment}
                        onChange={(e) => setGameComment(e.target.value)}
                        maxLength={2000}
                        rows={2}
                        placeholder="Deja un comentario... (opcional)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await createPublicFeedback({
                            type: "GAME_RATING",
                            rating: gameRating,
                            message: gameComment || undefined,
                          });
                          setRatingSubmitted(true);
                        }}
                        className="mt-1 px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Enviar
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 mb-4 text-left text-sm leading-relaxed">
                  Para desbloquear este nuevo mundo, ingresa tus datos. Evaluaremos tu perfil y, si haces <em>match</em> con nuestra metodología, te enviaremos tu acceso exclusivo.
                </p>
                <p className="text-gray-600 mb-8 text-left text-sm leading-relaxed">
                  En <strong>Academia Dialéctica</strong>, una educación personalizada actúa como el catalizador que fortalece tus conexiones neuronales, haciendo que tu aprendizaje sea más rápido y profundo.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { trackCTAClicked("reclama_premio"); setShowCharacterStep(true); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 shadow-lg shadow-blue-600/30 text-white font-bold py-4 rounded-xl transition-all"
                  >
                    Reclama tu Premio
                  </button>
                  <button
                    onClick={() => {
                      trackCTAClicked("jugar_de_nuevo");
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
