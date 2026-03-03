import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';

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
const MID = W / 2;
const LANES = 3;
const LANE_W = (MID - 20) / LANES;

type GameState = 'idle' | 'playing' | 'over';

interface Obstacle {
  y: number;
  dangerLane: number;
  type: string;
}

interface Pickup {
  y: number;
  side: 'left' | 'right';
  lane: number;
}

interface BlindPowerup {
  y: number;
  side: 'left' | 'right';
  lane: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const MirrorDash: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animIdRef = useRef<number>(0);

  // Game state refs
  const stateRef = useRef<GameState>('idle');
  const [uiState, setUiState] = useState<GameState>('idle');
  const scoreRef = useRef(0);
  const [uiScore, setUiScore] = useState(0);
  const hiScoreRef = useRef(0);
  const [uiHiScore, setUiHiScore] = useState(0);
  const livesRef = useRef(3);
  const [uiLives, setUiLives] = useState(3);
  const frameRef = useRef(0);
  const speedRef = useRef(3);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const flashTimerRef = useRef(0);
  const flashSideRef = useRef<'left' | 'right' | null>(null);
  const invincibleRef = useRef(0);
  const playerLRef = useRef({ lane: 1 });
  const playerRRef = useRef({ lane: 1 });

  // Blind power-up: hides safe-gap arrows temporarily
  const blindPowerupsRef = useRef<BlindPowerup[]>([]);
  const blindTimerRef = useRef(0);
  const [uiBlind, setUiBlind] = useState(false);

  // Floating button hide
  const { updateGameState } = useGameState();

  // Hide floating buttons whenever this component is mounted (including start screen)
  useEffect(() => {
    updateGameState('mirror-dash', true);
    return () => updateGameState('mirror-dash', false);
  }, [updateGameState]);

  // Load hi score
  useEffect(() => {
    const stored = localStorage.getItem('mirror-dash-best');
    if (stored) {
      const val = parseInt(stored, 10);
      hiScoreRef.current = val;
      setUiHiScore(val);
    }
  }, []);

  // Helpers
  const laneX = useCallback((side: 'left' | 'right', lane: number) => {
    const offset = side === 'left' ? 10 : MID + 10;
    return offset + lane * LANE_W + LANE_W / 2;
  }, []);

  const playerY = useCallback(() => H - 70, []);

  const moveShip = useCallback((side: 'left' | 'right', dir: -1 | 1) => {
    if (stateRef.current !== 'playing') return;
    if (side === 'left') {
      playerLRef.current.lane = Math.max(0, Math.min(LANES - 1, playerLRef.current.lane + dir));
    } else {
      playerRRef.current.lane = Math.max(0, Math.min(LANES - 1, playerRRef.current.lane + dir));
    }
  }, []);

  // Spawn obstacle
  const spawnObstacle = useCallback(() => {
    const py = playerY();
    const speed = speedRef.current;
    const dangerouslyClose = obstaclesRef.current.filter(o => {
      const existingDistToPlayer = py - o.y;
      const framesUntilHit = existingDistToPlayer / speed;
      const newYAtSameFrame = -30 + framesUntilHit * speed;
      return Math.abs(newYAtSameFrame - py) < 60;
    });

    let dangerLane: number;
    if (dangerouslyClose.length > 0) {
      dangerLane = dangerouslyClose[0].dangerLane;
    } else {
      dangerLane = Math.floor(Math.random() * LANES);
    }

    obstaclesRef.current.push({ y: -30, dangerLane, type: 'split' });
  }, [playerY]);

  // Spawn pickup
  const spawnPickup = useCallback(() => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
      const lane = Math.floor(Math.random() * LANES);
      const blocked = obstaclesRef.current.some(o => {
        if (Math.abs(o.y - (-20)) > 60) return false;
        if (side === 'left' && lane === o.dangerLane) return true;
        if (side === 'right' && lane !== (2 - o.dangerLane)) return true;
        return false;
      });
      if (!blocked) {
        pickupsRef.current.push({ y: -20, side, lane });
        return;
      }
    }
  }, []);

  // Spawn blind power-up
  const spawnBlindPowerup = useCallback(() => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
      const lane = Math.floor(Math.random() * LANES);
      const blocked = obstaclesRef.current.some(o => {
        if (Math.abs(o.y - (-20)) > 60) return false;
        if (side === 'left' && lane === o.dangerLane) return true;
        if (side === 'right' && lane !== (2 - o.dangerLane)) return true;
        return false;
      });
      if (!blocked) {
        blindPowerupsRef.current.push({ y: -20, side, lane });
        return;
      }
    }
  }, []);

  // Hit handler
  const hit = useCallback((side: 'left' | 'right') => {
    livesRef.current--;
    invincibleRef.current = 90;
    flashTimerRef.current = 20;
    flashSideRef.current = side;
    // Spawn particles
    const px = side === 'left'
      ? laneX('left', playerLRef.current.lane)
      : laneX('right', playerRRef.current.lane);
    const py = playerY();
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x: px, y: py,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 30,
        color: side === 'left' ? C.dangerLeft : C.dangerRight,
      });
    }
    setUiLives(livesRef.current);
    if (livesRef.current <= 0) {
      stateRef.current = 'over';
      setUiState('over');
      const sc = scoreRef.current;
      if (sc > hiScoreRef.current) {
        hiScoreRef.current = sc;
        localStorage.setItem('mirror-dash-best', String(sc));
      }
      setUiHiScore(hiScoreRef.current);
    }
  }, [laneX, playerY]);

  // Update
  const update = useCallback(() => {
    const frame = frameRef.current;
    frameRef.current++;

    // Speed ramp
    speedRef.current = 1.2 + Math.min(3.3, Math.floor(frame / 600) * 0.25);
    if (invincibleRef.current > 0) invincibleRef.current--;

    const speed = speedRef.current;

    // Spawn rate
    const spawnRate = Math.max(80, 220 - Math.floor(frame / 300) * 8);
    if (frame % spawnRate === 0) spawnObstacle();

    // Heart pickup spawn
    if (livesRef.current < 3 && frame % Math.floor(600 + Math.random() * 300) === 0) {
      spawnPickup();
    }

    // Blind power-up spawn (~every 800-1200 frames, only when not already blinded)
    if (blindTimerRef.current <= 0 && frame > 300 && frame % Math.floor(800 + Math.random() * 400) === 0) {
      spawnBlindPowerup();
    }

    // Tick blind timer
    if (blindTimerRef.current > 0) {
      blindTimerRef.current--;
      if (blindTimerRef.current <= 0) setUiBlind(false);
    }

    // Move & collect blind power-ups
    for (let i = blindPowerupsRef.current.length - 1; i >= 0; i--) {
      blindPowerupsRef.current[i].y += speed;
      if (blindPowerupsRef.current[i].y > H + 20) {
        blindPowerupsRef.current.splice(i, 1);
        continue;
      }
      const bp = blindPowerupsRef.current[i];
      if (bp.y > py - 22 && bp.y < py + 22) {
        const bpX = laneX(bp.side, bp.lane);
        const shipX = bp.side === 'left'
          ? laneX('left', playerLRef.current.lane)
          : laneX('right', playerRRef.current.lane);
        if (Math.abs(bpX - shipX) < LANE_W * 0.7) {
          blindTimerRef.current = 300; // ~5 seconds at 60fps
          setUiBlind(true);
          // Purple/red particle burst
          for (let j = 0; j < 16; j++) {
            particlesRef.current.push({
              x: bpX, y: py,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              life: 40,
              color: Math.random() < 0.5 ? '#7b2fff' : '#ff2f7b',
            });
          }
          blindPowerupsRef.current.splice(i, 1);
        }
      }
    }

    // Move & collect pickups
    const py = playerY();
    for (let i = pickupsRef.current.length - 1; i >= 0; i--) {
      pickupsRef.current[i].y += speed;
      if (pickupsRef.current[i].y > H + 20) {
        pickupsRef.current.splice(i, 1);
        continue;
      }
      const pk = pickupsRef.current[i];
      if (pk.y > py - 22 && pk.y < py + 22) {
        const pkX = laneX(pk.side, pk.lane);
        const shipX = pk.side === 'left'
          ? laneX('left', playerLRef.current.lane)
          : laneX('right', playerRRef.current.lane);
        if (Math.abs(pkX - shipX) < LANE_W * 0.7) {
          if (livesRef.current < 3) {
            livesRef.current++;
            setUiLives(livesRef.current);
            for (let j = 0; j < 14; j++) {
              particlesRef.current.push({
                x: pkX, y: py,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 35,
                color: '#ff9ecc',
              });
            }
          }
          pickupsRef.current.splice(i, 1);
        }
      }
    }

    // Move obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      obstaclesRef.current[i].y += speed;
      if (obstaclesRef.current[i].y > H + 40) {
        obstaclesRef.current.splice(i, 1);
        scoreRef.current += 10;
      }
    }

    // Collision
    if (invincibleRef.current === 0) {
      for (const obs of obstaclesRef.current) {
        if (obs.y > py - 20 && obs.y < py + 20) {
          if (playerLRef.current.lane === obs.dangerLane) {
            hit('left');
            break;
          }
          const safeLaneR = 2 - obs.dangerLane;
          if (playerRRef.current.lane !== safeLaneR) {
            hit('right');
            break;
          }
        }
      }
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    if (flashTimerRef.current > 0) flashTimerRef.current--;
    scoreRef.current++;
    setUiScore(scoreRef.current);
  }, [spawnObstacle, spawnPickup, spawnBlindPowerup, playerY, laneX, hit]);

  // roundRect helper on canvas
  const roundRect = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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
  }, []);

  // Draw
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const frame = frameRef.current;
    const speed = speedRef.current;
    ctx.clearRect(0, 0, W, H);

    // Backgrounds
    ctx.fillStyle = C.leftBg;
    ctx.fillRect(0, 0, MID, H);
    ctx.fillStyle = C.rightBg;
    ctx.fillRect(MID, 0, MID, H);

    // Flash
    if (flashTimerRef.current > 0) {
      const alpha = flashTimerRef.current / 20 * 0.35;
      if (flashSideRef.current === 'left') {
        ctx.fillStyle = `rgba(255,47,123,${alpha})`;
        ctx.fillRect(0, 0, MID, H);
      } else {
        ctx.fillStyle = `rgba(123,47,255,${alpha})`;
        ctx.fillRect(MID, 0, MID, H);
      }
    }

    // Center mirror line
    ctx.save();
    const grad = ctx.createLinearGradient(MID - 1, 0, MID + 1, H);
    grad.addColorStop(0, 'rgba(123,47,255,0.8)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    grad.addColorStop(1, 'rgba(255,47,123,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(MID - 1, 0, 2, H);
    ctx.restore();

    // Lane dividers
    ctx.save();
    ctx.strokeStyle = 'rgba(123,47,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 16]);
    for (let l = 1; l < LANES; l++) {
      const x = 10 + l * LANE_W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,47,123,0.12)';
    for (let l = 1; l < LANES; l++) {
      const x = MID + 10 + l * LANE_W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Ground lines
    ctx.save();
    const lineY = (frame * speed) % 40;
    for (let y = lineY; y < H; y += 40) {
      const alpha = 0.04 + (y / H) * 0.06;
      ctx.strokeStyle = `rgba(123,47,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MID, y);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,47,123,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(MID, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // Labels
    ctx.save();
    ctx.font = '700 11px Rajdhani, sans-serif';
    ctx.fillStyle = 'rgba(123,47,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('WORLD A', MID / 2, 20);
    ctx.fillStyle = 'rgba(255,47,123,0.4)';
    ctx.fillText('WORLD B', MID + MID / 2, 20);
    ctx.restore();

    // Obstacles
    const obsW = LANE_W - 10;
    const obsH = 18;
    const isBlind = blindTimerRef.current > 0;
    for (const obs of obstaclesRef.current) {
      const y = obs.y;
      // Left side
      for (let l = 0; l < LANES; l++) {
        const x = laneX('left', l);
        if (l === obs.dangerLane) {
          ctx.save();
          ctx.shadowColor = C.dangerLeft;
          ctx.shadowBlur = 12;
          ctx.fillStyle = C.dangerLeft;
          ctx.beginPath();
          roundRect(ctx, x - obsW / 2, y - obsH / 2, obsW, obsH, 4);
          ctx.fill();
          ctx.restore();
        } else if (!isBlind) {
          ctx.save();
          ctx.strokeStyle = C.safeLeft;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.75;
          ctx.shadowColor = C.safeLeft;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          roundRect(ctx, x - obsW / 2, y - obsH / 2, obsW, obsH, 4);
          ctx.stroke();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = C.safeLeft;
          ctx.font = 'bold 10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u25BC', x, y - obsH / 2 - 4);
          ctx.restore();
        }
      }
      // Right side
      const safeLaneR = 2 - obs.dangerLane;
      for (let l = 0; l < LANES; l++) {
        const x = laneX('right', l);
        if (l === safeLaneR) {
          if (!isBlind) {
            ctx.save();
            ctx.strokeStyle = C.safeRight;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.75;
            ctx.shadowColor = C.safeRight;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            roundRect(ctx, x - obsW / 2, y - obsH / 2, obsW, obsH, 4);
            ctx.stroke();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = C.safeRight;
            ctx.font = 'bold 10px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('\u25BC', x, y - obsH / 2 - 4);
            ctx.restore();
          }
        } else {
          ctx.save();
          ctx.shadowColor = C.dangerRight;
          ctx.shadowBlur = 12;
          ctx.fillStyle = C.dangerRight;
          ctx.beginPath();
          roundRect(ctx, x - obsW / 2, y - obsH / 2, obsW, obsH, 4);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Pickups
    for (const pk of pickupsRef.current) {
      const x = laneX(pk.side, pk.lane);
      const y = pk.y;
      const pulse = 0.7 + 0.3 * Math.sin(frame * 0.15);
      ctx.save();
      ctx.shadowColor = '#ff6eb4';
      ctx.shadowBlur = 16 * pulse;
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = pulse;
      ctx.fillText('\u2764\uFE0F', x, y);
      ctx.beginPath();
      ctx.arc(x, y, 18 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,110,180,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Blind power-ups
    for (const bp of blindPowerupsRef.current) {
      const x = laneX(bp.side, bp.lane);
      const y = bp.y;
      const pulse = 0.6 + 0.4 * Math.sin(frame * 0.12);
      ctx.save();
      // Glowing eye icon
      ctx.shadowColor = '#aa44ff';
      ctx.shadowBlur = 14 * pulse;
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = pulse;
      ctx.fillText('\uD83D\uDC41\uFE0F', x, y);
      // Strikethrough line across the eye
      ctx.strokeStyle = '#ff2f7b';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8 * pulse;
      ctx.beginPath();
      ctx.moveTo(x - 10, y + 6);
      ctx.lineTo(x + 10, y - 6);
      ctx.stroke();
      ctx.restore();
    }

    // Blind effect HUD indicator on canvas
    if (isBlind) {
      const blinkAlpha = 0.5 + 0.3 * Math.sin(frame * 0.1);
      ctx.save();
      ctx.font = '700 11px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(170,68,255,${blinkAlpha})`;
      ctx.fillText('ARROWS HIDDEN', W / 2, H - 10);
      ctx.restore();
    }

    // Players
    const drawPlayer = (side: 'left' | 'right', lane: number, damaged: boolean) => {
      const x = laneX(side, lane);
      const y = playerY();
      const color = side === 'left' ? C.leftNeonLight : C.rightNeonLight;

      if (damaged && Math.floor(frame / 6) % 2 === 0) return;

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;

      // Body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x - 12, y + 10);
      ctx.lineTo(x, y + 4);
      ctx.lineTo(x + 12, y + 10);
      ctx.closePath();
      ctx.fill();

      // Engine trail
      const trailGrad = ctx.createLinearGradient(x, y + 4, x, y + 30);
      trailGrad.addColorStop(0, color + 'cc');
      trailGrad.addColorStop(1, color + '00');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 4);
      ctx.lineTo(x + 5, y + 4);
      ctx.lineTo(x + 2, y + 28);
      ctx.lineTo(x - 2, y + 28);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    drawPlayer('left', playerLRef.current.lane, invincibleRef.current > 0 && flashSideRef.current === 'left');
    drawPlayer('right', playerRRef.current.lane, invincibleRef.current > 0 && flashSideRef.current === 'right');

    // Particles
    for (const p of particlesRef.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      const alpha = Math.floor(p.life / 30 * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = p.color + alpha;
      ctx.fill();
    }
  }, [laneX, playerY, roundRect]);

  // Start game
  const startGame = useCallback(() => {
    stateRef.current = 'playing';
    setUiState('playing');
    scoreRef.current = 0;
    livesRef.current = 3;
    frameRef.current = 0;
    speedRef.current = 3;
    obstaclesRef.current = [];
    particlesRef.current = [];
    pickupsRef.current = [];
    blindPowerupsRef.current = [];
    blindTimerRef.current = 0;
    setUiBlind(false);
    playerLRef.current.lane = 1;
    playerRRef.current.lane = 1;
    invincibleRef.current = 0;
    flashTimerRef.current = 0;
    flashSideRef.current = null;
    setUiScore(0);
    setUiLives(3);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      if (stateRef.current === 'playing') {
        update();
      }
      draw(ctx);
      animIdRef.current = requestAnimationFrame(loop);
    };
    animIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [draw, update]);

  // Keyboard
  useEffect(() => {
    const keysDown = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      if (!keysDown.has(e.key)) {
        keysDown.add(e.key);
        if (stateRef.current === 'playing') {
          if (e.key === 'a' || e.key === 'A') moveShip('left', -1);
          if (e.key === 'd' || e.key === 'D') moveShip('left', 1);
          if (e.key === 'ArrowLeft') { e.preventDefault(); moveShip('right', -1); }
          if (e.key === 'ArrowRight') { e.preventDefault(); moveShip('right', 1); }
        }
        if (stateRef.current === 'idle' || stateRef.current === 'over') {
          if (e.key === 'Enter' || e.key === ' ') startGame();
        }
      }
    };
    const onUp = (e: KeyboardEvent) => { keysDown.delete(e.key); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [moveShip, startGame]);

  // Touch button handlers
  const onTouchBtn = useCallback((side: 'left' | 'right', dir: -1 | 1) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (stateRef.current === 'playing') moveShip(side, dir);
  }, [moveShip]);

  const livesDisplay = '\u2764\uFE0F'.repeat(Math.max(0, uiLives)) + '\uD83D\uDDA4'.repeat(Math.max(0, 3 - uiLives));

  return (
    <div className="md-root" style={styles.root}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;700&display=swap"
        rel="stylesheet"
      />

      {/* Star field */}
      <StarField />

      <div style={styles.container}>
        {/* HUD */}
        <div style={styles.hud}>
          <div style={styles.lives}>{livesDisplay}</div>
          <div style={styles.title}>MIRROR DASH</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {uiBlind && (
              <span style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#aa44ff',
                letterSpacing: 1,
                animation: 'md-twinkle 0.8s linear infinite',
              }}>
                BLIND
              </span>
            )}
            <div style={styles.scoreDisplay}>{uiScore}</div>
          </div>
        </div>

        {/* Canvas wrap */}
        <div style={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={styles.canvas}
          />

          {/* Start overlay */}
          {uiState === 'idle' && (
            <div style={styles.overlay}>
              <div style={styles.overlayTitleStart}>MIRROR DASH</div>
              <div style={styles.overlaySub}>
                Two ships. Two hands.<br />
                <b style={{ color: C.leftNeonLight }}>A / D</b> controls the left ship.<br />
                <b style={{ color: C.rightNeonLight }}>&larr; / &rarr;</b> controls the right ship.<br />
                Dodge both sides &mdash; at the same time.
              </div>
              <button style={styles.btn} onClick={startGame}>PLAY</button>
            </div>
          )}

          {/* Game over overlay */}
          {uiState === 'over' && (
            <div style={styles.overlay}>
              <div style={styles.overlayTitleOver}>GAME OVER</div>
              <div style={styles.overlayScore}>SCORE: {uiScore}</div>
              <div style={styles.overlaySub}>
                {uiScore >= uiHiScore ? '\uD83C\uDFC6 New Best!' : `Best: ${uiHiScore}`}
              </div>
              <button style={styles.btn} onClick={startGame}>RETRY</button>
            </div>
          )}
        </div>

        {/* Controls hint — hidden on mobile via CSS */}
        <div className="md-keyboard-hint" style={styles.controlsHint}>
          <div style={styles.ctrl}>
            <span style={{ ...styles.key, color: C.leftNeonLight }}>A</span>
            <span style={{ color: C.muted }}>/</span>
            <span style={{ ...styles.key, color: C.leftNeonLight }}>D</span>
            <span style={{ color: C.leftNeonLight, marginLeft: 4, fontWeight: 700 }}> LEFT SHIP</span>
          </div>
          <div style={{ color: C.muted }}>|</div>
          <div style={styles.ctrl}>
            <span style={{ ...styles.key, color: C.rightNeonLight }}>&larr;</span>
            <span style={{ ...styles.key, color: C.rightNeonLight }}>&rarr;</span>
            <span style={{ color: C.rightNeonLight, marginLeft: 4, fontWeight: 700 }}> RIGHT SHIP</span>
          </div>
        </div>

        {/* Tap controls */}
        <div style={styles.tapControls}>
          <div style={styles.tapGroup}>
            <button
              style={{ ...styles.tapBtn, ...styles.tapLeft }}
              onMouseDown={onTouchBtn('left', -1)}
              onTouchStart={onTouchBtn('left', -1)}
            >&larr;</button>
            <button
              style={{ ...styles.tapBtn, ...styles.tapRightL }}
              onMouseDown={onTouchBtn('left', 1)}
              onTouchStart={onTouchBtn('left', 1)}
            >&rarr;</button>
          </div>
          <div style={styles.tapLabelCenter}>
            <span style={{ color: C.leftNeonLight, fontSize: '0.55rem' }}>LEFT</span>
            <span style={{ color: C.muted, fontSize: '0.45rem' }}>SHIP</span>
            <span style={{ color: C.rightNeonLight, fontSize: '0.55rem' }}>RIGHT</span>
          </div>
          <div style={styles.tapGroup}>
            <button
              style={{ ...styles.tapBtn, ...styles.tapLeftR }}
              onMouseDown={onTouchBtn('right', -1)}
              onTouchStart={onTouchBtn('right', -1)}
            >&larr;</button>
            <button
              style={{ ...styles.tapBtn, ...styles.tapRight }}
              onMouseDown={onTouchBtn('right', 1)}
              onTouchStart={onTouchBtn('right', 1)}
            >&rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Star field component ──
const StarField: React.FC = React.memo(() => {
  const stars = useRef(
    Array.from({ length: 80 }, () => ({
      size: Math.random() * 2 + 0.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 3,
    }))
  ).current;

  return (
    <div style={styles.stars}>
      <style>{`
        @keyframes md-twinkle {
          0% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; }
          100% { opacity: 0.2; transform: translateY(-2px); }
        }
        @media (max-width: 640px) {
          .md-keyboard-hint { display: none !important; }
        }
      `}</style>
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            background: 'white',
            borderRadius: '50%',
            width: s.size,
            height: s.size,
            left: `${s.left}%`,
            top: `${s.top}%`,
            animation: `md-twinkle ${s.duration}s linear infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
});

// ── Inline styles matching the provided HTML/CSS ──
const styles: Record<string, React.CSSProperties> = {
  root: {
    background: C.bg,
    fontFamily: "'Rajdhani', sans-serif",
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    userSelect: 'none',
  },
  stars: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 0,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
    width: '100%',
    maxWidth: 560,
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  hud: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px 12px',
  },
  lives: {
    display: 'flex',
    gap: 5,
    fontSize: '1.1rem',
  },
  title: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '1.3rem',
    fontWeight: 900,
    letterSpacing: 3,
    background: `linear-gradient(90deg, ${C.leftNeon}, ${C.rightNeon})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  scoreDisplay: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: C.text,
    letterSpacing: 2,
  },
  canvasWrap: {
    position: 'relative',
    width: '100%',
  },
  canvas: {
    display: 'block',
    width: '100%',
    borderRadius: 16,
    border: '1px solid rgba(123,47,255,0.3)',
    boxShadow: '0 0 30px rgba(123,47,255,0.2), 0 0 60px rgba(255,47,123,0.1), inset 0 0 30px rgba(0,0,0,0.5)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 16,
    background: 'rgba(6,4,15,0.88)',
    backdropFilter: 'blur(6px)',
    zIndex: 10,
  },
  overlayTitleStart: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '1.8rem',
    fontWeight: 900,
    letterSpacing: 3,
    textAlign: 'center',
    background: `linear-gradient(90deg, ${C.leftNeon}, ${C.rightNeon})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  overlayTitleOver: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '1.8rem',
    fontWeight: 900,
    letterSpacing: 3,
    textAlign: 'center',
    color: C.rightNeon,
    textShadow: `0 0 20px rgba(255,47,123,0.5)`,
  },
  overlaySub: {
    fontSize: '0.9rem',
    color: C.muted,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 1.7,
    maxWidth: 300,
  },
  overlayScore: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '1.1rem',
    color: C.text,
    letterSpacing: 2,
  },
  btn: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '12px 32px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    letterSpacing: 2,
    background: `linear-gradient(90deg, ${C.leftNeon}, ${C.rightNeon})`,
    color: '#fff',
    boxShadow: '0 0 20px rgba(123,47,255,0.4)',
    transition: 'all 0.15s',
  },
  controlsHint: {
    display: 'flex',
    gap: 20,
    fontSize: '0.85rem',
    fontWeight: 700,
    color: C.muted,
    letterSpacing: 1,
    paddingTop: 12,
    alignItems: 'center',
  },
  ctrl: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  key: {
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${C.muted}`,
    borderRadius: 5,
    padding: '2px 8px',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '0.65rem',
    color: C.text,
  },
  tapControls: {
    display: 'flex',
    width: '100%',
    gap: 8,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapGroup: {
    display: 'flex',
    gap: 6,
    flex: 1,
  },
  tapLabelCenter: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '0.5rem',
    color: C.muted,
    letterSpacing: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    padding: '0 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  tapBtn: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    border: 'none',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.1s',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  },
  tapLeft: {
    background: 'rgba(123,47,255,0.15)',
    border: `1px solid ${C.leftNeon}`,
    color: C.leftNeonLight,
  },
  tapRightL: {
    background: 'rgba(255,47,123,0.15)',
    border: `1px solid ${C.rightNeon}`,
    color: C.rightNeonLight,
  },
  tapLeftR: {
    background: 'rgba(123,47,255,0.15)',
    border: `1px solid ${C.leftNeon}`,
    color: C.leftNeonLight,
  },
  tapRight: {
    background: 'rgba(255,47,123,0.15)',
    border: `1px solid ${C.rightNeon}`,
    color: C.rightNeonLight,
  },
};

export default MirrorDash;
