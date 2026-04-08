import posthog from "posthog-js";

export function trackGameStarted(difficulty: string) {
  posthog.capture("game_started", { difficulty });
}

export function trackGameCompleted(
  difficulty: string,
  cerebritos: number,
  timeRemaining: number,
  score: number,
) {
  posthog.capture("game_completed", {
    difficulty,
    cerebritos,
    time_remaining: timeRemaining,
    score,
  });
}

export function trackGameOver(difficulty: string, score: number) {
  posthog.capture("game_over", { difficulty, score });
}

export function trackRegistrationSubmitted(
  difficulty: string | undefined,
  cerebritos: number | undefined,
  formMode: string,
) {
  posthog.capture("registration_submitted", {
    difficulty,
    cerebritos,
    form_mode: formMode,
  });
}
