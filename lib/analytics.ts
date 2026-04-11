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

export function trackParentHookClicked(trigger: "hero_button" | "floating_bubble") {
  posthog.capture("parent_hook_clicked", { trigger });
}

export function trackParentModalViewed() {
  posthog.capture("parent_modal_viewed");
}

export function trackParentVideoEngaged() {
  posthog.capture("parent_video_engaged");
}

export function trackParentRegistrationStarted() {
  posthog.capture("parent_registration_started");
}

export function trackCTAClicked(cta: "empieza_juego" | "conoce_mas" | "reclama_premio" | "jugar_de_nuevo") {
  posthog.capture("cta_clicked", { cta_name: cta });
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
