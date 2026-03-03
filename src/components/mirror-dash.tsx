import React, { useEffect, useRef, useState, useCallback } from 'react';

/* ───────────────────────────────────────────────────────
   Mirror Dash – Two ships, two hands, neon synthwave
   ─────────────────────────────────────────────────────── */

// ── Palette ──
const C = {
  bg: '#06040f',
  leftBg: '#0a0518',
  rightBg: '#180510',
  leftNeon: '#7b2fff',
  leftNeonLight: '#b97eff',
  rightNeon: '#ff2f7b',
  rightNeonLight: '#ff7eb9',
  safeLeft: '#2fffb9',
  safeRight: '#fff92f',
  dangerLeft: '#ff2f7b',
  dangerRight: '#7b2fff',
  heart: '#ff9ecc',
  text: '#f0eaff',
  muted: '#554466',
};

const W = 520;
const H = 420;
const HALF = W / 2;
const LANES = 3;
const LANE_W = HALF / LANES;
const SHIP_SIZE = 18;
const OBS_W = LANE_W - 14;
const OBS_H = 30;
const HEART_SIZE = 16;

interface Obstacle {
  side: 'left' | 'right';
  lane: number;          // 0-2
  y: number;
  danger: boolean;
  scored: boolean;
}

interface Heart {
  side: 'left' | 'right';
  lane: number;
  y: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

type GameState = 'start' | 'playing' | 'over';

const MirrorDash: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());

  // ── game state refs ──
  const stateRef = useRef<GameState>('start');
  const [uiState, setUiState] = useState<GameState>('start');

  const scoreRef = useRef(0);
  const [uiScore, setUiScore] = useState(0);
  const bestRef = useRef(0);
  const [uiBest, setUiBest] = useState(0);

  const livesRef = useRef(3);
  const [uiLives, setUiLives] = useState(3);

  const leftLaneRef = useRef(1);
  const rightLaneRef = useRef(1);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const heartsRef = useRef<Heart[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const speedRef = useRef(1.2);
  const spawnTimerRef = useRef(0);
  const spawnIntervalRef = useRef(220);
  const invincLeftRef = useRef(0);
  const invincRightRef = useRef(0);
  const flashLeftRef = useRef(0);
  const flashRightRef = useRef(0);
  const heartTimerRef = useRef(0);
  const starsRef = useRef<Star[]>([]);
  const gridOffsetRef = useRef(0);

  // ── helpers ──
  const laneX = (side: 'left' | 'right', lane: number) => {
    const base = side === 'left' ? 0 : HALF;
    return base + lane * LANE_W + LANE_W / 2;
  };

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 30 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }, []);

  const initStars = useCallback(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.2,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;
  }, []);

  // ── reset ──
  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    leftLaneRef.current = 1;
    rightLaneRef.current = 1;
    obstaclesRef.current = [];
    heartsRef.current = [];
    particlesRef.current = [];
    speedRef.current = 1.2;
    spawnTimerRef.current = 0;
    spawnIntervalRef.current = 220;
    invincLeftRef.current = 0;
    invincRightRef.current = 0;
    flashLeftRef.current = 0;
    flashRightRef.current = 0;
    heartTimerRef.current = 600 + Math.random() * 300;
    gridOffsetRef.current = 0;
    setUiScore(0);
    setUiLives(3);
  }, []);

  // ── move ship ──
  const moveShip = useCallback((side: 'left' | 'right', dir: -1 | 1) => {
    if (stateRef.current !== 'playing') return;
    const ref = side === 'left' ? leftLaneRef : rightLaneRef;
    ref.current = Math.max(0, Math.min(LANES - 1, ref.current + dir));
  }, []);

  // ── spawn obstacles ──
  const spawnObstacles = useCallback(() => {
    let dangerLane = Math.floor(Math.random() * LANES);

    // Check solvability: if an obstacle would reach bottom at same time as another
    // Force same dangerLane pattern
    const existing = obstaclesRef.current;
    const nearBottom = existing.filter((o: Obstacle) => o.y > H - 120 && o.y < H - 40);
    if (nearBottom.length > 0) {
      const leftDanger = nearBottom.find((o: Obstacle) => o.side === 'left' && o.danger);
      if (leftDanger) dangerLane = leftDanger.lane;
    }

    const finalMirrorSafe = 2 - dangerLane;

    // LEFT side: one danger lane, two safe
    for (let l = 0; l < LANES; l++) {
      obstaclesRef.current.push({
        side: 'left',
        lane: l,
        y: -OBS_H,
        danger: l === dangerLane,
        scored: false,
      });
    }
    // RIGHT side: mirror – dangerLane's mirror is safe, others are danger
    for (let l = 0; l < LANES; l++) {
      obstaclesRef.current.push({
        side: 'right',
        lane: l,
        y: -OBS_H,
        danger: l !== finalMirrorSafe,
        scored: false,
      });
    }
  }, []);

  // ── draw ──
  const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
    const state = stateRef.current;

    // ── background ──
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // side panels
    ctx.fillStyle = C.leftBg;
    ctx.fillRect(0, 0, HALF, H);
    ctx.fillStyle = C.rightBg;
    ctx.fillRect(HALF, 0, HALF, H);

    // ── stars ──
    starsRef.current.forEach(s => {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(frame * s.twinkleSpeed + s.twinkleOffset));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,234,255,${alpha})`;
      ctx.fill();
    });

    // ── scrolling grid lines ──
    const gridY = gridOffsetRef.current;
    ctx.strokeStyle = 'rgba(85,68,102,0.12)';
    ctx.lineWidth = 1;
    for (let y = gridY % 40; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // ── dot grid overlay ──
    ctx.fillStyle = 'rgba(85,68,102,0.06)';
    for (let x = 8; x < W; x += 20) {
      for (let y = 8; y < H; y += 20) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // ── center divider ──
    const grad = ctx.createLinearGradient(HALF - 2, 0, HALF + 2, 0);
    grad.addColorStop(0, C.leftNeon);
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, C.rightNeon);
    ctx.fillStyle = grad;
    ctx.fillRect(HALF - 1, 0, 2, H);
    // glow
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillRect(HALF - 0.5, 0, 1, H);
    ctx.shadowBlur = 0;

    // ── lane dividers (dashed, low opacity) ──
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(85,68,102,0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i < LANES; i++) {
      const lx = i * LANE_W;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
      const rx = HALF + i * LANE_W;
      ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, H); ctx.stroke();
    }
    ctx.setLineDash([]);

    if (state === 'start') {
      // start screen drawn in overlay, just show background
      return;
    }

    // ── world labels ──
    ctx.font = '700 10px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(185,126,255,0.25)';
    ctx.textAlign = 'center';
    ctx.fillText('WORLD A', HALF / 2, 18);
    ctx.fillStyle = 'rgba(255,126,185,0.25)';
    ctx.fillText('WORLD B', HALF + HALF / 2, 18);

    // ── flash overlay on hit ──
    if (flashLeftRef.current > 0) {
      ctx.fillStyle = `rgba(255,47,123,${flashLeftRef.current * 0.08})`;
      ctx.fillRect(0, 0, HALF, H);
      flashLeftRef.current--;
    }
    if (flashRightRef.current > 0) {
      ctx.fillStyle = `rgba(123,47,255,${flashRightRef.current * 0.08})`;
      ctx.fillRect(HALF, 0, HALF, H);
      flashRightRef.current--;
    }

    // ── obstacles ──
    obstaclesRef.current.forEach(o => {
      const x = laneX(o.side, o.lane);
      const drawX = x - OBS_W / 2;
      const drawY = o.y;

      if (o.danger) {
        // filled danger block
        const dangerColor = o.side === 'left' ? C.dangerLeft : C.dangerRight;
        ctx.shadowColor = dangerColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = dangerColor;
        roundRect(ctx, drawX, drawY, OBS_W, OBS_H, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // safe gap outline
        const safeColor = o.side === 'left' ? C.safeLeft : C.safeRight;
        ctx.strokeStyle = safeColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.35;
        roundRect(ctx, drawX, drawY, OBS_W, OBS_H, 6);
        ctx.stroke();
        // small arrow
        ctx.fillStyle = safeColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('\u25BC', x, drawY - 3);
        ctx.globalAlpha = 1;
      }
    });

    // ── hearts ──
    heartsRef.current.forEach(h => {
      if (h.collected) return;
      const x = laneX(h.side, h.lane);
      ctx.font = `${HEART_SIZE}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2764\uFE0F', x, h.y);
    });

    // ── ships ──
    const drawShip = (side: 'left' | 'right', lane: number, invinc: number) => {
      const x = laneX(side, lane);
      const y = H - 40;
      const color = side === 'left' ? C.leftNeon : C.rightNeon;
      const lightColor = side === 'left' ? C.leftNeonLight : C.rightNeonLight;

      // blink during invincibility
      if (invinc > 0 && Math.floor(frame / 4) % 2 === 0) return;

      // engine trail
      const trailGrad = ctx.createLinearGradient(x, y + 8, x, y + 28);
      trailGrad.addColorStop(0, lightColor);
      trailGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 8);
      ctx.lineTo(x + 5, y + 8);
      ctx.lineTo(x + 2, y + 28);
      ctx.lineTo(x - 2, y + 28);
      ctx.closePath();
      ctx.fill();

      // chevron ship
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(x, y - SHIP_SIZE);
      ctx.lineTo(x - SHIP_SIZE * 0.6, y + 4);
      ctx.lineTo(x, y - 2);
      ctx.lineTo(x + SHIP_SIZE * 0.6, y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    drawShip('left', leftLaneRef.current, invincLeftRef.current);
    drawShip('right', rightLaneRef.current, invincRightRef.current);

    // ── particles ──
    particlesRef.current.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }, []);

  // ── update ──
  const update = useCallback(() => {
    if (stateRef.current !== 'playing') return;

    const frame = frameRef.current;

    // ── process keyboard ──
    const keys = keysRef.current;
    // Left ship: A/D
    if (keys.has('a') || keys.has('A')) { moveShip('left', -1); keys.delete('a'); keys.delete('A'); }
    if (keys.has('d') || keys.has('D')) { moveShip('left', 1); keys.delete('d'); keys.delete('D'); }
    // Right ship: Arrow keys
    if (keys.has('ArrowLeft')) { moveShip('right', -1); keys.delete('ArrowLeft'); }
    if (keys.has('ArrowRight')) { moveShip('right', 1); keys.delete('ArrowRight'); }

    // ── speed progression ──
    if (frame % 600 === 0 && frame > 0) {
      speedRef.current = Math.min(4.5, speedRef.current + 0.25);
    }
    if (frame % 300 === 0 && frame > 0) {
      spawnIntervalRef.current = Math.max(80, spawnIntervalRef.current - 10);
    }

    // ── spawn obstacles ──
    spawnTimerRef.current--;
    if (spawnTimerRef.current <= 0) {
      spawnObstacles();
      spawnTimerRef.current = spawnIntervalRef.current;
    }

    // ── move obstacles ──
    const speed = speedRef.current;
    obstaclesRef.current.forEach(o => { o.y += speed; });

    // ── scroll grid ──
    gridOffsetRef.current += speed * 0.5;

    // ── collision check ──
    const shipY = H - 40;
    const checkCollision = (side: 'left' | 'right', lane: number, invincRef: React.MutableRefObject<number>) => {
      if (invincRef.current > 0) { invincRef.current--; return; }
      for (const o of obstaclesRef.current) {
        if (o.side !== side || !o.danger) continue;
        if (o.lane === lane && o.y + OBS_H > shipY - SHIP_SIZE && o.y < shipY + 4) {
          // hit!
          livesRef.current--;
          setUiLives(livesRef.current);
          invincRef.current = 90;
          if (side === 'left') flashLeftRef.current = 12;
          else flashRightRef.current = 12;
          const px = laneX(side, lane);
          spawnParticles(px, shipY, side === 'left' ? C.dangerLeft : C.dangerRight, 18);
          if (livesRef.current <= 0) {
            gameOver();
            return;
          }
          break;
        }
      }
    };
    checkCollision('left', leftLaneRef.current, invincLeftRef);
    checkCollision('right', rightLaneRef.current, invincRightRef);

    // ── score cleared obstacles ──
    obstaclesRef.current.forEach(o => {
      if (o.y > H + 10 && o.danger && !o.scored) {
        o.scored = true;
        scoreRef.current += 10;
      }
    });
    // +1 per frame survived
    scoreRef.current += 1;
    setUiScore(scoreRef.current);

    // ── remove off-screen obstacles ──
    obstaclesRef.current = obstaclesRef.current.filter(o => o.y < H + 60);

    // ── heart spawning ──
    heartTimerRef.current--;
    if (heartTimerRef.current <= 0 && livesRef.current < 3) {
      // try to find a safe spot
      let spawned = false;
      for (let attempt = 0; attempt < 8; attempt++) {
        const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
        const lane = Math.floor(Math.random() * LANES);
        // Check no danger block is nearby
        const blocked = obstaclesRef.current.some(
          o => o.side === side && o.lane === lane && o.danger && o.y < 60 && o.y > -40
        );
        if (!blocked) {
          heartsRef.current.push({ side, lane, y: -HEART_SIZE, collected: false });
          spawned = true;
          break;
        }
      }
      if (!spawned) {
        heartsRef.current.push({ side: 'left', lane: 1, y: -HEART_SIZE, collected: false });
      }
      heartTimerRef.current = 600 + Math.random() * 300;
    }

    // ── move hearts ──
    heartsRef.current.forEach(h => { h.y += speed * 0.8; });

    // ── collect hearts ──
    heartsRef.current.forEach(h => {
      if (h.collected) return;
      const side = h.side;
      const playerLane = side === 'left' ? leftLaneRef.current : rightLaneRef.current;
      if (h.lane === playerLane && h.y + HEART_SIZE > shipY - SHIP_SIZE && h.y < shipY + 4) {
        h.collected = true;
        if (livesRef.current < 3) {
          livesRef.current++;
          setUiLives(livesRef.current);
        }
        const px = laneX(side, h.lane);
        spawnParticles(px, shipY, C.heart, 14);
      }
    });
    heartsRef.current = heartsRef.current.filter(h => !h.collected && h.y < H + 30);

    // ── update particles ──
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  }, [moveShip, spawnObstacles, spawnParticles]);

  const gameOver = useCallback(() => {
    stateRef.current = 'over';
    setUiState('over');
    const best = bestRef.current;
    if (scoreRef.current > best) {
      localStorage.setItem('mirror-dash-best', String(scoreRef.current));
      bestRef.current = scoreRef.current;
      setUiBest(scoreRef.current);
    } else {
      setUiBest(best);
    }
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    stateRef.current = 'playing';
    setUiState('playing');
    frameRef.current = 0;
  }, [resetGame]);

  // ── game loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initStars();
    const storedBest = localStorage.getItem('mirror-dash-best');
    const bestVal = storedBest ? parseInt(storedBest, 10) : 0;
    bestRef.current = bestVal;
    setUiBest(bestVal);

    let raf: number;
    const loop = () => {
      frameRef.current++;
      update();
      draw(ctx, frameRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [draw, update, initStars]);

  // ── keyboard ──
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (['a', 'A', 'd', 'D', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (stateRef.current === 'start') startGame();
        else if (stateRef.current === 'over') startGame();
      }
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [startGame]);

  // ── button handlers ──
  const handleLeftLeft = useCallback(() => moveShip('left', -1), [moveShip]);
  const handleLeftRight = useCallback(() => moveShip('left', 1), [moveShip]);
  const handleRightLeft = useCallback(() => moveShip('right', -1), [moveShip]);
  const handleRightRight = useCallback(() => moveShip('right', 1), [moveShip]);

  const livesDisplay = Array.from({ length: 3 }, (_, i) => i < uiLives ? '\u2764\uFE0F' : '\uD83D\uDDA4');

  return (
    <div
      className="md-root"
      style={{
        background: C.bg,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;700&display=swap"
        rel="stylesheet"
      />

      {/* HUD */}
      <div
        style={{
          width: W,
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          padding: '0 4px',
        }}
      >
        <div style={{ fontSize: 20, letterSpacing: 2 }}>
          {livesDisplay.map((h, i) => <span key={i}>{h}</span>)}
        </div>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 900,
            fontSize: 18,
            color: C.text,
            letterSpacing: 1,
          }}
        >
          {uiScore}
        </div>
      </div>

      {/* Canvas container */}
      <div style={{ position: 'relative', width: W, maxWidth: '100%' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: W,
            borderRadius: 16,
            border: `1px solid ${C.muted}`,
          }}
        />

        {/* Start Overlay */}
        {uiState === 'start' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(6,4,15,0.88)',
              borderRadius: 16,
              zIndex: 10,
            }}
          >
            <h1
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 900,
                fontSize: 36,
                background: `linear-gradient(90deg, ${C.leftNeon}, ${C.rightNeon})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 4,
              }}
            >
              MIRROR DASH
            </h1>
            <p
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 500,
                fontSize: 16,
                color: C.muted,
                marginBottom: 20,
              }}
            >
              Two ships. Two hands.
            </p>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 500,
                fontSize: 13,
                color: C.text,
                textAlign: 'center',
                lineHeight: 1.8,
                marginBottom: 24,
                opacity: 0.85,
              }}
            >
              <span style={{ color: C.leftNeonLight }}>A / D</span> controls the left ship.<br />
              <span style={{ color: C.rightNeonLight }}>&larr; / &rarr;</span> controls the right ship.<br />
              Dodge both sides — at the same time.
            </div>
            <button
              onClick={startGame}
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                padding: '12px 48px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.leftNeon}, ${C.rightNeon})`,
                color: '#fff',
                letterSpacing: 3,
                boxShadow: `0 0 24px ${C.leftNeon}55, 0 0 24px ${C.rightNeon}55`,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              PLAY
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {uiState === 'over' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(6,4,15,0.92)',
              borderRadius: 16,
              zIndex: 10,
            }}
          >
            <h2
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 900,
                fontSize: 30,
                color: C.rightNeon,
                marginBottom: 16,
                textShadow: `0 0 20px ${C.rightNeon}88`,
              }}
            >
              GAME OVER
            </h2>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: C.text,
                marginBottom: 6,
              }}
            >
              {uiScore}
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: C.muted,
                marginBottom: 24,
              }}
            >
              BEST: {uiBest}
            </div>
            <button
              onClick={startGame}
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                padding: '12px 44px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.leftNeon}, ${C.rightNeon})`,
                color: '#fff',
                letterSpacing: 3,
                boxShadow: `0 0 24px ${C.leftNeon}55, 0 0 24px ${C.rightNeon}55`,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              RETRY
            </button>
          </div>
        )}
      </div>

      {/* Touch Buttons */}
      <div
        style={{
          width: W,
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          marginTop: 12,
        }}
      >
        {/* Left ship controls */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onPointerDown={handleLeftLeft}
            style={btnStyle(C.leftNeon, C.leftNeonLight)}
            aria-label="Left ship move left"
          >
            &#9664;
          </button>
          <button
            onPointerDown={handleLeftRight}
            style={btnStyle(C.leftNeon, C.leftNeonLight)}
            aria-label="Left ship move right"
          >
            &#9654;
          </button>
        </div>
        {/* Label */}
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            fontSize: 10,
            color: C.muted,
            display: 'flex',
            alignItems: 'center',
            letterSpacing: 2,
          }}
        >
          SHIP
        </div>
        {/* Right ship controls */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onPointerDown={handleRightLeft}
            style={btnStyle(C.rightNeon, C.rightNeonLight)}
            aria-label="Right ship move left"
          >
            &#9664;
          </button>
          <button
            onPointerDown={handleRightRight}
            style={btnStyle(C.rightNeon, C.rightNeonLight)}
            aria-label="Right ship move right"
          >
            &#9654;
          </button>
        </div>
      </div>

      {/* Controls hint */}
      <div
        style={{
          marginTop: 10,
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 500,
          fontSize: 12,
          color: C.muted,
          textAlign: 'center',
          letterSpacing: 1,
        }}
      >
        <span style={{ color: C.leftNeonLight }}>A / D</span>
        {' '}LEFT SHIP{'  '}|{'  '}
        <span style={{ color: C.rightNeonLight }}>&larr; / &rarr;</span>
        {' '}RIGHT SHIP
      </div>
    </div>
  );
};

// ── button style helper ──
function btnStyle(main: string, light: string): React.CSSProperties {
  return {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    width: 48,
    height: 48,
    borderRadius: 10,
    border: `2px solid ${main}`,
    background: 'transparent',
    color: light,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, box-shadow 0.15s',
    boxShadow: `0 0 10px ${main}33`,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
}

// ── canvas rounded rect ──
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default MirrorDash;
