import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'start' | 'reveal' | 'playing' | 'dead';
type Difficulty = 'easy' | 'medium' | 'hard';

interface DiffConfig {
  baseGrav: number;
  jumpV: number;
  bouncePct: number;
  gravInc: number;
  numRange: [number, number];
  cols: number;
}

const DIFF: Record<Difficulty, DiffConfig> = {
  easy:   { baseGrav: 600, jumpV: -550, bouncePct: 0.85, gravInc: 1, numRange: [1, 20], cols: 3 },
  medium: { baseGrav: 750, jumpV: -550, bouncePct: 0.70, gravInc: 2, numRange: [1, 30], cols: 4 },
  hard:   { baseGrav: 900, jumpV: -550, bouncePct: 0.55, gravInc: 3, numRange: [1, 40], cols: 4 },
};

interface Rule {
  name: string;
  icon: string;
  example: string;
  test: (n: number) => boolean;
}

interface Block {
  x: number;
  y: number;   // world Y (top-left)
  w: number;
  h: number;
  value: number;
  isCorrect: boolean;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  r: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAYER_W = 24;
const PLAYER_H = 36;
const BLOCK_H = 28;
const BLOCK_PAD = 8;    // horizontal padding each side
const GAP = 6;          // gap between blocks in a row
const MAX_GRAV = 2000;
const MAX_FALL = 1200;
const HURT_CD = 1.5;    // seconds

const BLOCK_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function makeRule(diff: Difficulty): Rule {
  if (diff === 'easy') {
    const n = randInt(5, 15);
    const type = randInt(0, 3);
    if (type === 0) return { name: `Less than ${n}`, icon: `< ${n}`, example: `e.g. ${n - 3}, ${n - 2}, ${n - 1}`, test: x => x < n };
    if (type === 1) return { name: `At most ${n}`, icon: `≤ ${n}`, example: `e.g. ${n - 2}, ${n - 1}, ${n}`, test: x => x <= n };
    if (type === 2) return { name: `Greater than ${n}`, icon: `> ${n}`, example: `e.g. ${n + 1}, ${n + 3}, ${n + 5}`, test: x => x > n };
    return { name: `At least ${n}`, icon: `≥ ${n}`, example: `e.g. ${n}, ${n + 2}, ${n + 4}`, test: x => x >= n };
  }
  if (diff === 'medium') {
    const type = randInt(0, 4);
    if (type === 0) return { name: 'Even numbers', icon: 'Even', example: 'e.g. 2, 4, 6, 8', test: x => x % 2 === 0 };
    if (type === 1) return { name: 'Odd numbers', icon: 'Odd', example: 'e.g. 1, 3, 5, 7', test: x => x % 2 !== 0 };
    if (type === 2) return { name: 'Multiples of 2', icon: '×2', example: 'e.g. 2, 4, 6, 8', test: x => x % 2 === 0 };
    if (type === 3) return { name: 'Multiples of 3', icon: '×3', example: 'e.g. 3, 6, 9, 12', test: x => x % 3 === 0 };
    return { name: 'Multiples of 4', icon: '×4', example: 'e.g. 4, 8, 12, 16', test: x => x % 4 === 0 };
  }
  const m = randInt(5, 9);
  return { name: `Multiples of ${m}`, icon: `×${m}`, example: `e.g. ${m}, ${m * 2}, ${m * 3}`, test: x => x % m === 0 };
}

function spawnRow(
  cols: number,
  numRange: [number, number],
  rule: Rule,
  worldY: number,
  canvasW: number,
): Block[] {
  const totalW = canvasW - BLOCK_PAD * 2;
  const blockW = (totalW - GAP * (cols - 1)) / cols;
  const colors = shuffle(BLOCK_COLORS).slice(0, cols);

  // Generate values ensuring at least one correct
  let values: number[];
  let attempts = 0;
  do {
    values = Array.from({ length: cols }, () => randInt(numRange[0], numRange[1]));
    attempts++;
  } while (!values.some(v => rule.test(v)) && attempts < 50);

  if (!values.some(v => rule.test(v))) {
    // Force one correct by replacing a random block
    const idx = randInt(0, cols - 1);
    // Find a value that passes the rule
    let v = numRange[0];
    for (let i = numRange[0]; i <= numRange[1]; i++) {
      if (rule.test(i)) { v = i; break; }
    }
    values[idx] = v;
  }

  return values.map((val, i) => ({
    x: BLOCK_PAD + i * (blockW + GAP),
    y: worldY,
    w: blockW,
    h: BLOCK_H,
    value: val,
    isCorrect: rule.test(val),
    color: colors[i],
  }));
}

function spawnParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 60 + Math.random() * 120;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
      r: 3 + Math.random() * 4,
    });
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
const StackClimber: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { updateGameState } = useGameState();

  // ── UI state (triggers re-render) ──
  const [screen, setScreen] = useState<Screen>('start');
  const [hasJumped, setHasJumped] = useState(false);

  // ── Game state refs ──
  const screenRef = useRef<Screen>('start');
  const diffRef = useRef<Difficulty>('easy' as Difficulty);
  const ruleRef = useRef<Rule>(makeRule('easy'));
  const livesRef = useRef(3);
  const heightRef = useRef(0);     // current height in metres
  const bestRef = useRef(0);
  const peakYRef = useRef(0);      // lowest world Y reached by player (most upward)
  const showHintRef = useRef(false);

  // Physics
  const gravRef = useRef(600);     // current gravity (increases with height)
  const camYRef = useRef(0);       // world Y of screen top
  const groundYRef = useRef(0);    // world Y of ground line

  // Player
  const playerRef = useRef({ x: 200, y: 0, vx: 0, vy: 0 });
  const hasJumpedRef = useRef(false);
  const onGroundRef = useRef(true);
  const hurtCDRef = useRef(0);     // seconds remaining of hurt cooldown
  const flashTRef = useRef(0);     // seconds remaining of flash
  const shakeTRef = useRef(0);     // seconds remaining of screen shake

  // Blocks and particles
  const blocksRef = useRef<Block[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Timing
  const lastTRef = useRef<number>(0);
  const revealTRef = useRef(3);

  // Input
  const keysRef = useRef({ left: false, right: false, jump: false });

  // Canvas size
  const cwRef = useRef(400);
  const chRef = useRef(600);

  // ── Hide floating buttons ──
  useEffect(() => {
    updateGameState({ isPlaying: true });
    return () => updateGameState({ isPlaying: false });
  }, [updateGameState]);

  // ── Input handlers ──
  const handleJump = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    if (!hasJumpedRef.current && onGroundRef.current) {
      const cfg = DIFF[diffRef.current as Difficulty];
      playerRef.current.vy = cfg.jumpV;
      hasJumpedRef.current = true;
      onGroundRef.current = false;
      setHasJumped(true);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) keysRef.current.left = e.type === 'keydown';
      if (['ArrowRight', 'd', 'D'].includes(e.key)) keysRef.current.right = e.type === 'keydown';
      if (['ArrowUp', 'w', 'W', ' '].includes(e.key) && e.type === 'keydown') handleJump();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [handleJump]);

  // ── Canvas resize ──
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;
      const w = Math.min(container.clientWidth, 440);
      const h = Math.min(window.innerHeight - 80, 680);
      canvas.width = w;
      canvas.height = h;
      cwRef.current = w;
      chRef.current = h;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Game init ──
  const initGame = useCallback((diff: Difficulty) => {
    const cw = cwRef.current;
    const ch = chRef.current;
    const cfg = DIFF[diff];

    diffRef.current = diff;
    ruleRef.current = makeRule(diff);
    livesRef.current = 3;
    heightRef.current = 0;
    peakYRef.current = ch * 0.85;  // starts at ground
    gravRef.current = cfg.baseGrav;
    camYRef.current = 0;
    groundYRef.current = ch * 0.85;

    const p = playerRef.current;
    p.x = cw / 2;
    p.y = groundYRef.current - PLAYER_H;
    p.vx = 0;
    p.vy = 0;

    hasJumpedRef.current = false;
    onGroundRef.current = true;
    hurtCDRef.current = 0;
    flashTRef.current = 0;
    shakeTRef.current = 0;
    setHasJumped(false);

    // First row at ground level
    blocksRef.current = spawnRow(cfg.cols, cfg.numRange, ruleRef.current, groundYRef.current - BLOCK_H, cw);
    particlesRef.current = [];
  }, []);

  // ── Start flow ──
  const startReveal = useCallback((diff: Difficulty) => {
    diffRef.current = diff;
    initGame(diff);
    revealTRef.current = 3;
    screenRef.current = 'reveal';
    setScreen('reveal');
  }, [initGame]);

  const startPlaying = useCallback(() => {
    screenRef.current = 'playing';
    setScreen('playing');
    lastTRef.current = 0;
  }, []);

  // ── Draw helpers ──────────────────────────────────────────────────────────

  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.closePath();
  };

  const drawStars = useCallback((ctx: CanvasRenderingContext2D, camY: number, cw: number, ch: number) => {
    // Draw stars procedurally based on camY
    const seed = Math.floor(camY / ch);
    for (let s = seed - 1; s <= seed + 1; s++) {
      const rng = (n: number) => {
        let x = Math.sin(s * 9301 + n * 49297 + 233720) * 29323;
        return x - Math.floor(x);
      };
      for (let i = 0; i < 40; i++) {
        const sx = rng(i * 3) * cw;
        const sy = s * ch + rng(i * 3 + 1) * ch;
        const alpha = 0.3 + rng(i * 3 + 2) * 0.7;
        const r = 0.5 + rng(i * 3 + 1.5) * 1.5;
        const screenSy = sy - camY;
        if (screenSy < -10 || screenSy > ch + 10) continue;
        ctx.beginPath();
        ctx.arc(sx, screenSy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
    }
  }, []);

  const drawMountains = useCallback((ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
    // Static mountains at bottom of screen
    ctx.save();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(0, ch);
    ctx.lineTo(0, ch * 0.7);
    ctx.lineTo(cw * 0.15, ch * 0.45);
    ctx.lineTo(cw * 0.3, ch * 0.65);
    ctx.lineTo(cw * 0.45, ch * 0.38);
    ctx.lineTo(cw * 0.6, ch * 0.6);
    ctx.lineTo(cw * 0.75, ch * 0.42);
    ctx.lineTo(cw * 0.9, ch * 0.58);
    ctx.lineTo(cw, ch * 0.5);
    ctx.lineTo(cw, ch);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#16213e';
    ctx.beginPath();
    ctx.moveTo(0, ch);
    ctx.lineTo(0, ch * 0.8);
    ctx.lineTo(cw * 0.2, ch * 0.6);
    ctx.lineTo(cw * 0.35, ch * 0.72);
    ctx.lineTo(cw * 0.5, ch * 0.55);
    ctx.lineTo(cw * 0.65, ch * 0.7);
    ctx.lineTo(cw * 0.8, ch * 0.5);
    ctx.lineTo(cw, ch * 0.65);
    ctx.lineTo(cw, ch);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  const drawPlayer = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number, py: number,   // screen coords
    vy: number,
    flashT: number,
    hurtCD: number,
  ) => {
    // Flash effect: blink only when hurt (but never invisible during dying state)
    if (hurtCD > 0 && flashT > 0 && Math.floor(flashT * 10) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    const rising = vy < -50;
    const falling = vy > 50;
    const cx = px + PLAYER_W / 2;

    ctx.save();

    // Body
    ctx.fillStyle = '#7C3AED';
    drawRoundRect(ctx, px + 4, py + 10, PLAYER_W - 8, PLAYER_H - 14, 4);
    ctx.fill();

    // Head
    ctx.fillStyle = '#F5D0A9';
    ctx.beginPath();
    ctx.arc(cx, py + 7, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(cx - 3, py + 6, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 3, py + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.strokeStyle = '#F5D0A9';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (rising) {
      // Arms wide open at ~±70° from horizontal
      const armAngle = (70 * Math.PI) / 180;
      ctx.moveTo(cx - 4, py + 14);
      ctx.lineTo(cx - 4 - Math.cos(armAngle) * 12, py + 14 - Math.sin(armAngle) * 12);
      ctx.moveTo(cx + 4, py + 14);
      ctx.lineTo(cx + 4 + Math.cos(armAngle) * 12, py + 14 - Math.sin(armAngle) * 12);
    } else if (falling) {
      // Arms down/closed
      ctx.moveTo(cx - 4, py + 14);
      ctx.lineTo(cx - 4 - 6, py + 22);
      ctx.moveTo(cx + 4, py + 14);
      ctx.lineTo(cx + 4 + 6, py + 22);
    } else {
      // Neutral: arms out slightly
      ctx.moveTo(cx - 4, py + 14);
      ctx.lineTo(cx - 12, py + 16);
      ctx.moveTo(cx + 4, py + 14);
      ctx.lineTo(cx + 12, py + 16);
    }
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(cx - 4, py + PLAYER_H - 4);
    ctx.lineTo(cx - 6, py + PLAYER_H + 2);
    ctx.moveTo(cx + 4, py + PLAYER_H - 4);
    ctx.lineTo(cx + 6, py + PLAYER_H + 2);
    ctx.stroke();

    // Shirt stripe
    ctx.fillStyle = '#A78BFA';
    ctx.fillRect(px + 5, py + 15, PLAYER_W - 10, 3);

    ctx.restore();
    ctx.globalAlpha = 1;
  }, []);

  const drawBlock = useCallback((
    ctx: CanvasRenderingContext2D,
    b: Block,
    camY: number,
    showHint: boolean,
    frame: number,
  ) => {
    const sx = b.x;
    const sy = b.y - camY;
    if (sy > chRef.current + 50 || sy + b.h < -50) return;

    ctx.save();

    // Hint glow
    if (showHint && b.isCorrect) {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 18 + 6 * Math.sin(frame * 0.1);
    }

    drawRoundRect(ctx, sx, sy, b.w, b.h, 8);
    ctx.fillStyle = b.color;
    ctx.fill();

    // Shine
    const grad = ctx.createLinearGradient(sx, sy, sx, sy + b.h);
    grad.addColorStop(0, 'rgba(255,255,255,0.35)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    drawRoundRect(ctx, sx, sy, b.w, b.h, 8);
    ctx.fill();

    // Number label
    ctx.fillStyle = '#1a1a2e';
    ctx.font = `bold ${b.w < 60 ? 14 : 16}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(b.value), sx + b.w / 2, sy + b.h / 2);

    ctx.restore();
  }, []);

  const drawHUD = useCallback((
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    lives: number,
    height: number,
    rule: Rule,
    showHint: boolean,
    currentGrav: number,
    baseGrav: number,
  ) => {
    ctx.save();

    // Top bar background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    drawRoundRect(ctx, 8, 8, cw - 16, 44, 10);
    ctx.fill();

    // Height
    ctx.fillStyle = '#fff';
    ctx.font = "bold 15px 'Nunito', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${height}m`, 20, 30);

    // Hearts
    for (let i = 0; i < 3; i++) {
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.fillText(i < lives ? '❤️' : '🖤', cw - 60 + i * 20, 30);
    }

    // Rule display
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    drawRoundRect(ctx, 8, 58, cw - 70, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = "bold 13px 'Nunito', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Rule: ${rule.name}`, 16, 73);

    // Hint button
    ctx.fillStyle = showHint ? 'rgba(34,197,94,0.85)' : 'rgba(255,255,255,0.15)';
    drawRoundRect(ctx, cw - 58, 58, 50, 30, 8);
    ctx.fill();
    if (showHint) {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = showHint ? '#fff' : '#aaa';
    ctx.font = "bold 11px 'Nunito', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HINT', cw - 33, 73);
    ctx.shadowBlur = 0;

    // Fall speed bar (bottom)
    const barW = cw - 32;
    const frac = Math.min(1, (currentGrav - baseGrav) / (MAX_GRAV - baseGrav));
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    drawRoundRect(ctx, 16, ch - 22, barW, 10, 5);
    ctx.fill();

    const barGrad = ctx.createLinearGradient(16, 0, 16 + barW, 0);
    barGrad.addColorStop(0, '#22c55e');
    barGrad.addColorStop(0.5, '#eab308');
    barGrad.addColorStop(1, '#ef4444');
    ctx.fillStyle = barGrad;
    drawRoundRect(ctx, 16, ch - 22, barW * frac, 10, 5);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = "10px 'Nunito', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GRAVITY', cw / 2, ch - 30);

    ctx.restore();
  }, []);

  const drawStartScreen = useCallback((
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    diff: Difficulty,
    frame: number,
  ) => {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, '#0f0c29');
    sky.addColorStop(1, '#302b63');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);

    // Stars
    drawStars(ctx, 0, cw, ch);
    drawMountains(ctx, cw, ch);

    // Title
    ctx.save();
    ctx.shadowColor = '#a78bfa';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${cw < 340 ? 28 : 34}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Stack Climber', cw / 2, ch * 0.14);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = '#c4b5fd';
    ctx.font = `14px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jump on the right blocks to climb!', cw / 2, ch * 0.22);

    // How to play
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    drawRoundRect(ctx, 20, ch * 0.27, cw - 40, 72, 10);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `12px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const lines = [
      '1. Press JUMP to launch upward',
      '2. Land on CORRECT blocks → big bounce',
      '3. Wrong blocks → lose a life',
      '4. Survive as long as possible!',
    ];
    lines.forEach((l, i) => ctx.fillText(l, cw / 2, ch * 0.27 + 10 + i * 15));

    // Difficulty label
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold 14px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SELECT DIFFICULTY', cw / 2, ch * 0.49);

    // Difficulty buttons
    const diffs: Difficulty[] = ['easy', 'medium', 'hard'];
    const labels = ['Easy', 'Medium', 'Hard'];
    const gradients: [string, string][] = [
      ['#22c55e', '#16a34a'],
      ['#f59e0b', '#d97706'],
      ['#ef4444', '#dc2626'],
    ];
    const btnW = (cw - 48) / 3;
    diffs.forEach((d, i) => {
      const bx = 16 + i * (btnW + 8);
      const by = ch * 0.53;
      const bh = 38;
      const selected = d === diff;

      const g = ctx.createLinearGradient(bx, by, bx, by + bh);
      g.addColorStop(0, gradients[i][0]);
      g.addColorStop(1, gradients[i][1]);

      ctx.save();
      if (selected) {
        ctx.shadowColor = gradients[i][0];
        ctx.shadowBlur = 15;
      }
      drawRoundRect(ctx, bx, by, btnW, bh, 10);
      ctx.fillStyle = g;
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.fillStyle = '#fff';
      ctx.font = `bold 14px 'Nunito', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], bx + btnW / 2, by + bh / 2);
      ctx.restore();
    });

    // Start button
    const sbY = ch * 0.65;
    const sbW = Math.min(200, cw - 60);
    const sbX = (cw - sbW) / 2;
    const pulse = 1 + 0.05 * Math.sin(frame * 0.06);

    ctx.save();
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 20 * pulse;
    const sg = ctx.createLinearGradient(sbX, sbY, sbX, sbY + 46);
    sg.addColorStop(0, '#7c3aed');
    sg.addColorStop(1, '#4f46e5');
    drawRoundRect(ctx, sbX, sbY, sbW, 46, 14);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 18px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START GAME', cw / 2, sbY + 23);
    ctx.restore();

    void frame;
  }, [drawStars, drawMountains]);

  const drawRevealScreen = useCallback((
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    rule: Rule,
    countdown: number,
  ) => {
    const sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, '#0f0c29');
    sky.addColorStop(1, '#302b63');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);
    drawStars(ctx, 0, cw, ch);

    // Card
    const cardW = Math.min(320, cw - 40);
    const cardX = (cw - cardW) / 2;
    const cardY = ch * 0.12;
    const cardH = ch * 0.7;

    ctx.save();
    ctx.fillStyle = 'rgba(15,12,41,0.9)';
    ctx.strokeStyle = 'rgba(167,139,250,0.5)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Title
    ctx.fillStyle = '#c4b5fd';
    ctx.font = `bold 13px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOUR RULE THIS ROUND', cw / 2, cardY + 30);

    // Rule icon
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${cw < 340 ? 36 : 44}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rule.icon, cw / 2, cardY + 100);
    ctx.restore();

    // Rule name
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${cw < 340 ? 18 : 22}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rule.name, cw / 2, cardY + 160);

    // Example
    ctx.fillStyle = '#94a3b8';
    ctx.font = `13px 'Nunito', sans-serif`;
    ctx.fillText(rule.example, cw / 2, cardY + 190);

    // Separator
    ctx.strokeStyle = 'rgba(167,139,250,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 20, cardY + 215);
    ctx.lineTo(cardX + cardW - 20, cardY + 215);
    ctx.stroke();

    // Instruction lines
    ctx.fillStyle = '#22c55e';
    ctx.font = `bold 13px 'Nunito', sans-serif`;
    ctx.fillText('Correct block → big launch up', cw / 2, cardY + 238);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('Wrong block → lose a life', cw / 2, cardY + 258);

    // Countdown
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${cw < 340 ? 48 : 60}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const countDisplay = countdown <= 0 ? 'GO!' : String(Math.ceil(countdown));
    ctx.fillText(countDisplay, cw / 2, cardY + cardH - 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px 'Nunito', sans-serif`;
    ctx.fillText('Get ready...', cw / 2, cardY + cardH - 20);
  }, [drawStars]);

  const drawDeadScreen = useCallback((
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    height: number,
    best: number,
    rule: Rule,
    frame: number,
  ) => {
    const sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, '#0f0c29');
    sky.addColorStop(1, '#302b63');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);
    drawStars(ctx, 0, cw, ch);

    const cardW = Math.min(320, cw - 40);
    const cardX = (cw - cardW) / 2;
    const cardY = ch * 0.1;
    const cardH = ch * 0.78;

    ctx.save();
    ctx.fillStyle = 'rgba(15,12,41,0.92)';
    ctx.strokeStyle = 'rgba(239,68,68,0.4)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#f87171';
    ctx.font = `bold ${cw < 340 ? 26 : 32}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', cw / 2, cardY + 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px 'Nunito', sans-serif`;
    ctx.fillText('Rule was: ' + rule.name, cw / 2, cardY + 66);

    // Height score
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    drawRoundRect(ctx, cardX + 16, cardY + 82, cardW - 32, 60, 10);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold 13px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HEIGHT REACHED', cw / 2, cardY + 102);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${cw < 340 ? 28 : 34}px 'Nunito', sans-serif`;
    ctx.fillText(`${height}m`, cw / 2, cardY + 126);

    // Best score
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    drawRoundRect(ctx, cardX + 16, cardY + 154, cardW - 32, 52, 10);
    ctx.fill();
    ctx.fillStyle = '#a78bfa';
    ctx.font = `bold 12px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BEST', cw / 2, cardY + 170);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${cw < 340 ? 22 : 26}px 'Nunito', sans-serif`;
    ctx.fillText(`${best}m`, cw / 2, cardY + 192);

    // Flavor text
    const flavors = [
      'The sky is the limit... but gravity disagrees.',
      'Every fall is just a bounce waiting to happen.',
      'Keep climbing, the blocks believe in you!',
      'Higher next time!',
    ];
    ctx.fillStyle = '#64748b';
    ctx.font = `italic 12px 'Nunito', sans-serif`;
    ctx.fillText(flavors[height % flavors.length], cw / 2, cardY + 226);

    // Play Again button
    const sbY = cardY + cardH - 60;
    const sbW = Math.min(200, cardW - 40);
    const sbX = (cw - sbW) / 2;
    const pulse = 1 + 0.05 * Math.sin(frame * 0.06);

    ctx.save();
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 20 * pulse;
    const sg = ctx.createLinearGradient(sbX, sbY, sbX, sbY + 44);
    sg.addColorStop(0, '#7c3aed');
    sg.addColorStop(1, '#4f46e5');
    drawRoundRect(ctx, sbX, sbY, sbW, 44, 14);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 16px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLAY AGAIN', cw / 2, sbY + 22);
    ctx.restore();
  }, [drawStars]);

  // ── Game loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    const loop = (now: number) => {
      animRef.current = requestAnimationFrame(loop);
      const cw = cwRef.current;
      const ch = chRef.current;

      // ── Reveal screen ──
      if (screenRef.current === 'reveal') {
        if (lastTRef.current === 0) lastTRef.current = now;
        const dt = Math.min((now - lastTRef.current) / 1000, 0.1);
        lastTRef.current = now;
        revealTRef.current -= dt;
        // countdown rendered on canvas, no state needed
        if (revealTRef.current <= 0) {
          startPlaying();
        }
        drawRevealScreen(ctx, cw, ch, ruleRef.current, revealTRef.current);
        return;
      }

      // ── Start / Dead screens ──
      if (screenRef.current === 'start') {
        const sky = ctx.createLinearGradient(0, 0, 0, ch);
        sky.addColorStop(0, '#0f0c29');
        sky.addColorStop(1, '#302b63');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, cw, ch);
        drawStartScreen(ctx, cw, ch, diffRef.current, frame);
        frame++;
        return;
      }
      if (screenRef.current === 'dead') {
        drawDeadScreen(ctx, cw, ch, heightRef.current, bestRef.current, ruleRef.current, frame);
        frame++;
        return;
      }

      // ── Playing ──
      if (lastTRef.current === 0) lastTRef.current = now;
      const rawDt = (now - lastTRef.current) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTRef.current = now;
      frame++;

      const cfg = DIFF[diffRef.current as Difficulty];
      const p = playerRef.current;

      // 1. Update timers
      flashTRef.current = Math.max(0, flashTRef.current - dt);
      hurtCDRef.current = Math.max(0, hurtCDRef.current - dt);
      shakeTRef.current = Math.max(0, shakeTRef.current - dt);

      // 2. Horizontal movement
      const MOVE_SPEED = 180;
      if (keysRef.current.left) p.vx = -MOVE_SPEED;
      else if (keysRef.current.right) p.vx = MOVE_SPEED;
      else p.vx = 0;

      // 3. Apply gravity
      p.vy = Math.min(p.vy + gravRef.current * dt, MAX_FALL);

      // 4. Move player
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Wrap horizontally
      if (p.x < -PLAYER_W) p.x = cw;
      if (p.x > cw) p.x = -PLAYER_W;

      // 5. Block collisions (only when falling down)
      if (p.vy > 0 && hasJumpedRef.current) {
        const foot = p.y + PLAYER_H;
        const prevFoot = foot - p.vy * dt;
        for (const b of blocksRef.current) {
          const bScreenY = b.y - camYRef.current;
          const pScreenX = p.x;
          // Check horizontal overlap
          if (pScreenX + PLAYER_W < b.x || pScreenX > b.x + b.w) continue;
          // Check foot crossing block top
          const bTop = b.y;
          if (prevFoot <= bTop && foot >= bTop) {
            p.y = bTop - PLAYER_H;

            // Calculate bounce velocity from peak height
            const peakFrac = cfg.bouncePct;
            const bounceV = -Math.sqrt(2 * cfg.baseGrav * ch * peakFrac);

            if (b.isCorrect) {
              // Correct block: big launch, spawn particles, new row
              p.vy = bounceV;
              spawnParticles(particlesRef.current, p.x + PLAYER_W / 2, bScreenY + b.h / 2, '#22c55e', 14);
              blocksRef.current = [];
            } else {
              // Wrong block: smaller bounce, lose a life
              if (hurtCDRef.current <= 0) {
                livesRef.current = Math.max(0, livesRef.current - 1);
                hurtCDRef.current = HURT_CD;
                flashTRef.current = HURT_CD;
                shakeTRef.current = 0.35;
                spawnParticles(particlesRef.current, p.x + PLAYER_W / 2, bScreenY + b.h / 2, '#ef4444', 10);
              }
              p.vy = bounceV * 0.85;
              blocksRef.current = [];
            }
            break;
          }
        }
      }

      // 6. Ground collision (only before first jump — once launched, no ground landing)
      if (!hasJumpedRef.current) {
        if (p.y + PLAYER_H >= groundYRef.current) {
          p.y = groundYRef.current - PLAYER_H;
          p.vy = 0;
          onGroundRef.current = true;
        }
      }

      // 7. Update height/score
      if (p.y < peakYRef.current) {
        peakYRef.current = p.y;
        heightRef.current = Math.max(0, Math.floor((groundYRef.current - peakYRef.current) / 10));
        if (heightRef.current > bestRef.current) bestRef.current = heightRef.current;

        // Increase gravity with height
        const newGrav = Math.min(MAX_GRAV, cfg.baseGrav + heightRef.current * cfg.gravInc);
        gravRef.current = newGrav;
      }

      // 8. Update camera (instant snap upward only)
      const targetCam = p.y - ch * 0.35;
      if (targetCam < camYRef.current) {
        camYRef.current = targetCam;
      }

      // 9. Spawn new row if blocks empty (after bounce cleared them)
      if (blocksRef.current.length === 0 && hasJumpedRef.current) {
        const rowY = camYRef.current + ch - BLOCK_H;
        blocksRef.current = spawnRow(cfg.cols, cfg.numRange, ruleRef.current, rowY, cw);
      }

      // 10. Death checks
      if (livesRef.current <= 0 || (hasJumpedRef.current && p.y - camYRef.current > ch + 50)) {
        screenRef.current = 'dead';
        setScreen('dead');
        return;
      }

      // ── Draw ──────────────────────────────────────────────────────────────

      // Screen shake offset
      let shakeX = 0;
      let shakeY = 0;
      if (shakeTRef.current > 0) {
        const mag = shakeTRef.current * 8;
        shakeX = (Math.random() * 2 - 1) * mag;
        shakeY = (Math.random() * 2 - 1) * mag;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Background
      const sky = ctx.createLinearGradient(0, 0, 0, ch);
      sky.addColorStop(0, '#0f0c29');
      sky.addColorStop(0.6, '#302b63');
      sky.addColorStop(1, '#24243e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cw, ch);

      drawStars(ctx, camYRef.current, cw, ch);

      // Mountains (only visible near ground)
      const groundScreenY = groundYRef.current - camYRef.current;
      if (groundScreenY < ch + 200 && groundScreenY > -200) {
        ctx.save();
        ctx.translate(0, groundScreenY - ch * 0.85);
        drawMountains(ctx, cw, ch);
        ctx.restore();
      }

      // Ground line
      if (groundScreenY < ch + 10) {
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundScreenY);
        ctx.lineTo(cw, groundScreenY);
        ctx.stroke();

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, groundScreenY, cw, ch);
      }

      // Blocks
      for (const b of blocksRef.current) {
        drawBlock(ctx, b, camYRef.current, showHintRef.current, frame);
      }

      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 200 * dt;
        pt.life -= dt / pt.maxLife;
        if (pt.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        const alpha = Math.max(0, pt.life);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y - camYRef.current, pt.r * alpha, 0, Math.PI * 2);
        ctx.fillStyle = pt.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      // Player
      const screenPX = p.x;
      const screenPY = p.y - camYRef.current;
      drawPlayer(ctx, screenPX, screenPY, p.vy, flashTRef.current, hurtCDRef.current);

      ctx.restore();

      // HUD (no shake)
      drawHUD(
        ctx, cw, ch,
        livesRef.current,
        heightRef.current,
        ruleRef.current,
        showHintRef.current,
        gravRef.current,
        cfg.baseGrav,
      );
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawStartScreen, drawRevealScreen, drawDeadScreen, drawStars, drawMountains, drawBlock, drawPlayer, drawHUD, startPlaying]);

  // ── Canvas click handler ──────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cw = cwRef.current;
    const ch = chRef.current;

    if (screenRef.current === 'start') {
      // Difficulty buttons
      const diffs: Difficulty[] = ['easy', 'medium', 'hard'];
      const btnW = (cw - 48) / 3;
      const by = ch * 0.53;
      const bh = 38;
      for (let i = 0; i < 3; i++) {
        const bx = 16 + i * (btnW + 8);
        if (sx >= bx && sx <= bx + btnW && sy >= by && sy <= by + bh) {
          diffRef.current = diffs[i];
          diffRef.current = diffs[i];
          return;
        }
      }
      // Start button
      const sbW = Math.min(200, cw - 60);
      const sbX = (cw - sbW) / 2;
      const sbY = ch * 0.65;
      if (sx >= sbX && sx <= sbX + sbW && sy >= sbY && sy <= sbY + 46) {
        startReveal(diffRef.current);
        return;
      }
    }

    if (screenRef.current === 'playing') {
      // Hint button
      const hintX = cw - 58;
      const hintY = 58;
      if (sx >= hintX && sx <= hintX + 50 && sy >= hintY && sy <= hintY + 30) {
        showHintRef.current = !showHintRef.current;
        return;
      }
    }

    if (screenRef.current === 'dead') {
      const cardW = Math.min(320, cw - 40);
      const cardY = ch * 0.1;
      const cardH = ch * 0.78;
      const sbW = Math.min(200, cardW - 40);
      const sbX = (cw - sbW) / 2;
      const sbY = cardY + cardH - 60;
      if (sx >= sbX && sx <= sbX + sbW && sy >= sbY && sy <= sbY + 44) {
        startReveal(diffRef.current);
        return;
      }
    }
  }, [startReveal]);

  // ── Touch handler ─────────────────────────────────────────────────────────
  const handleCanvasTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const sx = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (touch.clientY - rect.top) * (canvas.height / rect.height);
    const cw = cwRef.current;
    const ch = chRef.current;

    if (screenRef.current === 'start') {
      const diffs: Difficulty[] = ['easy', 'medium', 'hard'];
      const btnW = (cw - 48) / 3;
      const by = ch * 0.53;
      const bh = 38;
      for (let i = 0; i < 3; i++) {
        const bx = 16 + i * (btnW + 8);
        if (sx >= bx && sx <= bx + btnW && sy >= by && sy <= by + bh) {
          diffRef.current = diffs[i];
          diffRef.current = diffs[i];
          return;
        }
      }
      const sbW = Math.min(200, cw - 60);
      const sbX = (cw - sbW) / 2;
      const sbY = ch * 0.65;
      if (sx >= sbX && sx <= sbX + sbW && sy >= sbY && sy <= sbY + 46) {
        startReveal(diffRef.current);
        return;
      }
    }

    if (screenRef.current === 'playing') {
      const hintX = cw - 58;
      const hintY = 58;
      if (sx >= hintX && sx <= hintX + 50 && sy >= hintY && sy <= hintY + 30) {
        showHintRef.current = !showHintRef.current;
        return;
      }
    }

    if (screenRef.current === 'dead') {
      const cardW = Math.min(320, cw - 40);
      const cardH = ch * 0.78;
      const cardY = ch * 0.1;
      const sbW = Math.min(200, cardW - 40);
      const sbX = (cw - sbW) / 2;
      const sbY = cardY + cardH - 60;
      if (sx >= sbX && sx <= sbX + sbW && sy >= sbY && sy <= sbY + 44) {
        startReveal(diffRef.current);
        return;
      }
    }
  }, [startReveal]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
        background: '#0f0c29',
        fontFamily: "'Nunito', sans-serif",
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Google Font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
      />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440 }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchEnd={handleCanvasTouch}
          style={{
            display: 'block',
            width: '100%',
            cursor: 'pointer',
            touchAction: 'none',
          }}
        />

        {/* On-screen controls (only shown during playing) */}
        {screen === 'playing' && (
          <div
            style={{
              position: 'absolute',
              bottom: 36,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 12px',
              pointerEvents: 'none',
            }}
          >
            {/* Left button */}
            <button
              onTouchStart={e => { e.preventDefault(); keysRef.current.left = true; }}
              onTouchEnd={e => { e.preventDefault(); keysRef.current.left = false; }}
              onMouseDown={() => keysRef.current.left = true}
              onMouseUp={() => keysRef.current.left = false}
              style={{
                pointerEvents: 'all',
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(124,58,237,0.7)',
                border: '2px solid rgba(167,139,250,0.5)',
                color: '#fff',
                fontSize: 28,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ◀
            </button>

            {/* Jump button (only before first jump) */}
            {!hasJumped && (
              <button
                onTouchStart={e => { e.preventDefault(); handleJump(); }}
                onMouseDown={() => handleJump()}
                style={{
                  pointerEvents: 'all',
                  width: 88,
                  height: 64,
                  borderRadius: 20,
                  background: 'rgba(34,197,94,0.85)',
                  border: '2px solid rgba(134,239,172,0.6)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 0 20px rgba(34,197,94,0.5)',
                }}
              >
                JUMP
              </button>
            )}

            {/* Right button */}
            <button
              onTouchStart={e => { e.preventDefault(); keysRef.current.right = true; }}
              onTouchEnd={e => { e.preventDefault(); keysRef.current.right = false; }}
              onMouseDown={() => keysRef.current.right = true}
              onMouseUp={() => keysRef.current.right = false}
              style={{
                pointerEvents: 'all',
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(124,58,237,0.7)',
                border: '2px solid rgba(167,139,250,0.5)',
                color: '#fff',
                fontSize: 28,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StackClimber;
