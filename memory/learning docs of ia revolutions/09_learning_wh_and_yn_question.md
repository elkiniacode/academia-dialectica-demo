# 09 — Lessons Learned: WH & Yes/No Structured Question Engine (English Academy)

## 1. Schemas Are the API Contract, Not Types

When using `streamObject` with Zod schemas, the schema shape is what the AI actually returns. TypeScript interfaces are what the app consumes. These two can diverge (flat schema vs nested type). The `onFinish` handler is the mapping layer.

**Rule:** Every `onFinish` must explicitly map flat schema output to nested app types with a type annotation. Never assume schema structure matches your interface.

```typescript
// The schema returns flat fields, but the store expects nested GuidedEvaluation
const evaluation: GuidedEvaluation = {
  partFeedback: object.partFeedback,
  overallCorrect: object.overallCorrect,
  xpGained: object.xpGained,
  summary: object.summary,
};
```

## 2. Lock Down AI-Generated Discrete Values

`z.number()` lets GPT hallucinate `37` for an HP penalty. Literal unions with `.catch()` fallback force valid slots.

**Rule:** Any field where the AI picks from a finite set must be `z.union([z.literal(0), z.literal(10), z.literal(25), z.literal(50)]).catch(25)`, never a loose `z.number()`.

## 3. Evidence-First Schema Ordering

Putting `reached: boolean` before `evidence: string` lets the AI decide first and rationalize after. Flipping the order forces honest evaluation.

**Rule:** Fields requiring judgment must follow fields requiring observation. Schema field order is a prompt engineering lever.

## 4. Use `keyof` to Close Data-to-UI Mapping

If AI feedback references a part of a structured input, `part: string` allows typos that silently break the UI. `part: keyof StructuredQuestionParts` makes the compiler enforce it.

**Rule:** When an AI-generated field maps to a UI element key, use `keyof` or `z.enum()` — never `string`.

## 5. Separate Setup Data from Response Data

Mixing "what the player needs before acting" and "what the AI returns after acting" in one type creates confusion about when fields are populated.

**Rule:** Setup types (fully available at render time) and response types (arrive after API call) must be separate interfaces. If a field is `null` until the API responds, it belongs in the response type.

## 6. Ref Guard Before Side Effect

Setting `ref.current = true` after `store.setPhase("loading")` causes infinite loops — React re-renders before the ref is set, the effect re-fires.

**Rule:** The guard ref goes to `true` BEFORE any state change that could trigger re-render. Always.

```typescript
// Correct order
guardRef.current = true;      // 1. Lock
store.setPhase("loading");    // 2. State change (triggers re-render)
submitStart({ ... });         // 3. Side effect
```

## 7. Multi-Round Ref Locks Need Reset

A `processedRef` set to `true` in `onFinish` but never reset locks out every subsequent round. One-shot refs stay locked. Multi-shot refs reset in the trigger function.

**Rule:** Reset `processedRef.current = false` in the user's submit handler, not in hook setup or cleanup. The user clicking "Submit" is the unlock signal.

## 8. Don't Break Out of the Store Action Pattern

`useGameStore.setState({ xp: state.xp + bonus })` works but bypasses analytics, compound transitions, and auditability.

**Rule:** Every state mutation gets a named store action. Components never call `setState` directly.

## 9. Derive Terminal Conditions from Structure

`isGameOver: true` from the AI might be hallucinated. `!object.nextRound || !object.nextRound.currentSuspect` is structurally reliable.

**Rule:** Derive game-ending conditions from data absence (no next round = game over), not from AI-generated booleans. Guard against empty objects too.

## 10. Ban Impossible Structures in the Prompt

The 5-part UI requires `auxiliary + bare infinitive`. If the AI generates "Find out if the butler was angry," there's no action verb — the UI breaks. The schema can't prevent this.

**Rule:** When a UI imposes structural constraints on AI output, those constraints must appear as explicit prohibitions in the prompt with examples of what NOT to generate. Schema validation is necessary but not sufficient.

## 11. Instruction Values Must Match Schema Literals

"Max 10 HP loss" when the schema allows `0|10|25|50` might produce `5`. The AI interprets ranges differently than enums.

**Rule:** Prompt instructions must use the exact same phrasing as schema constraints: "hpLoss MUST be exactly 0 or 10", never "max 10".

## 12. Restrict Options to Structurally Compatible Values

`YESNO_AUXILIARIES` originally included Was/Were/Is/Are/Has/Have. These produce broken sentences ("Was the butler go?") because they don't take bare infinitives.

**Rule:** Dropdown/selection options are grammar constraints, not just UI choices. Every option must produce a valid sentence in the output structure.

## 13. Disable Browser Assistance on Learning Inputs

Autocomplete and spellcheck bypass the learning process. If the browser corrects "gardener," the student didn't learn to spell it.

**Rule:** All free-text fields in educational input components must have `autoComplete="off"` and `spellCheck={false}`.

## 14. Auto-Focus Frustration Paths

When a student clicks "Write in Spanish," they're already struggling. An extra click into the textarea is unnecessary friction.

**Rule:** Any fallback/escape-hatch UI should `autoFocus` on its primary input.

## 15. Keyboard Shortcuts for Multi-Line Inputs

Textareas swallow Enter for newlines. Students need Ctrl/Cmd+Enter for submission.

**Rule:** Every textarea must support `(metaKey || ctrlKey) + Enter` for submission.

## 16. Reserve Space for Indicators — Toggle Opacity, Not Existence

Conditional rendering of indicators causes layout jitter. Render always, toggle visibility.

**Rule:** `opacity-0` / `opacity-100` for presence changes, never `{condition && <Icon />}`.

## 17. Per-Element Opacity for Disabled States

Container-level `opacity-40` dims badges and labels that should stay prominent.

**Rule:** Apply opacity to individual child elements (icon, title, description), not the parent container. Exempted elements (badges, status indicators) keep full opacity.

## 18. Visual Feedback During Delays is Mandatory

Any delay over 500ms with no visual cue looks like a frozen app.

**Rule:** Replace button text with spinner + "Procesando..." during async waits. Build suspense, don't create anxiety.

## 19. Stagger Reveals for Dramatic Moments

Showing verdict and motive simultaneously robs the moment. Reveal the "who" first, the "why" second.

**Rule:** For multi-part reveals, use `transition={{ delay: 1 }}` between stages. First the impact, then the explanation.

## 20. Cross-Reference Linking Between Lists

Listing clues and suspects separately forces the student to hold connections in memory. Hover-highlighting links them.

**Rule:** When two lists are semantically connected (e.g., evidence → person), hovering an item in one should visually highlight the related item in the other.

## 21. No Dynamic Tailwind Class Construction

`bg-${accent}-500` won't be in the compiled CSS. Tailwind's compiler does static analysis.

**Rule:** Always use mapping objects with complete class strings. Never template-literal class names.

```typescript
// Correct
const colors = { wh: "bg-cyan-500", yesno: "bg-purple-500" };
```

## 22. GPU-Accelerated Animations

Framer Motion's `x`/`y` props can trigger layout recalculations. `translate` stays on the GPU compositor thread.

**Rule:** Use `translate: "0 0"` + `willChange: "transform, opacity"` instead of `x`/`y` for animation performance.

## 23. Feature Gates on Business Rules, Not Phase Names

`phase === "mode-selecting"` can get stale. `genre === "Mystery" && difficulty === "easy"` is the actual invariant.

**Rule:** Gate features on concrete conditions (business rules), not internal state names. Phase is implementation; the rule is the requirement.

## 24. Filter System Messages Before API Calls

Internal `{ role: "system" }` messages can leak into chat history.

**Rule:** Always `history.filter(msg => msg.role !== "system")` before serializing to any AI API call.

## 25. Fire-and-Forget Still Needs Catch

Database operations that don't block the UI can silently reject without `.catch()`.

**Rule:** Every `.then()` on a fire-and-forget promise must have a `.catch()`. Unhandled rejections are bugs.

## 26. HP-Zero Must Trigger Gameover Everywhere

Every action that reduces HP must check `newHp === 0` and transition to gameover.

**Rule:** After `Math.max(0, state.hp - penalty)`, always set `phase: newHp === 0 ? "gameover" : state.phase`. This applies to EVERY HP-modifying action — evaluation, fallback penalty, translation cost.
