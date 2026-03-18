"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { closestNeighbors, NeighborResult } from "@/lib/closest-neighbors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NeuronSprite {
  canvas: HTMLCanvasElement;
  size: number;
}

interface Neuron {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  drawSize: number;
  spriteIdx: number;
  rotation: number;
  phaseX: number;
  phaseY: number;
  freqX: number;
  freqY: number;
  groupVx: number;
  groupVy: number;
  // Depth layer: 1.0 = foreground, 0.5–0.8 = background (blurred/faded)
  depth: number;
}

interface Spark {
  fromId: number;
  toId: number;
  progress: number;
  speed: number;
  warm: boolean;
}

interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPRITE_VARIANTS = 12;
const CONNECTION_DIST = 200;
const MAX_CONNECTIONS_PER_NEURON = 3;
const SPARK_CHANCE_PER_SEC = 2.0;
const TARGET_DT = 1 / 60;

// Spring-force equilibrium model — produces stable cellular matrix
const EQUILIBRIUM_FACTOR = 0.85;      // multiplier on sqrt(area/count) for ideal spacing
const INTERACTION_RADIUS_MULT = 2.2;  // interact up to 2.2× the ideal distance
const SPRING_STRENGTH = 0.004;        // force multiplier for attraction/repulsion spring
const REPULSION_DIST = 60;            // hard minimum — strong push below this
const REPULSION_STRENGTH = 0.15;      // hard repulsion force
const DAMPING = 0.97;                 // per-frame velocity damping (friction)
const MAX_GROUP_SPEED = 1.5;          // cap on force-driven velocity

// Mouse repulsion (score-gated, game only)
const MOUSE_REPULSION_RADIUS = 150;
const MOUSE_REPULSION_MIN_SCORE = 2;

// Difficulty presets: base repulsion + per-score multiplier
const DIFFICULTY_PRESETS = {
  easy:   { base: 0.015, mult: 0.007 },
  medium: { base: 0.030, mult: 0.015 },
  hard:   { base: 0.050, mult: 0.025 },
} as const;

// Color palettes for neuron variety
interface ColorPalette {
  dendrite: string;   // rgb base for dendrites
  knob: string;       // rgb for synaptic knobs
  glow: string;       // rgb for soma glow
  soma: string;       // rgb for soma body
  nucleus: string;    // rgb for nucleus
}

const PALETTES: ColorPalette[] = [
  // Cyan (default)
  { dendrite: "100,190,240", knob: "160,220,255", glow: "150,210,255", soma: "160,210,250", nucleus: "200,230,255" },
  // Purple / violet
  { dendrite: "160,120,240", knob: "200,170,255", glow: "180,140,255", soma: "190,160,250", nucleus: "220,200,255" },
  // Warm teal
  { dendrite: "80,210,190", knob: "140,235,210", glow: "120,225,200", soma: "140,220,200", nucleus: "200,245,235" },
  // Cool blue
  { dendrite: "70,140,220", knob: "130,180,255", glow: "100,160,240", soma: "130,170,240", nucleus: "190,210,255" },
  // Warm rose
  { dendrite: "220,130,170", knob: "240,170,200", glow: "230,150,180", soma: "235,165,190", nucleus: "250,210,230" },
];

// ---------------------------------------------------------------------------
// Procedural neuron sprite generation
// ---------------------------------------------------------------------------

function generateDendrites() {
  const count = 5 + Math.floor(Math.random() * 6);
  const dendrites: {
    angle: number;
    length: number;
    curve: number;
    branches: { t: number; angle: number; length: number; curve: number }[];
  }[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const length = 0.25 + Math.random() * 0.35;
    const curve = (Math.random() - 0.5) * 0.4;
    const branchCount = Math.floor(Math.random() * 3);
    const branches: { t: number; angle: number; length: number; curve: number }[] = [];

    for (let b = 0; b < branchCount; b++) {
      branches.push({
        t: 0.3 + Math.random() * 0.5,
        angle: angle + (Math.random() - 0.5) * 1.2,
        length: length * (0.3 + Math.random() * 0.4),
        curve: (Math.random() - 0.5) * 0.3,
      });
    }
    dendrites.push({ angle, length, curve, branches });
  }
  return dendrites;
}

function renderNeuronSprite(size: number, palette: ColorPalette): NeuronSprite {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const sCtx = c.getContext("2d");
  if (!sCtx) return { canvas: c, size };

  const cx = size / 2;
  const cy = size / 2;
  const dendrites = generateDendrites();

  for (const d of dendrites) {
    const endX = cx + Math.cos(d.angle) * d.length * size;
    const endY = cy + Math.sin(d.angle) * d.length * size;
    const cpX = (cx + endX) / 2 + Math.cos(d.angle + Math.PI / 2) * d.curve * size;
    const cpY = (cy + endY) / 2 + Math.sin(d.angle + Math.PI / 2) * d.curve * size;

    const thickness = 1.0 + Math.random() * 0.8;
    sCtx.beginPath();
    sCtx.moveTo(cx, cy);
    sCtx.quadraticCurveTo(cpX, cpY, endX, endY);
    sCtx.strokeStyle = `rgba(${palette.dendrite},${0.25 + Math.random() * 0.15})`;
    sCtx.lineWidth = thickness;
    sCtx.lineCap = "round";
    sCtx.stroke();

    // Wispy tip
    const tipAngle = d.angle + (Math.random() - 0.5) * 0.5;
    const tipLen = d.length * size * (0.15 + Math.random() * 0.2);
    sCtx.beginPath();
    sCtx.moveTo(endX, endY);
    sCtx.lineTo(endX + Math.cos(tipAngle) * tipLen, endY + Math.sin(tipAngle) * tipLen);
    sCtx.strokeStyle = `rgba(${palette.dendrite},${0.12 + Math.random() * 0.1})`;
    sCtx.lineWidth = 0.5;
    sCtx.stroke();

    // Synaptic knob
    sCtx.beginPath();
    sCtx.arc(endX, endY, 1.2 + Math.random() * 0.8, 0, Math.PI * 2);
    sCtx.fillStyle = `rgba(${palette.knob},${0.3 + Math.random() * 0.2})`;
    sCtx.fill();

    // Sub-branches
    for (const br of d.branches) {
      const u = 1 - br.t;
      const bSx = u * u * cx + 2 * u * br.t * cpX + br.t * br.t * endX;
      const bSy = u * u * cy + 2 * u * br.t * cpY + br.t * br.t * endY;
      const bEx = bSx + Math.cos(br.angle) * br.length * size;
      const bEy = bSy + Math.sin(br.angle) * br.length * size;
      const bCx = (bSx + bEx) / 2 + Math.cos(br.angle + Math.PI / 2) * br.curve * size;
      const bCy = (bSy + bEy) / 2 + Math.sin(br.angle + Math.PI / 2) * br.curve * size;

      sCtx.beginPath();
      sCtx.moveTo(bSx, bSy);
      sCtx.quadraticCurveTo(bCx, bCy, bEx, bEy);
      sCtx.strokeStyle = `rgba(${palette.dendrite},${0.18 + Math.random() * 0.1})`;
      sCtx.lineWidth = thickness * 0.6;
      sCtx.lineCap = "round";
      sCtx.stroke();

      sCtx.beginPath();
      sCtx.arc(bEx, bEy, 0.8 + Math.random() * 0.5, 0, Math.PI * 2);
      sCtx.fillStyle = `rgba(${palette.knob},${0.25 + Math.random() * 0.15})`;
      sCtx.fill();
    }
  }

  // Soma glow
  const somaR = size * (0.06 + Math.random() * 0.03);
  const outerGlow = sCtx.createRadialGradient(cx, cy, 0, cx, cy, somaR * 3.5);
  outerGlow.addColorStop(0, `rgba(${palette.glow},0.35)`);
  outerGlow.addColorStop(0.5, `rgba(${palette.glow},0.12)`);
  outerGlow.addColorStop(1, `rgba(${palette.glow},0)`);
  sCtx.beginPath();
  sCtx.arc(cx, cy, somaR * 3.5, 0, Math.PI * 2);
  sCtx.fillStyle = outerGlow;
  sCtx.fill();

  // Soma body
  const somaGrad = sCtx.createRadialGradient(cx, cy, 0, cx, cy, somaR);
  somaGrad.addColorStop(0, `rgba(${palette.soma},0.9)`);
  somaGrad.addColorStop(0.5, `rgba(${palette.soma},0.55)`);
  somaGrad.addColorStop(1, `rgba(${palette.soma},0.15)`);
  sCtx.beginPath();
  sCtx.arc(cx, cy, somaR, 0, Math.PI * 2);
  sCtx.fillStyle = somaGrad;
  sCtx.fill();

  // Nucleus
  const nucGrad = sCtx.createRadialGradient(cx, cy, 0, cx, cy, somaR * 0.45);
  nucGrad.addColorStop(0, "rgba(255,255,255,0.95)");
  nucGrad.addColorStop(1, `rgba(${palette.nucleus},0.3)`);
  sCtx.beginPath();
  sCtx.arc(cx, cy, somaR * 0.45, 0, Math.PI * 2);
  sCtx.fillStyle = nucGrad;
  sCtx.fill();

  return { canvas: c, size };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bezierControl(
  ax: number, ay: number, bx: number, by: number
): [number, number] {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const off = len * 0.2;
  return [mx + (-dy / len) * off, my + (dx / len) * off];
}

function bezierPoint(
  ax: number, ay: number, cx: number, cy: number,
  bx: number, by: number, t: number
): [number, number] {
  const u = 1 - t;
  return [
    u * u * ax + 2 * u * t * cx + t * t * bx,
    u * u * ay + 2 * u * t * cy + t * t * by,
  ];
}

// Pre-computed squared distance for zero-allocation neighbor lookups
const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST;

// Sin/cos lookup table (360 entries) — used on mobile only for perf
const SIN_LUT = new Float64Array(360);
const COS_LUT = new Float64Array(360);
for (let i = 0; i < 360; i++) {
  SIN_LUT[i] = Math.sin((i * Math.PI) / 180);
  COS_LUT[i] = Math.cos((i * Math.PI) / 180);
}
function fastSin(rad: number): number {
  const deg = ((rad * 180 / Math.PI) % 360 + 360) % 360;
  return SIN_LUT[deg | 0];
}
function fastCos(rad: number): number {
  const deg = ((rad * 180 / Math.PI) % 360 + 360) % 360;
  return COS_LUT[deg | 0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Difficulty = "easy" | "medium" | "hard";

interface NeuronCanvasProps {
  gameActive?: boolean;
  targetPaletteIdx?: number | null;
  score?: number;
  difficulty?: Difficulty;
  onNeuronClicked?: (correct: boolean, remaining: number) => void;
  onGameComplete?: () => void;
}

export const NeuronCanvas = React.memo(function NeuronCanvas({
  gameActive = false,
  targetPaletteIdx = null,
  score = 0,
  difficulty = "medium",
  onNeuronClicked,
  onGameComplete,
}: NeuronCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ref bridges: sync React props into imperative closure
  const gameActiveRef = useRef(gameActive);
  const targetPaletteIdxRef = useRef(targetPaletteIdx);
  const scoreRef = useRef(score);
  const difficultyRef = useRef(difficulty);
  const onNeuronClickedRef = useRef(onNeuronClicked);
  const onGameCompleteRef = useRef(onGameComplete);

  // useLayoutEffect fires synchronously before paint — no 1-frame delay
  // Parent must wrap callbacks in useCallback to avoid unnecessary re-fires
  useLayoutEffect(() => {
    gameActiveRef.current = gameActive;
    targetPaletteIdxRef.current = targetPaletteIdx;
    scoreRef.current = score;
    difficultyRef.current = difficulty;
    onNeuronClickedRef.current = onNeuronClicked;
    onGameCompleteRef.current = onGameComplete;
  }, [gameActive, targetPaletteIdx, score, difficulty, onNeuronClicked, onGameComplete]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctxEl = canvasEl.getContext("2d", { desynchronized: true });
    if (!ctxEl) return;
    const parentEl = canvasEl.parentElement;
    if (!parentEl) return;

    // Non-null aliases for use inside nested closures (guards above ensure safety)
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctxEl;
    const parent: HTMLElement = parentEl;

    let animId: number;
    let neurons: Neuron[] = [];
    let sparks: Spark[] = [];
    let walls: Wall[] = [];
    let lastTime = 0;
    let animTime = 0;  // Accumulated animation time (pauses when tab hidden)
    let mouseX = -9999;
    let mouseY = -9999;
    let mouseInside = false;
    let wrongClickFlash = { x: 0, y: 0, time: 0 };

    // Mobile detection — gates perf optimizations without affecting desktop
    const isMobile = parent.clientWidth < 768;

    // Pre-allocated buffers for zero-allocation neighbor lookups (max 200 neurons)
    const neighborBuffers: NeighborResult[][] = Array.from({ length: 200 }, () => []);
    // Per-frame neighbor cache — valid count per neuron, computed once in update(), reused in draw()
    let neighborCache: number[] = [];

    // Pre-allocated draw structures (reused each frame, never re-created)
    const neuronMap = new Map<number, Neuron>();
    const drawnEdges = new Set<number>();
    const connectionPairs: { i: number; j: number; dist: number }[] = [];

    // Fixed-step physics accumulator (mobile only)
    let physicsAccumulator = 0;
    const PHYSICS_STEP = 1 / 60;

    // IntersectionObserver state
    let isVisible = true;

    // Generate unique sprite variants with different color palettes
    const sprites: NeuronSprite[] = [];
    for (let i = 0; i < SPRITE_VARIANTS; i++) {
      sprites.push(renderNeuronSprite(160, PALETTES[i % PALETTES.length]));
    }

    function resize() {
      const rawDpr = window.devicePixelRatio || 1;
      // Cap DPR to 2 on mobile — saves ~44% pixel ops on 3× DPR phones
      const dpr = isMobile ? Math.min(rawDpr, 2) : rawDpr;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createWalls(w: number, h: number): Wall[] {
      const centerX = w / 2;
      const centerY = h / 2;
      const vertW = 20;
      const isMobile = w < 768;
      const vertH = isMobile ? h * 0.35 : h * 0.45;
      const footW = isMobile ? 60 : 100;
      const footH = 20;
      const gapHalf = 30; // 60px gap between vertical bars

      // Left L: vertical bar + foot extending LEFT (outward)
      const leftVertX = centerX - gapHalf - vertW;
      const leftVertY = centerY - vertH / 2;
      const leftFootX = leftVertX - footW + vertW; // extends left from vertical
      const leftFootY = leftVertY + vertH - footH;

      // Right L: vertical bar + foot extending RIGHT (outward)
      const rightVertX = centerX + gapHalf;
      const rightVertY = centerY - vertH / 2;
      const rightFootX = rightVertX; // extends right from vertical
      const rightFootY = rightVertY + vertH - footH;

      return [
        // Left L
        { x: leftVertX, y: leftVertY, width: vertW, height: vertH },
        { x: leftFootX, y: leftFootY, width: footW, height: footH },
        // Right L
        { x: rightVertX, y: rightVertY, width: vertW, height: vertH },
        { x: rightFootX, y: rightFootY, width: footW, height: footH },
      ];
    }

    function initNeurons() {
      const w = parent.clientWidth;
      const h = parent.clientHeight;

      // Game mode: target neurons + decoys; ambient mode: responsive count
      const isGame = gameActiveRef.current;
      const targetIdx = targetPaletteIdxRef.current;

      // In game mode, 5–10 target neurons + 2 decoys
      const targetCount = isGame ? 5 + Math.floor(Math.random() * 6) : 0;
      const decoyCount = 2;

      let count: number;
      if (isGame) {
        count = targetCount + decoyCount;
      } else {
        count = 120;
        if (w < 768) count = 15;
        else if (w < 1024) count = 40;
      }

      neurons = [];
      for (let i = 0; i < count; i++) {
        // ~30% of neurons are in the background layer
        const isBg = Math.random() < 0.3;
        const depth = isBg ? 0.5 + Math.random() * 0.3 : 1.0;

        // First `targetCount` neurons get forced to the target palette
        let spriteIdx: number;
        if (isGame && targetIdx !== null && i < targetCount) {
          const base = targetIdx;
          const mult = Math.floor(Math.random() * Math.floor(SPRITE_VARIANTS / PALETTES.length));
          spriteIdx = base + mult * PALETTES.length;
        } else {
          spriteIdx = Math.floor(Math.random() * SPRITE_VARIANTS);
        }

        neurons.push({
          id: i,
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35 * depth,
          vy: (Math.random() - 0.5) * 0.35 * depth,
          drawSize: (25 + Math.random() * 75) * depth, // 25-100px range
          spriteIdx,
          rotation: Math.random() * Math.PI * 2,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          freqX: (0.006 + Math.random() * 0.01) * depth,
          freqY: (0.006 + Math.random() * 0.01) * depth,
          groupVx: 0,
          groupVy: 0,
          depth,
        });
      }

      // Sort by depth once (depth never changes) — avoids re-sorting every frame
      neurons.sort((a, b) => a.depth - b.depth);

      // Create walls only during game
      walls = isGame ? createWalls(w, h) : [];
    }

    function removeNeuron(idx: number) {
      const removedId = neurons[idx].id;
      neurons.splice(idx, 1);
      // Immediately purge sparks referencing the removed neuron
      sparks = sparks.filter(s => s.fromId !== removedId && s.toId !== removedId);
      // Velocity kick — remaining neurons scatter, making the hunt harder
      for (const n of neurons) {
        n.vx += (Math.random() - 0.5) * 0.5;
        n.vy += (Math.random() - 0.5) * 0.5;
      }
    }

    // Core physics step — extracted so mobile can use fixed-step accumulator
    function stepPhysics(dt: number) {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const timeScale = dt / TARGET_DT;

      // Dynamic ideal spacing based on canvas area and neuron count
      const idealDist = Math.sqrt((w * h) / neurons.length) * EQUILIBRIUM_FACTOR;
      const interactionRadius = idealDist * INTERACTION_RADIUS_MULT;
      const interactionRadiusSq = interactionRadius * interactionRadius;
      const repulsionDistSq = REPULSION_DIST * REPULSION_DIST;

      // Spring-force equilibrium: each pair attracts/repels toward ideal distance
      for (let i = 0; i < neurons.length; i++) {
        let fx = 0, fy = 0;

        for (let j = 0; j < neurons.length; j++) {
          if (i === j) continue;
          const dx = neurons[j].x - neurons[i].x;
          const dy = neurons[j].y - neurons[i].y;
          const distSq = dx * dx + dy * dy;

          // Skip pairs outside interaction range (avoid sqrt)
          if (distSq > interactionRadiusSq || distSq === 0) continue;

          const dist = Math.sqrt(distSq) || 0.001; // epsilon guard

          // Spring force: pulls toward idealDist equilibrium
          const displacement = dist - idealDist;
          const normalizedForce = displacement / idealDist;
          const falloff = 1 - (dist / interactionRadius);
          const springForce = normalizedForce * SPRING_STRENGTH * falloff;

          fx += (dx / dist) * springForce;
          fy += (dy / dist) * springForce;

          // Hard short-range repulsion for overlap prevention
          if (distSq < repulsionDistSq) {
            const push = Math.pow((REPULSION_DIST - dist) / REPULSION_DIST, 2) * REPULSION_STRENGTH;
            fx -= (dx / dist) * push;
            fy -= (dy / dist) * push;
          }
        }

        // Cap group force speed
        const groupSpeed = Math.sqrt(fx * fx + fy * fy);
        if (groupSpeed > MAX_GROUP_SPEED) {
          fx = (fx / groupSpeed) * MAX_GROUP_SPEED;
          fy = (fy / groupSpeed) * MAX_GROUP_SPEED;
        }

        neurons[i].groupVx = fx;
        neurons[i].groupVy = fy;
      }

      // Mouse repulsion — activates after first 2 captures, scales with score + difficulty
      const currentScore = scoreRef.current;
      const diff = difficultyRef.current;
      const preset = DIFFICULTY_PRESETS[diff];
      const applyMouseRepulsion = gameActiveRef.current && mouseInside && currentScore >= MOUSE_REPULSION_MIN_SCORE;

      // Use LUT on mobile, native Math on desktop
      const sinFn = isMobile ? fastSin : Math.sin;
      const cosFn = isMobile ? fastCos : Math.cos;

      for (const n of neurons) {
        // Mouse repulsion force (applied before damping so it gets properly damped)
        if (applyMouseRepulsion) {
          const mdx = n.x - mouseX;
          const mdy = n.y - mouseY;
          const mDistSq = mdx * mdx + mdy * mdy;
          const mRadiusSq = MOUSE_REPULSION_RADIUS * MOUSE_REPULSION_RADIUS;
          if (mDistSq < mRadiusSq && mDistSq > 0) {
            const mDist = Math.sqrt(mDistSq);
            const falloff = 1 - mDist / MOUSE_REPULSION_RADIUS;
            const strength = (preset.base + currentScore * preset.mult) * falloff * falloff;
            n.vx += (mdx / mDist) * strength * timeScale;
            n.vy += (mdy / mDist) * strength * timeScale;
          }
        }

        // Multiplicative damping AFTER all forces (frame-rate independent)
        n.vx *= Math.pow(DAMPING, timeScale);
        n.vy *= Math.pow(DAMPING, timeScale);

        // Hard velocity cap — prevents runaway speeds
        const maxVel = 1.8;
        const vel = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (vel > maxVel) {
          n.vx = (n.vx / vel) * maxVel;
          n.vy = (n.vy / vel) * maxVel;
        }

        n.phaseX += n.freqX * timeScale;
        n.phaseY += n.freqY * timeScale;

        // Reduced wobble amplitude (0.15 instead of 0.3) for stable lattice
        const totalVx = n.vx + n.groupVx + sinFn(n.phaseX) * 0.15;
        const totalVy = n.vy + n.groupVy + cosFn(n.phaseY) * 0.15;

        n.x += totalVx * timeScale;
        n.y += totalVy * timeScale;

        // Rotate toward velocity direction
        const speed = Math.sqrt(totalVx * totalVx + totalVy * totalVy);
        if (speed > 0.05) {
          const targetRot = Math.atan2(totalVy, totalVx);
          let diff = targetRot - n.rotation;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          n.rotation += diff * 0.02 * timeScale;
        }

        // Hard screen boundary bounce (0.8 restitution)
        const bRadius = n.drawSize / 2;
        if (n.x - bRadius < 0) { n.x = bRadius; n.vx = Math.abs(n.vx) * 0.8; }
        if (n.x + bRadius > w) { n.x = w - bRadius; n.vx = -Math.abs(n.vx) * 0.8; }
        if (n.y - bRadius < 0) { n.y = bRadius; n.vy = Math.abs(n.vy) * 0.8; }
        if (n.y + bRadius > h) { n.y = h - bRadius; n.vy = -Math.abs(n.vy) * 0.8; }

        // Wall collision — circle vs AABB with proper vector reflection
        const radius = n.drawSize / 2;
        for (const wall of walls) {
          const closestX = Math.max(wall.x, Math.min(n.x, wall.x + wall.width));
          const closestY = Math.max(wall.y, Math.min(n.y, wall.y + wall.height));
          const cdx = n.x - closestX;
          const cdy = n.y - closestY;
          const cDistSq = cdx * cdx + cdy * cdy;

          if (cDistSq < radius * radius && cDistSq > 0) {
            const cDist = Math.sqrt(cDistSq);
            const overlap = radius - cDist;
            n.x += (cdx / cDist) * overlap;
            n.y += (cdy / cDist) * overlap;

            const nx = cdx / cDist;
            const ny = cdy / cDist;
            const dotV = n.vx * nx + n.vy * ny;
            const dotG = n.groupVx * nx + n.groupVy * ny;
            n.vx = (n.vx - 2 * dotV * nx) * 0.7;
            n.vy = (n.vy - 2 * dotV * ny) * 0.7;
            n.groupVx = (n.groupVx - 2 * dotG * nx) * 0.5;
            n.groupVy = (n.groupVy - 2 * dotG * ny) * 0.5;
          }
        }
      }
    }

    function update(dtSec: number) {
      // Decay wrong-click flash timer
      if (wrongClickFlash.time > 0) {
        wrongClickFlash.time = Math.max(0, wrongClickFlash.time - dtSec);
      }

      // Fixed-step physics on mobile (cap at 60fps), variable on desktop
      if (isMobile) {
        physicsAccumulator += dtSec;
        while (physicsAccumulator >= PHYSICS_STEP) {
          stepPhysics(PHYSICS_STEP);
          physicsAccumulator -= PHYSICS_STEP;
        }
      } else {
        stepPhysics(dtSec);
      }

      // Rebuild neighbor cache ONCE per frame — reused for sparks here and connections in draw()
      for (let i = 0; i < neurons.length; i++) {
        neighborCache[i] = closestNeighbors(
          neurons, i, CONNECTION_DIST_SQ, MAX_CONNECTIONS_PER_NEURON, neighborBuffers[i]
        );
      }

      // Spawn sparks on connected pairs (using cached neighbors)
      const sparkChance = 1 - Math.pow(1 - SPARK_CHANCE_PER_SEC, dtSec);
      for (let i = 0; i < neurons.length; i++) {
        const count = neighborCache[i];
        const buffer = neighborBuffers[i];
        for (let k = 0; k < count; k++) {
          const j = buffer[k].j;
          if (j > i && Math.random() < sparkChance) {
            sparks.push({
              fromId: Math.random() > 0.5 ? neurons[i].id : neurons[j].id,
              toId: Math.random() > 0.5 ? neurons[j].id : neurons[i].id,
              progress: 0,
              speed: 1.5 + Math.random() * 2.5,
              warm: Math.random() < 0.4,
            });
          }
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].progress += sparks[i].speed * dtSec;
        if (sparks[i].progress >= 1) sparks.splice(i, 1);
      }
    }

    function draw(animTime: number) {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const isGameActive = gameActiveRef.current;
      const targetIdx = targetPaletteIdxRef.current;

      // Rebuild neuron lookup map (reuse pre-allocated Map — zero allocation)
      neuronMap.clear();
      for (const n of neurons) {
        neuronMap.set(n.id, n);
      }

      // Build connection set from cached neighbors (true object pool — zero allocation)
      drawnEdges.clear();
      let activeConnections = 0;

      for (let i = 0; i < neurons.length; i++) {
        const count = neighborCache[i];
        const buffer = neighborBuffers[i];
        for (let k = 0; k < count; k++) {
          const j = buffer[k].j;
          const dist = buffer[k].dist;
          // Numeric edge key: no string allocation (max 999 neurons)
          const edgeKey = Math.min(i, j) * 1000 + Math.max(i, j);
          if (!drawnEdges.has(edgeKey)) {
            drawnEdges.add(edgeKey);
            if (activeConnections >= connectionPairs.length) {
              // Pool exhausted — allocate once, reused forever after
              connectionPairs.push({ i, j, dist });
            } else {
              const slot = connectionPairs[activeConnections];
              slot.i = i; slot.j = j; slot.dist = dist;
            }
            activeConnections++;
          }
        }
      }

      // 1. Draw connections — double-stroke: thick palette glow + thin white core
      ctx.globalAlpha = 1;
      for (let p = 0; p < activeConnections; p++) {
        const { i, j, dist } = connectionPairs[p];
        const a = neurons[i];
        const b = neurons[j];
        const minDepth = Math.min(a.depth, b.depth);
        const alpha = (1 - dist / CONNECTION_DIST) * 0.28 * minDepth;
        const [cpx, cpy] = bezierControl(a.x, a.y, b.x, b.y);

        const paletteIdx = a.spriteIdx % PALETTES.length;
        const palette = PALETTES[paletteIdx];

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cpx, cpy, b.x, b.y);
        ctx.lineCap = "round";

        // Layer 1: bold margin in neuron's palette color
        ctx.strokeStyle = `rgba(${palette.glow}, ${alpha * 0.8})`;
        ctx.lineWidth = 3.5 * minDepth;
        ctx.stroke();

        // Layer 2: bright white core for high contrast
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 1.0 * minDepth;
        ctx.stroke();
      }

      // Mouse ghost connections — double-stroke with cyan theme
      if (mouseInside) {
        const mouseNeighbors: { idx: number; dist: number }[] = [];
        for (let i = 0; i < neurons.length; i++) {
          const dx = mouseX - neurons[i].x;
          const dy = mouseY - neurons[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            mouseNeighbors.push({ idx: i, dist });
          }
        }
        mouseNeighbors.sort((a, b) => a.dist - b.dist);
        for (const { idx, dist } of mouseNeighbors.slice(0, MAX_CONNECTIONS_PER_NEURON)) {
          const n = neurons[idx];
          const alpha = (1 - dist / CONNECTION_DIST) * 0.55;
          const [cpx, cpy] = bezierControl(mouseX, mouseY, n.x, n.y);

          ctx.beginPath();
          ctx.moveTo(mouseX, mouseY);
          ctx.quadraticCurveTo(cpx, cpy, n.x, n.y);
          ctx.lineCap = "round";

          // Layer 1: bold glowing margin
          ctx.strokeStyle = `rgba(80, 180, 235, ${alpha * 0.6})`;
          ctx.lineWidth = 4.0;
          ctx.stroke();

          // Layer 2: bright white core
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // 1b. Draw walls (game only) — neon-glow rectangles
      if (isGameActive && walls.length > 0) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(0, 200, 255, 0.5)";
        for (const wall of walls) {
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = "rgba(0, 200, 255, 1)";
          ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = "rgba(0, 200, 255, 1)";
          ctx.lineWidth = 2;
          ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // 2. Draw neurons — already sorted by depth in initNeurons()
      for (const n of neurons) {
        const sprite = sprites[n.spriteIdx];
        const paletteIdx = n.spriteIdx % PALETTES.length;
        const palette = PALETTES[paletteIdx];
        const isTarget = isGameActive && targetIdx !== null && paletteIdx === targetIdx;
        const isNonTarget = isGameActive && targetIdx !== null && !isTarget;

        // Base alpha: depth-based, dimmed for non-targets during game
        let baseAlpha = n.depth < 1 ? n.depth * 0.6 : 1;
        if (isNonTarget) baseAlpha *= 0.4;

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rotation);

        // Outer glow in palette color
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${palette.glow}, ${baseAlpha * 0.7})`;

        ctx.globalAlpha = baseAlpha;
        ctx.drawImage(
          sprite.canvas,
          -n.drawSize / 2,
          -n.drawSize / 2,
          n.drawSize,
          n.drawSize
        );

        // High-contrast stroke ring so neurons pop against dark background
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, n.drawSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha * 0.45})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Subtle inner pulse based on wobble phase
        const pulse = (Math.sin(n.phaseX * 2) + 1) / 2;
        ctx.globalAlpha = baseAlpha * (0.05 + pulse * 0.1);
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(0, 0, n.drawSize / 2 * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Pulsing glow ring on target neurons (uses animTime, not Date.now)
        if (isTarget) {
          const targetPulse = 0.5 + 0.5 * Math.sin(animTime / 300);
          ctx.save();
          ctx.globalAlpha = 0.4 + targetPulse * 0.4;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.drawSize / 2 + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${palette.glow}, ${0.4 + targetPulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;

      // 3. Mouse ghost glow
      if (mouseInside) {
        const g = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 30);
        g.addColorStop(0, "rgba(180,225,255,0.3)");
        g.addColorStop(1, "rgba(180,225,255,0)");
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 30, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // 4. Sparks
      for (const s of sparks) {
        const a = neuronMap.get(s.fromId);
        const b = neuronMap.get(s.toId);
        if (!a || !b) continue;
        const [cpx, cpy] = bezierControl(a.x, a.y, b.x, b.y);
        const [sx, sy] = bezierPoint(a.x, a.y, cpx, cpy, b.x, b.y, s.progress);

        if (s.warm) {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14);
          g.addColorStop(0, "rgba(255,255,240,0.95)");
          g.addColorStop(0.2, "rgba(255,200,80,0.75)");
          g.addColorStop(0.5, "rgba(255,140,40,0.35)");
          g.addColorStop(1, "rgba(255,100,20,0)");
          ctx.beginPath();
          ctx.arc(sx, sy, 14, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        } else {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
          g.addColorStop(0, "rgba(255,255,255,0.95)");
          g.addColorStop(0.25, "rgba(140,220,255,0.7)");
          g.addColorStop(0.6, "rgba(60,170,255,0.25)");
          g.addColorStop(1, "rgba(40,130,255,0)");
          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = s.warm ? "rgba(255,240,200,1)" : "rgba(255,255,255,1)";
        ctx.fill();
      }

      // 5. Wrong-click flash (red ring that fades over 300ms)
      if (wrongClickFlash.time > 0) {
        const flashAlpha = wrongClickFlash.time / 0.3;
        const flashRadius = 20 + (1 - flashAlpha) * 15;
        ctx.save();
        ctx.globalAlpha = flashAlpha * 0.7;
        ctx.beginPath();
        ctx.arc(wrongClickFlash.x, wrongClickFlash.y, flashRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,80,80,1)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    function animate(time: number) {
      if (!isVisible) return; // Paused by IntersectionObserver
      if (lastTime === 0) lastTime = time;
      const dtMs = Math.min(time - lastTime, 50);
      lastTime = time;
      animTime += dtMs;
      update(dtMs / 1000);
      draw(animTime);
      animId = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (isVisible) return; // Already running
      isVisible = true;
      lastTime = 0; // Reset to avoid huge dt jump after pause
      animId = requestAnimationFrame(animate);
    }

    function stopAnimation() {
      isVisible = false;
      cancelAnimationFrame(animId);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      mouseInside = true;
    }
    function onMouseLeave() {
      mouseInside = false;
    }

    function onClick(e: MouseEvent) {
      if (!gameActiveRef.current || targetPaletteIdxRef.current === null) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Find closest neuron within forgiving hit radius
      let hitIdx = -1;
      let hitDist = Infinity;

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        const dx = clickX - n.x;
        const dy = clickY - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = (n.drawSize / 2) + 15; // forgiving +15px padding
        if (dist < hitRadius && dist < hitDist) {
          hitDist = dist;
          hitIdx = i;
        }
      }

      if (hitIdx !== -1) {
        const neuron = neurons[hitIdx];
        const neuronPaletteIdx = neuron.spriteIdx % PALETTES.length;
        const isCorrect = neuronPaletteIdx === targetPaletteIdxRef.current;

        if (isCorrect) {
          removeNeuron(hitIdx);
          const remaining = neurons.filter(
            n => (n.spriteIdx % PALETTES.length) === targetPaletteIdxRef.current
          ).length;
          onNeuronClickedRef.current?.(true, remaining);
          if (remaining === 0) {
            onGameCompleteRef.current?.();
          }
        } else {
          onNeuronClickedRef.current?.(false, -1);
          wrongClickFlash = { x: clickX, y: clickY, time: 0.3 };
        }
      } else {
        // Clicked empty space
        wrongClickFlash = { x: clickX, y: clickY, time: 0.3 };
      }
    }

    canvas.addEventListener("click", onClick);
    parent.addEventListener("mousemove", onMouseMove, { passive: true });
    parent.addEventListener("mouseleave", onMouseLeave, { passive: true });

    resize();
    initNeurons();
    animId = requestAnimationFrame(animate);

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(parent);

    // Pause animation when canvas scrolls off-screen (CPU → 0%, saves battery)
    const visibilityObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
        } else {
          stopAnimation();
        }
      },
      { threshold: 0.05 } // Trigger when 5% visible
    );
    visibilityObs.observe(parent);

    return () => {
      cancelAnimationFrame(animId);
      resizeObs.disconnect();
      visibilityObs.disconnect();
      canvas.removeEventListener("click", onClick);
      parent.removeEventListener("mousemove", onMouseMove);
      parent.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${gameActive ? "" : "pointer-events-none"}`}
      style={{ zIndex: 1 }}
    />
  );
});
