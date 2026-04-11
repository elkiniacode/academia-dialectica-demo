# 09 — Implementation: WH & Yes/No Structured Question Engine (English Academy)

## Overview

Added "Aprendizaje Guiado por IA" — a scaffolded grammar learning mode for the English Academy game. Instead of free-text writing, students construct grammatically structured questions (WH 5-part or Yes/No 4-part) to interrogate suspects in a murder mystery. Available for Mystery genre, Easy difficulty only.

## How It Works

1. Student picks Mystery → Easy → **Mode selector**: "Practica Libre" (existing) vs "Aprendizaje Guiado por IA" (new)
2. Picks grammar topic: "Preguntas" (only option; "Pasado Simple" disabled as coming soon)
3. AI generates a mystery scenario: crime scene, 3-5 suspects, physical clues, **pre-determined culprit** with motive and evidence (hidden from player)
4. Each round (5 total):
   - AI shows situation + current suspect + **investigative goal** (e.g., "Find out where the butler was at 8 PM")
   - Student picks WH or Yes/No question type
   - Student fills a **structured sentence builder** (Duolingo-style inline flow):
     - WH: Question Word (dropdown) + Auxiliary (free text) + Subject (free text) + Main Verb (3-button selection) + Complement (free text)
     - Yes/No: Auxiliary (dropdown) + Subject + Main Verb (3-button selection) + Complement
   - AI evaluates each part, reveals suspect's answer, extracts a clue
5. **Spanish fallback**: Student writes in Spanish (-150 HP), AI translates, next round forces English reconstruction (retry round, doesn't consume a real round, capped at 1 attempt)
6. **Final deduction**: After round 5, student reviews all clues and picks the culprit. Correct = +100 XP bonus.

## Phase Machine

```
topic-selecting → loading → question-type → writing → checking → feedback → question-type (loop)
                                                                            → deduction (round 5) → gameover
                              ↓ (spanish fallback)
                           translating → checking → feedback (retry)
```

## Files Created (14 new)

### Types & Constants
- **`src/types/game.ts`** — Added: `GameMode`, `GrammarTopic`, `QuestionType`, `QuestionWord`, `VerbOption`, `StructuredQuestionParts`, `Suspect`, `GuidedScenario` (with culprit/motive/evidence), `GuidedRoundData` (setup only), `GuidedPartFeedback` (with `part: keyof StructuredQuestionParts`), `GuidedEvaluation`, `GuidedPendingRetry`, `DiscoveredClue`, `GuidedStartResponse`, `GuidedContinueResponse`, `GuidedFallbackResponse`. Extended `GamePhase` with `"mode-selecting" | "topic-selecting" | "question-type" | "deduction"`.
- **`src/lib/constants.ts`** — Added: `SPANISH_FALLBACK_HP_COST = 150`, `CORRECT_DEDUCTION_XP = 100`, `QUESTION_WORDS` array, `YESNO_AUXILIARIES` (restricted to bare-infinitive-compatible: Do/Does/Did/Can/Will/Could/Should), `GUIDED_TOPIC_CONFIG`.

### Schemas
- **`src/lib/schemas.ts`** — Added: `suspectSchema`, `structuredPartsSchema`, `verbOptionSchema`, `guidedRoundDataSchema`, `guidedStartSchema` (flat: scenario fields + culprit + firstRound), `guidedPartFeedbackSchema` (hpLoss locked with literal unions + `.catch(25)`), `guidedContinueSchema` (flat: partFeedback + suspectAnswer + clue + nextRound + storyProgression), `guidedSpanishFallbackSchema`. Updated `goalAssessmentSchema` to evidence-first ordering.

### Prompts
- **`src/lib/prompts.ts`** — Added: `buildGuidedStartPrompt` (mystery generator with "To Be" ban + Object Questions only constraint), `buildGuidedContinuePrompt` (evaluates parts, suspect answer consistent with culprit truth, clue extraction, "To Be" ban on next round goals), `buildGuidedSpanishFallbackPrompt`. Updated: `buildContinuePrompt` (evidence-first goal assessment), `buildEndPrompt` (accepts `gameMode`, branches for guided mode summary).

### API Routes (3 new)
- **`src/app/api/game/guided/start/route.ts`** — POST, `streamObject` with `guidedStartSchema`
- **`src/app/api/game/guided/continue/route.ts`** — POST, `streamObject` with `guidedContinueSchema`, system message filtering, retry-specific HP instructions
- **`src/app/api/game/guided/fallback/route.ts`** — POST, `streamObject` with `guidedSpanishFallbackSchema`

### Store
- **`src/stores/gameStore.ts`** — Added state: `gameMode`, `grammarTopic`, `guidedScenario`, `guidedRound`, `guidedEvaluation`, `questionType`, `pendingRetry`, `isRetryRound`, `cluesDiscovered`, `culpritGuess`. Added actions: `setGameMode`, `setGrammarTopic`, `setQuestionType`, `startGuidedGame`, `setGuidedRoundData`, `setGuidedEvaluation`, `applyGuidedEvaluation` (HP-zero gameover check), `setPendingRetry`, `clearPendingRetry`, `applySpanishFallbackPenalty` (HP-zero check), `addClue`, `setCulpritGuess`, `completeDeduction` (XP bonus + gameover), `advanceGuidedRound` (saves clues + story progression + imagePrompt to storyParts, transitions to deduction on last round). Updated `resetGame` and `partialize`.

### UI Components (8 new)
- **`src/components/game/ModeSelectionScreen.tsx`** — Two gradient cards: "Practica Libre" (purple, BookOpen) vs "Aprendizaje Guiado por IA" (cyan, Brain)
- **`src/components/game/guided/TopicSelectionScreen.tsx`** — Grammar topic cards with per-element opacity for disabled state, native `disabled` attribute for accessibility
- **`src/components/game/guided/QuestionTypeSelector.tsx`** — WH (cyan) vs Yes/No (purple) selection with Spanish explanations and examples
- **`src/components/game/guided/StructuredQuestionInput.tsx`** — Core sentence builder. `accentClasses` mapping object (no dynamic Tailwind). `autoComplete="off"` + `spellCheck={false}`. `useEffect` clears inputs on round change. Ghost placeholders from `pendingRetry`. `font-mono` live preview. Verb selection buttons with accent-colored selected state.
- **`src/components/game/guided/SpanishFallbackInput.tsx`** — Textarea with `autoFocus`, Ctrl+Enter shortcut, "Deuda de Aprendizaje" warning with HP cost, amber theme
- **`src/components/game/guided/GuidedFeedbackPanel.tsx`** — Part-by-part evaluation (green check/red X per part, expected vs actual, explanation, HP loss). Staggered animations. Suspect answer + Spanish translation. Clue reveal with cyan Search icon.
- **`src/components/game/guided/SuspectPanel.tsx`** — Suspect info card + dual-language investigative goal (English prominent, Spanish italic). GPU-accelerated animation (`translate` + `willChange`).
- **`src/components/game/guided/DeductionScreen.tsx`** — Clue review list with clue-to-suspect hover highlighting. Suspect selection cards with amber highlight on hover-linked clues. "Analizando evidencia..." spinner during 2s confirmation delay. Staggered motive reveal (1s after verdict). Correct = Award icon + XP bonus. Wrong = XCircle + culprit reveal.

## Files Modified (3 existing)

### GameContainer.tsx
- Added 3 `useObject` hooks for guided start/continue/fallback with:
  - Lockout-bug-free ref management (guard set to `true` before side effect, reset in trigger functions)
  - Flat-to-nested schema mapping (schema fields → `GuidedScenario`, `GuidedEvaluation`)
  - `isGameOver` derived from `!object.nextRound || !object.nextRound.currentSuspect`
- Mode selection gate: Mystery+Easy shows `ModeSelectionScreen` before game starts
- Topic selection gate: `TopicSelectionScreen` when `phase === "topic-selecting"`
- Deduction rendering: `DeductionScreen` when `phase === "deduction"`
- Free-mode start effect guarded against Mystery+Easy (waits for mode selection)
- Free mode `handleModeSelect` manually triggers start + DB session with `.catch()`
- Passes all guided props to ConversationBox

### ConversationBox.tsx
- Dual rendering path: `gameMode === "guided"` vs free mode
- Guided mode renders: `SuspectPanel` (during playing/question-type/writing/translating) → `QuestionTypeSelector` → `StructuredQuestionInput` → `SpanishFallbackInput` → `GuidedFeedbackPanel`
- Free mode unchanged (IntentionButtons → FreeTextInput → FeedbackPanel)

### Sidebar.tsx
- Added optional `gameMode` and `cluesDiscovered` props
- "Pistas descubiertas" section: cyan header, clue list with round number prefix, scrollable with max height

## Key Design Decisions

1. **Pre-determined culprit**: AI chooses the culprit at game start with motive + evidence. Stored in `guidedScenario`, passed to every continue prompt so guilty suspect gives contradictory answers and innocent suspects give helpful ones. Player never sees culprit fields directly.

2. **Flat schemas, nested types**: Zod schemas are flat (what AI streams) but app types are nested (what code consumes). Mapping happens in `onFinish`. This avoids nested streaming issues while keeping clean domain types.

3. **Object Questions only**: The 5-part UI requires an auxiliary verb ("Where **did** he go?"). Subject Questions ("Who killed him?") have no auxiliary and break the structure. Explicit prompt ban.

4. **"To Be" verb ban**: Goals like "Find out if the butler was angry" have no action verb in infinitive form. The prompt explicitly prohibits these to ensure the structured input always produces valid sentences.

5. **Retry rounds don't increment `currentRound`**: The Spanish fallback penalizes HP and forces reconstruction, but doesn't consume one of the 5 investigation rounds. Capped at 1 retry attempt to prevent infinite loops.

6. **`completeDeduction` as store action**: XP bonus for correct deduction goes through a named action, not direct `setState`, maintaining the single-authority pattern for all game state mutations.

## Verification Checklist

- [x] Build compiles without errors (`npm run build` passes)
- [x] All 3 guided API routes registered in build output
- [x] Free mode (Romance, Adventure, Mystery+Medium/Hard) unaffected — mode selector only shows for Mystery+Easy
- [x] Type safety: all `keyof`, literal unions, and type annotations in place
- [ ] End-to-end playtest: Mystery → Easy → Guiado → Questions → 5 rounds → deduction
- [ ] Spanish fallback flow: write in Spanish → HP deduction → retry round → reconstruction
- [ ] Mobile layout: structured input wraps smoothly on small screens
- [ ] Gameover triggers: HP reaches 0 during evaluation or fallback penalty
