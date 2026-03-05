import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';

// ─── Types ────────────────────────────────────────────────────────────────────
type Difficulty = 'easy' | 'medium' | 'hard';
type Screen = 'start' | 'reveal' | 'playing' | 'dead';
type GState = 'idle' | 'playing' | 'dying';

interface DiffConfig {
  grav: number; jumpV: number; bouncePct: number;
  numRange: [number, number]; cols: number;
  camTarget: number; // player screen position (fraction from top) at bounce apex
}
const DIFF: Record<Difficulty, DiffConfig> = {
  easy:   { grav: 700,  jumpV: -700, bouncePct: 1.2,  numRange: [1, 20], cols: 3, camTarget: 0.20 },
  medium: { grav: 900,  jumpV: -700, bouncePct: 0.9,  numRange: [1, 30], cols: 4, camTarget: 0.30 },
  hard:   { grav: 1100, jumpV: -700, bouncePct: 0.65, numRange: [1, 40], cols: 4, camTarget: 0.40 },
};
// Gravity increases the same way for all difficulties: +2 px/s² per metre climbed
const GRAV_INC = 2;
const CAM_LERP = 5.0; // soft camera follow speed (same for all difficulties)

interface Rule { icon: string; text: string; eg: string; ok: (v: number) => boolean; }
interface Block { x: number; y: number; w: number; h: number; val: number; valid: boolean; colIdx: number; flash: number; hit: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; r: number; life: number; color: string; }

// Earthy block palette
const BC = [
  { bg: '#8b7355', top: '#c4a882', txt: '#f0e8d8' },
  { bg: '#6b8c6b', top: '#9bc49b', txt: '#f0e8d8' },
  { bg: '#7a6b8a', top: '#b09bc4', txt: '#f0e8d8' },
  { bg: '#8a6b5a', top: '#c49b82', txt: '#f0e8d8' },
  { bg: '#5a7a8a', top: '#82b0c4', txt: '#f0e8d8' },
  { bg: '#7a8a5a', top: '#b0c482', txt: '#f0e8d8' },
];

const PH = 36; // block height
const PGAP = 8;
const MOVE = 200;

function ri(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function buildRule(d: Difficulty): Rule {
  if (d === 'easy') {
    const t = ri(5, 15), tp = ri(0, 3);
    const opts: Rule[] = [
      { icon: `<${t}`,  text: `Numbers less than ${t}`,    eg: `1, 2 … ${t - 1}`,     ok: v => v < t },
      { icon: `≤${t}`,  text: `Numbers ${t} or less`,      eg: `1, 2 … ${t}`,         ok: v => v <= t },
      { icon: `>${t}`,  text: `Numbers greater than ${t}`, eg: `${t+1}, ${t+2} …`,    ok: v => v > t },
      { icon: `≥${t}`,  text: `Numbers ${t} or more`,      eg: `${t}, ${t+1} …`,      ok: v => v >= t },
    ];
    return opts[tp];
  }
  if (d === 'medium') {
    const tp = ri(0, 4);
    if (tp === 0) return { icon: '2×', text: 'Even numbers',      eg: '2, 4, 6, 8 …',          ok: v => v % 2 === 0 };
    if (tp === 1) return { icon: '1×', text: 'Odd numbers',       eg: '1, 3, 5, 7 …',          ok: v => v % 2 !== 0 };
    const m = [2, 3, 4][tp - 2];
    return { icon: `×${m}`, text: `Multiples of ${m}`, eg: `${m}, ${m*2}, ${m*3} …`, ok: v => v % m === 0 };
  }
  const m = ri(5, 9);
  return { icon: `×${m}`, text: `Multiples of ${m}`, eg: `${m}, ${m*2}, ${m*3} …`, ok: v => v % m === 0 };
}

// Build a row with exactly 1 or 2 correct blocks, never 0, never all correct.
function buildRow(worldY: number, canvasWidth: number, cfg: DiffConfig, rule: Rule): Block[] {
  const cols = cfg.cols;
  const pw = Math.floor((canvasWidth - 32 - (cols - 1) * PGAP) / cols);
  const sx = Math.floor((canvasWidth - (cols * pw + (cols - 1) * PGAP)) / 2);

  // Decide how many correct: 1 or 2, but never all cols
  const maxCorrect = Math.min(2, cols - 1);
  const numCorrect = ri(1, maxCorrect);

  // Gather valid numbers
  const validNums: number[] = [];
  for (let t = 0; validNums.length < numCorrect && t < 400; t++) {
    const n = ri(cfg.numRange[0], cfg.numRange[1]);
    if (rule.ok(n)) validNums.push(n);
  }
  const actualCorrect = validNums.length; // may be <numCorrect if rule has very few matches

  // Gather invalid numbers
  const invalidNums: number[] = [];
  for (let t = 0; invalidNums.length < cols - actualCorrect && t < 400; t++) {
    const n = ri(cfg.numRange[0], cfg.numRange[1]);
    if (!rule.ok(n)) invalidNums.push(n);
  }
  // Fallback if couldn't find enough invalids (pathological case)
  while (invalidNums.length < cols - actualCorrect)
    invalidNums.push(ri(cfg.numRange[0], cfg.numRange[1]));

  // Shuffle which positions get valid/invalid
  const positions = Array.from({ length: cols }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = ri(0, i); [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const finalNums = new Array<number>(cols);
  for (let i = 0; i < actualCorrect; i++) finalNums[positions[i]] = validNums[i];
  for (let i = actualCorrect; i < cols; i++) finalNums[positions[i]] = invalidNums[i - actualCorrect];

  const ci = BC.map((_, i) => i);
  for (let i = ci.length - 1; i > 0; i--) { const j = ri(0, i); [ci[i], ci[j]] = [ci[j], ci[i]]; }
  return finalNums.map((val, i): Block => ({
    x: sx + i * (pw + PGAP), y: worldY, w: pw, h: PH,
    val, valid: rule.ok(val), colIdx: ci[i % ci.length], flash: 0, hit: false,
  }));
}

// Static stars (deterministic)
const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  left: ((Math.sin(i * 9.7) * 0.5 + 0.5) * 100).toFixed(1) + '%',
  top:  ((Math.sin(i * 6.3) * 0.5 + 0.5) * 60).toFixed(1) + '%',
  size: (0.4 + (Math.sin(i * 13.7) * 0.5 + 0.5) * 1.4).toFixed(2),
  dur:  (2 + (Math.sin(i * 4.2) * 0.5 + 0.5) * 3).toFixed(1) + 's',
  del:  ((Math.sin(i * 2.1) * 0.5 + 0.5)).toFixed(2) + 's',
}));

// ─── Component ────────────────────────────────────────────────────────────────
const StackClimber: React.FC = () => {
  const gcRef   = useRef<HTMLCanvasElement>(null);
  const mtnRef  = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const { updateGameState } = useGameState();

  // ── UI state ──
  const [screen,    setScreen]    = useState<Screen>('start');
  const [selDiff,   setSelDiff]   = useState<Difficulty>('easy');
  const [hasJumped, setHasJumped] = useState(false);
  const [cdNum,     setCdNum]     = useState(3);
  const [showHint,  setShowHint]  = useState(false);
  const [ruleDisp,  setRuleDisp]  = useState({ icon: '?', text: '-', eg: '' });
  const [endData,   setEndData]   = useState({ height: 0, best: 0, ruleIcon: '?', ruleText: '-' });

  // DOM refs for high-freq HUD updates (avoid re-renders)
  const hScoreEl    = useRef<HTMLDivElement>(null);
  const hLivesEl    = useRef<HTMLDivElement>(null);
  const speedFillEl = useRef<HTMLDivElement>(null);

  // ── Game refs ──
  const diffRef      = useRef<Difficulty>('easy');
  const ruleRef      = useRef<Rule>(buildRule('easy'));
  const livesRef     = useRef(3);
  const heightMRef   = useRef(0);
  const hiScoreRef   = useRef(0);
  const camYRef      = useRef(0);
  const groundYRef   = useRef(600);
  const gStateRef    = useRef<GState>('idle');
  const showHintRef  = useRef(false);
  const hasJumpedRef = useRef(false);
  const P = useRef({ x: 0, y: 0, vx: 0, vy: 0, w: 26, h: 36, onGround: true, flashT: 0, hurtCD: 0, launchT: 0 });
  const platformsRef = useRef<Block[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shakeTRef    = useRef(0);
  const lastTsRef    = useRef(0);
  const jumpQRef          = useRef(false);
  const keysRef           = useRef({ l: false, r: false });
  const waitingForApexRef    = useRef(false);

  // Keep showHint ref in sync
  useEffect(() => { showHintRef.current = showHint; }, [showHint]);

  // ── Hide floating buttons ──
  useEffect(() => {
    updateGameState('stack-climber', true);
    return () => { mountedRef.current = false; updateGameState('stack-climber', false); };
  }, [updateGameState]);

  // ── Keyboard ──
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') keysRef.current.l = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.r = true;
      if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !hasJumpedRef.current) {
        jumpQRef.current = true; e.preventDefault();
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') keysRef.current.l = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.r = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  // ── Mountain canvas ──
  useEffect(() => {
    const draw = () => {
      const mc = mtnRef.current; if (!mc) return;
      const x = mc.getContext('2d'); if (!x) return;
      mc.width = window.innerWidth; mc.height = window.innerHeight * 0.55;
      const w = mc.width, h = mc.height;
      const fill = (pts: number[], col: string) => {
        x.fillStyle = col; x.beginPath(); x.moveTo(0, h);
        pts.forEach((p, i) => x.lineTo(i / (pts.length - 1) * w, h * p));
        x.lineTo(w, h); x.closePath(); x.fill();
      };
      fill([0.55,0.3,0.5,0.2,0.45,0.35,0.6,0.25,0.5], '#1e3a5f');
      fill([0.7,0.45,0.6,0.3,0.65,0.5,0.75,0.4,0.7],  '#162840');
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  // ── Canvas resize ──
  useEffect(() => {
    const resize = () => {
      const gc = gcRef.current; if (!gc || !gc.parentElement) return;
      gc.width  = gc.parentElement.clientWidth;
      gc.height = gc.parentElement.clientHeight;
      groundYRef.current = gc.height * 0.88;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Main game loop (runs forever, updates only when playing/dying) ──
  useEffect(() => {
    const gc = gcRef.current; if (!gc) return;
    const ctxMaybe = gc.getContext('2d'); if (!ctxMaybe) return;
    const ctx: CanvasRenderingContext2D = ctxMaybe;

    function getBounceV() {
      const cfg = DIFF[diffRef.current];
      return -Math.sqrt(2 * cfg.grav * Math.max(gc!.height, 400) * cfg.bouncePct);
    }
    function getGrav() {
      return Math.min(DIFF[diffRef.current].grav + heightMRef.current * GRAV_INC, 3000);
    }
    function makeRow(worldY: number): Block[] {
      return buildRow(worldY, gc!.width, DIFF[diffRef.current], ruleRef.current);
    }
    function spawnParts(x: number, y: number, color: string, count: number) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 120;
        particlesRef.current.push({ x, y, color, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp-60, r: 3+Math.random()*3, life: 1 });
      }
    }
    function updateHUD() {
      if (hScoreEl.current) hScoreEl.current.textContent = `${heightMRef.current}m`;
      if (hLivesEl.current) {
        hLivesEl.current.innerHTML = [0,1,2].map(i =>
          `<span style="font-size:1.1rem;transition:all .2s;opacity:${i<livesRef.current?1:0.2};filter:${i<livesRef.current?'none':'grayscale(1)'}">❤️</span>`
        ).join('');
      }
    }
    function updateSpeedBar() {
      if (!speedFillEl.current) return;
      const grav = getGrav(), base = DIFF[diffRef.current].grav;
      const pct = Math.min(100, (grav - base) / (3000 - base) * 100);
      speedFillEl.current.style.width = `${pct}%`;
      speedFillEl.current.style.background = pct > 70 ? '#e05c5c' : pct > 40 ? '#f4c542' : '#7ec8a0';
    }

    // ── Draw helpers ──
    function rrect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
    }
    function drawBlock(b: Block) {
      const c = BC[b.colIdx % BC.length], r = 6;
      const sx = b.x, sy = b.y - camYRef.current;
      if (sy > gc!.height + 60 || sy + b.h < -20) return;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(sx+3,sy+4,b.w,b.h,r); ctx.fill();
      ctx.fillStyle = b.flash > 0 ? '#c0392b' : c.bg; rrect(sx,sy,b.w,b.h,r); ctx.fill();
      ctx.fillStyle = c.top; rrect(sx+3,sy+3,b.w-6,b.h*.38,r-2); ctx.fill();
      if (b.valid && showHintRef.current) {
        ctx.save(); ctx.shadowColor='#7ec8a0'; ctx.shadowBlur=12;
        ctx.strokeStyle='rgba(126,200,160,.7)'; ctx.lineWidth=2.5;
        rrect(sx+1,sy+1,b.w-2,b.h-2,r); ctx.stroke(); ctx.restore();
      }
      ctx.save();
      ctx.fillStyle = b.flash > 0 ? '#fff' : c.txt;
      ctx.font = `900 ${b.val > 99 ? 12 : 16}px Nunito`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(b.val), sx+b.w/2, sy+b.h/2);
      ctx.restore();
    }
    function drawGround() {
      const sy = groundYRef.current - camYRef.current;
      if (sy > gc!.height + 10) return;
      ctx.fillStyle = '#2a1f14'; ctx.fillRect(0,sy,gc!.width,gc!.height-sy+10);
      ctx.fillStyle = '#4a3520'; ctx.fillRect(0,sy,gc!.width,6);
      ctx.fillStyle = '#3d6b3d';
      for (let x = 0; x < gc!.width; x += 18) {
        const bl = 4 + Math.sin(x*.3)*2; ctx.fillRect(x, sy-bl, 5, bl);
      }
    }
    function drawHeightMarkers() {
      const interval = 150, base = Math.floor(camYRef.current / interval) * interval;
      for (let wy = base; wy < camYRef.current + gc!.height + interval; wy += interval) {
        const sy = wy - camYRef.current;
        if (sy < 0 || sy > gc!.height) continue;
        const m = Math.max(0, Math.round((groundYRef.current - wy) / 10));
        ctx.save();
        ctx.globalAlpha=.06; ctx.strokeStyle='white'; ctx.lineWidth=1; ctx.setLineDash([4,8]);
        ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(gc!.width,sy); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha=.11; ctx.fillStyle='white';
        ctx.font='700 10px Nunito'; ctx.textAlign='left'; ctx.fillText(`${m}m`,6,sy-3);
        ctx.restore();
      }
    }
    function drawPlayer() {
      const p = P.current;
      if (gStateRef.current !== 'dying' && p.flashT > 0 && Math.floor(p.flashT * 8) % 2 === 0) return;
      const t = Date.now() * .001;
      const cx = p.x, sy = p.y - camYRef.current;
      const inAir = !p.onGround;
      const ls = inAir ? 0 : Math.sin(t * 9) * .3;
      const rising = inAir && p.vy <= -50;
      const falling = inAir && p.vy > 50;
      const as = rising ? 1.2 : falling ? 0.1 : inAir ? 0.3 : Math.sin(t*9+Math.PI)*.25;
      ctx.save(); ctx.translate(cx, sy);
      if (!inAir) {
        ctx.save(); ctx.globalAlpha=.2; ctx.fillStyle='#000';
        ctx.beginPath(); ctx.ellipse(0,2,13,4,0,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
      // legs
      ctx.save(); ctx.translate(-5,-6); ctx.rotate(ls);
      ctx.fillStyle='#1e3a6e'; ctx.fillRect(-3,0,6,13);
      ctx.fillStyle='#3a2010'; ctx.fillRect(-4,10,8,5); ctx.restore();
      ctx.save(); ctx.translate(5,-6); ctx.rotate(-ls);
      ctx.fillStyle='#1e3a6e'; ctx.fillRect(-3,0,6,13);
      ctx.fillStyle='#3a2010'; ctx.fillRect(-4,10,8,5); ctx.restore();
      // body
      ctx.fillStyle='#3a7bd5'; ctx.beginPath();
      (ctx as CanvasRenderingContext2D & { roundRect: (...a: number[]) => void }).roundRect(-9,-24,18,20,4);
      ctx.fill();
      ctx.fillStyle='#c0392b'; ctx.beginPath();
      (ctx as CanvasRenderingContext2D & { roundRect: (...a: number[]) => void }).roundRect(4,-22,8,13,3);
      ctx.fill();
      // arms
      ctx.save(); ctx.translate(-10,-20); ctx.rotate(-as);
      ctx.fillStyle='#3a7bd5'; ctx.fillRect(-2,0,5,11);
      ctx.fillStyle='#f4c542'; ctx.beginPath(); ctx.arc(0,12,4,0,Math.PI*2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(10,-20); ctx.rotate(as);
      ctx.fillStyle='#3a7bd5'; ctx.fillRect(-3,0,5,11);
      ctx.fillStyle='#f4c542'; ctx.beginPath(); ctx.arc(0,12,4,0,Math.PI*2); ctx.fill(); ctx.restore();
      // head
      ctx.fillStyle='#f5d5a8'; ctx.beginPath(); ctx.arc(0,-32,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#2a1a0a';
      ctx.beginPath(); ctx.arc(-3.5,-33,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(3.5,-33,2,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#5a3010'; ctx.lineWidth=1.5; ctx.lineCap='round'; ctx.beginPath();
      if (inAir && p.vy < -150) ctx.arc(0,-31,3.5,.5,Math.PI-.5,true);
      else ctx.arc(0,-31,3,.3,Math.PI-.3);
      ctx.stroke();
      // helmet
      ctx.fillStyle='#f4c542'; ctx.beginPath(); ctx.ellipse(0,-38,11,7,0,Math.PI,0); ctx.fill();
      ctx.fillStyle='#d4a820'; ctx.fillRect(-13,-39,26,4);
      // launch sparks
      if (p.launchT > 0) {
        const lt = p.launchT;
        for (let i = 0; i < 6; i++) {
          const a = i/6*Math.PI*2+t, d = 18*(1-lt);
          ctx.save(); ctx.globalAlpha=lt;
          ctx.fillStyle = i%2 ? '#f4c542' : '#7ec8a0';
          ctx.beginPath(); ctx.arc(Math.cos(a)*d,Math.sin(a)*d,3*lt,0,Math.PI*2); ctx.fill(); ctx.restore();
        }
      }
      ctx.restore();
    }
    function drawParticles() {
      if (gStateRef.current === 'dying') return;
      for (const pt of particlesRef.current) {
        ctx.save(); ctx.globalAlpha=pt.life; ctx.fillStyle=pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y-camYRef.current, pt.r*pt.life, 0, Math.PI*2); ctx.fill(); ctx.restore();
      }
    }
    function draw() {
      ctx.clearRect(0,0,gc!.width,gc!.height);
      const ox = shakeTRef.current > 0 ? (Math.random()-.5)*shakeTRef.current*12 : 0;
      const oy = shakeTRef.current > 0 ? (Math.random()-.5)*shakeTRef.current*12 : 0;
      ctx.save(); ctx.translate(Math.round(ox),Math.round(oy));
      const g = ctx.createLinearGradient(0,0,0,gc!.height);
      g.addColorStop(0,'#0a0a1a'); g.addColorStop(.6,'#0f1a2e'); g.addColorStop(1,'#0a1a10');
      ctx.fillStyle=g; ctx.fillRect(0,0,gc!.width,gc!.height);
      if (gStateRef.current === 'playing' || gStateRef.current === 'dying') {
        drawHeightMarkers(); drawGround();
        for (const b of platformsRef.current) drawBlock(b);
        drawPlayer(); drawParticles();
      }
      ctx.restore();
    }

    // ── Physics update ──
    function endGame() {
      if (gStateRef.current === 'idle') return;
      gStateRef.current = 'dying';
      const h = heightMRef.current;
      if (h > hiScoreRef.current) hiScoreRef.current = h;
      if (mountedRef.current) {
        setEndData({ height: h, best: hiScoreRef.current, ruleIcon: ruleRef.current.icon, ruleText: ruleRef.current.text });
        setTimeout(() => { if (mountedRef.current) { gStateRef.current = 'idle'; setScreen('dead'); } }, 900);
      }
    }
    function update(dt: number) {
      if (gStateRef.current !== 'playing') return;
      const p = P.current;
      if (p.flashT > 0) p.flashT = Math.max(0, p.flashT - dt);
      if (p.hurtCD > 0) p.hurtCD = Math.max(0, p.hurtCD - dt);
      if (p.launchT > 0) p.launchT = Math.max(0, p.launchT - dt * 2);
      shakeTRef.current = Math.max(0, shakeTRef.current - dt);
      if (keysRef.current.l) p.vx = -MOVE;
      else if (keysRef.current.r) p.vx = MOVE;
      else p.vx *= .5;
      if (jumpQRef.current && p.onGround) {
        p.vy = DIFF[diffRef.current].jumpV; p.onGround = false;
        if (!hasJumpedRef.current) { hasJumpedRef.current = true; if (mountedRef.current) setHasJumped(true); }
      }
      jumpQRef.current = false;
      p.vy = Math.min(p.vy + getGrav() * dt, 1200);
      const oldY = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.x = Math.max(p.w/2, Math.min(gc!.width - p.w/2, p.x));
      p.onGround = false;
      // Block collision
      for (let i = platformsRef.current.length - 1; i >= 0; i--) {
        const b = platformsRef.current[i];
        if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);
        if (b.hit) continue;
        if (p.x + p.w*.4 <= b.x || p.x - p.w*.4 >= b.x + b.w) continue;
        if (!(p.vy > 0 && oldY <= b.y + 1 && p.y >= b.y)) continue;
        if (b.valid) {
          const bv = getBounceV();
          b.hit = true; p.y = b.y; p.vy = bv;
          p.onGround = false; p.launchT = 0.6;
          spawnParts(b.x+b.w/2, b.y, '#7ec8a0', 10);
          shakeTRef.current = 0.04; platformsRef.current = [];
          waitingForApexRef.current = true;
          break;
        } else if (p.hurtCD <= 0) {
          const bv = getBounceV() * 0.82;
          b.hit = true; b.flash = 0.5; p.y = b.y; p.vy = bv;
          p.onGround = false; p.hurtCD = 1.5; p.flashT = 1.5;
          livesRef.current--; shakeTRef.current = 0.1;
          spawnParts(p.x, p.y, '#e05c5c', 8); updateHUD();
          if (livesRef.current <= 0) { endGame(); return; }
          platformsRef.current = [];
          waitingForApexRef.current = true;
          break;
        } else {
          const bv = getBounceV() * 0.7;
          p.y = b.y; p.vy = bv; platformsRef.current = [];
          waitingForApexRef.current = true;
          break;
        }
      }
      // Spawn next row at apex (vy >= 0): position is always camera-relative so the
      // block appears at a consistent screen height regardless of bounce magnitude.
      if (waitingForApexRef.current && p.vy >= 0) {
        waitingForApexRef.current = false;
        if (platformsRef.current.length === 0) {
          platformsRef.current.push(...makeRow(camYRef.current + gc!.height * 0.82 - PH));
        }
      }
      // Ground
      if (p.y >= groundYRef.current) { p.y = groundYRef.current; p.vy = 0; p.onGround = true; }
      // Height
      const h = Math.max(0, Math.round((groundYRef.current - p.y) / 10));
      if (h > heightMRef.current) heightMRef.current = h;
      // Camera: only scrolls up, soft-follow so player visibly arcs upward.
      // camTarget per difficulty → easy 70% / medium 60% / hard 50% screen travel.
      const targetCam = p.y - gc!.height * DIFF[diffRef.current].camTarget;
      if (targetCam < camYRef.current) {
        const factor = 1 - Math.exp(-CAM_LERP * dt);
        camYRef.current += (targetCam - camYRef.current) * factor;
      }
      // Safety: player must never appear above 5% from top of screen
      camYRef.current = Math.min(camYRef.current, p.y - gc!.height * 0.05);
      // Death: fell off bottom
      if (p.y - camYRef.current > gc!.height + 20) { endGame(); return; }
      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 150 * dt;
        pt.life -= dt * 2; if (pt.life <= 0) particlesRef.current.splice(i, 1);
      }
      updateHUD(); updateSpeedBar();
    }

    const loop = (ts: number) => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, .05);
      lastTsRef.current = ts;
      update(dt); draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Launch game (called after countdown) ──
  const launch = useCallback((d: Difficulty) => {
    const gc = gcRef.current; if (!gc) return;
    gc.width  = gc.parentElement?.clientWidth  || 480;
    gc.height = gc.parentElement?.clientHeight || 400;
    groundYRef.current = gc.height * 0.88;
    diffRef.current = d;
    livesRef.current = 3; heightMRef.current = 0;
    platformsRef.current = []; particlesRef.current = [];
    shakeTRef.current = 0; hasJumpedRef.current = false; waitingForApexRef.current = false;
    setHasJumped(false);
    P.current = { x: gc.width/2, y: groundYRef.current, vx: 0, vy: 0, w: 26, h: 36, onGround: true, flashT: 0, hurtCD: 0, launchT: 0 };
    camYRef.current = groundYRef.current - gc.height * 0.85;
    // First row sitting on the ground
    platformsRef.current = buildRow(groundYRef.current - PH, gc.width, DIFF[d], ruleRef.current);
    if (hScoreEl.current)    hScoreEl.current.textContent = '0m';
    if (hLivesEl.current)    hLivesEl.current.innerHTML = '❤️❤️❤️';
    if (speedFillEl.current) { speedFillEl.current.style.width = '0%'; speedFillEl.current.style.background = '#7ec8a0'; }
    lastTsRef.current = performance.now();
    gStateRef.current = 'playing';
    setScreen('playing');
  }, []);

  // ── Start game flow ──
  const startGame = useCallback((d: Difficulty) => {
    const rule = buildRule(d);
    ruleRef.current = rule;
    setRuleDisp({ icon: rule.icon, text: rule.text, eg: rule.eg });
    let cd = 3; setCdNum(cd);
    setScreen('reveal');
    const t = setInterval(() => {
      cd--;
      if (cd <= 0) { clearInterval(t); if (mountedRef.current) launch(d); }
      else if (mountedRef.current) setCdNum(cd);
    }, 1000);
  }, [launch]);

  // ── Button handlers ──
  const kd = useCallback((k: 'l' | 'r') => { keysRef.current[k] = true; }, []);
  const ku = useCallback((k: 'l' | 'r') => { keysRef.current[k] = false; }, []);
  const doJump = useCallback(() => { if (!hasJumpedRef.current) jumpQRef.current = true; }, []);

  // ── Flavour texts ──
  const flavours = ['Gravity wins again.', 'The summit is still far.', 'The blocks have won… for now.', 'Keep climbing!', 'Every climber falls eventually.'];
  const endIco = endData.height > 80 ? '😤' : endData.height > 30 ? '😬' : '💥';
  const endTitle = endData.height > 100 ? 'So High!' : endData.height > 40 ? 'Nice Try!' : 'You Fell!';

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', maxHeight: '100vh', overflow: 'hidden', background: '#0a0a1a', fontFamily: "'Nunito', sans-serif", color: '#f0e8d8', userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Fonts */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cabin+Sketch:wght@400;700&family=Nunito:wght@700;800;900&display=swap" />

      {/* Star twinkle keyframes */}
      <style>{`
        @keyframes sc-tw { 0%,100%{opacity:.15} 50%{opacity:1} }
        .sc-star { position:absolute; background:white; border-radius:50%; animation:sc-tw linear infinite; }
        .sc-dbtn { padding:9px 16px; border-radius:10px; border:2px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05); color:#8899aa; font-family:'Nunito',sans-serif; font-weight:800; font-size:.78rem; cursor:pointer; transition:all .15s; text-transform:uppercase; letter-spacing:1px; }
        .sc-dbtn.sc-act { border-color:#f4c542; color:#f4c542; background:rgba(244,197,66,.08); }
        .sc-bigbtn { width:100%; max-width:300px; padding:17px; border-radius:16px; border:none; font-family:'Cabin Sketch',cursive; font-size:1.5rem; letter-spacing:1px; cursor:pointer; transition:all .1s; box-shadow:0 5px 0 rgba(0,0,0,.3); }
        .sc-bigbtn:active { transform:translateY(3px); box-shadow:0 2px 0 rgba(0,0,0,.3); }
        .sc-btn { flex:1; height:64px; border-radius:18px; border:2px solid rgba(255,255,255,.15); background:rgba(255,255,255,.07); color:#f0e8d8; font-family:'Cabin Sketch',cursive; font-size:1.6rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .1s; -webkit-tap-highlight-color:transparent; }
        .sc-btn:active { background:rgba(255,255,255,.18); transform:translateY(2px); }
        .sc-jbtn { flex:1.5 !important; background:rgba(126,200,160,.13) !important; border-color:rgba(126,200,160,.4) !important; color:#7ec8a0 !important; }
      `}</style>

      {/* Background gradient */}
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg,#0a0a1a 0%,#1a1a3e 40%,#0f3460 100%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Stars */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        {STARS.map(s => (
          <div key={s.id} className="sc-star" style={{ left: s.left, top: s.top, width: `${s.size}px`, height: `${s.size}px`, animationDuration: s.dur, animationDelay: s.del }} />
        ))}
      </div>

      {/* Mountain canvas */}
      <canvas ref={mtnRef} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', height: '55%', zIndex: 2, pointerEvents: 'none' }} />

      {/* Main layout (z-index 5) */}
      <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 480, height: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

        {/* HUD top */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px 0' }}>
          <div>
            <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '1.6rem', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,.6)' }}>Stack Climber</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', fontWeight: 800, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 4 }}>
              HEIGHT&nbsp;<span ref={hScoreEl} style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '1.1rem', color: '#f4c542' }}>0m</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <div ref={hLivesEl} style={{ display: 'flex', gap: 5 }}>❤️❤️❤️</div>
          </div>
        </div>

        {/* Rule banner */}
        <div style={{ flexShrink: 0, margin: '10px 16px 0', background: '#111827', border: '2px solid rgba(244,197,66,.5)', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: '1.4rem', flexShrink: 0, color: '#f4c542' }}>{ruleDisp.icon}</div>
          <div>
            <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '2px' }}>Current Rule</div>
            <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '1.15rem', color: '#f0e8d8', lineHeight: 1.2 }}>{ruleDisp.text || '—'}</div>
            {ruleDisp.eg && <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#7ec8a0', marginTop: 1 }}>e.g. {ruleDisp.eg}</div>}
          </div>
        </div>

        {/* Speed bar */}
        <div style={{ flexShrink: 0, margin: '6px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>Fall speed</div>
          <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div ref={speedFillEl} style={{ height: '100%', width: '0%', borderRadius: 99, background: '#7ec8a0', transition: 'width .3s, background .3s' }} />
          </div>
        </div>

        {/* Game canvas */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <canvas ref={gcRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>

        {/* Controls */}
        {screen === 'playing' && (
          <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '10px 16px 14px' }}>
            <button className="sc-btn"
              onMouseDown={() => kd('l')} onMouseUp={() => ku('l')} onMouseLeave={() => ku('l')}
              onTouchStart={e => { e.preventDefault(); kd('l'); }}
              onTouchEnd={e => { e.preventDefault(); ku('l'); }}>◀</button>
            {!hasJumped && (
              <button className="sc-btn sc-jbtn"
                onMouseDown={doJump}
                onTouchStart={e => { e.preventDefault(); doJump(); }}>▲ JUMP</button>
            )}
            <button className="sc-btn"
              onMouseDown={() => kd('r')} onMouseUp={() => ku('r')} onMouseLeave={() => ku('r')}
              onTouchStart={e => { e.preventDefault(); kd('r'); }}
              onTouchEnd={e => { e.preventDefault(); ku('r'); }}>▶</button>
          </div>
        )}
      </div>

      {/* ── Rule reveal overlay ── */}
      {screen === 'reveal' && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 600, background: '#060612', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '4px' }}>This round's rule</div>
          <div style={{ fontSize: '5rem', lineHeight: 1, animation: 'sc-rpop .5s cubic-bezier(.34,1.56,.64,1) both' }}>
            <style>{`@keyframes sc-rpop{from{transform:scale(.1);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            {ruleDisp.icon}
          </div>
          <div style={{ background: '#0d1a2e', border: '2px solid rgba(244,197,66,.5)', borderRadius: 24, padding: '28px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 380 }}>
            <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '2rem', color: '#f4c542', lineHeight: 1.3 }}>{ruleDisp.text}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#7ec8a0', letterSpacing: '2px' }}>e.g. {ruleDisp.eg}</div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'rgba(255,255,255,.7)', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
            <div>✅ <b style={{ color: '#f0e8d8' }}>Correct block</b> — launches you up!</div>
            <div>❌ <b style={{ color: '#f0e8d8' }}>Wrong block</b> — lose a life.</div>
          </div>
          <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '5.5rem', color: 'white', lineHeight: 1 }}>{cdNum}</div>
          <div style={{ fontSize: '.8rem', fontWeight: 900, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '3px' }}>Starting in…</div>
        </div>
      )}

      {/* ── Start overlay ── */}
      {screen === 'start' && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(6,6,18,.93)', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>🏔️</div>
          <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '2.8rem', color: '#f0e8d8', lineHeight: 1, textShadow: '0 4px 20px rgba(0,0,0,.5)' }}>Stack Climber</div>
          <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#8899aa', lineHeight: 1.8, maxWidth: 290 }}>
            Start on the ground and jump.<br />
            <b style={{ color: '#f0e8d8' }}>Only land on blocks that follow the rule.</b><br />
            Correct block launches you higher!<br />
            Wrong block = bounce off, lose a life.<br />
            Fall speed increases as you climb!
          </div>
          {/* Difficulty */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['easy','medium','hard'] as Difficulty[]).map(d => (
              <button key={d} className={`sc-dbtn${selDiff === d ? ' sc-act' : ''}`}
                onClick={() => setSelDiff(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          {/* Hint toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.82rem', fontWeight: 700, color: '#8899aa' }}>
            <input type="checkbox" checked={showHint} onChange={e => setShowHint(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#7ec8a0', cursor: 'pointer' }} />
            Show hint (green glow on valid blocks)
          </label>
          <button className="sc-bigbtn" style={{ background: '#f4c542', color: '#1a1a2e' }}
            onClick={() => startGame(selDiff)}>
            🧗 Start Climbing
          </button>
        </div>
      )}

      {/* ── Game over overlay ── */}
      {screen === 'dead' && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(6,6,18,.93)', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>{endIco}</div>
          <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '2.8rem', color: '#f0e8d8', lineHeight: 1 }}>{endTitle}</div>
          <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#8899aa', maxWidth: 270, lineHeight: 1.7 }}>
            {flavours[endData.height % flavours.length]}
          </div>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 300 }}>
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 800, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Height</div>
              <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '1.5rem', color: '#f0e8d8', lineHeight: 1 }}>{endData.height}m</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 800, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Best</div>
              <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '1.5rem', color: '#f0e8d8', lineHeight: 1 }}>
                {endData.best}m{endData.height >= endData.best && endData.height > 0 ? ' 🏆' : ''}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '10px 14px', gridColumn: '1/-1' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 800, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Rule</div>
              <div style={{ fontFamily: "'Cabin Sketch', cursive", fontSize: '1.4rem', color: '#f0e8d8', lineHeight: 1.1, marginTop: 2 }}>{endData.ruleIcon}</div>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#f0e8d8', marginTop: 4 }}>{endData.ruleText}</div>
            </div>
          </div>
          <button className="sc-bigbtn" style={{ background: '#7ec8a0', color: '#1a1a2e' }}
            onClick={() => startGame(selDiff)}>🧗 Climb Again</button>
          <button className="sc-dbtn" style={{ marginTop: 4 }}
            onClick={() => setScreen('start')}>Change Difficulty</button>
        </div>
      )}
    </div>
  );
};

export default StackClimber;
