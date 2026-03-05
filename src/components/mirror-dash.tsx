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
  leftDanger: number[];   // danger lane indices for left side (1 or 2)
  rightDanger: number[];  // danger lane indices for right side (1 or 2)
  type: string;
}

/** Swap-and-pop removal — O(1) instead of O(n) splice */
const swapRemove = <T,>(arr: T[], i: number): void => {
  arr[i] = arr[arr.length - 1];
  arr.pop();
};

/** Pick 1 or 2 random danger lanes out of [0,1,2] */
const randomDangerLanes = (frame: number = 0): number[] => {
  // At frame 0: 50% chance of 2 danger lanes
  // Ramps up to 85% by frame 3000, making double-open paths rarer
  const twoDangerChance = Math.min(0.85, 0.5 + frame * 0.00012);
  const count = Math.random() < twoDangerChance ? 2 : 1;
  const lanes = [0, 1, 2];
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  return lanes.slice(0, count).sort((a, b) => a - b);
};

interface Pickup {
  y: number;
  side: 'left' | 'right';
  lane: number;
}

interface ShieldPowerup {
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
  const bgmRef = useRef<HTMLAudioElement | null>(null);

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
  const speedRef = useRef(2.0);
  const lastSpawnFrameRef = useRef(0);
  const lastHeartFrameRef = useRef(0);
  const lastShieldFrameRef = useRef(0);
  const nextHeartCooldownRef = useRef(500);
  const nextShieldCooldownRef = useRef(900);
  const visualLaneLRef = useRef(1);
  const visualLaneRRef = useRef(1);
  const nextSpawnIntervalRef = useRef(85);
  const groundOffsetRef = useRef(0);
  const lastTimeRef = useRef(0);
  const scoreElRef = useRef<HTMLDivElement>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const flashTimerRef = useRef(0);
  const flashSideRef = useRef<'left' | 'right' | null>(null);
  const invincibleLeftRef = useRef(0);
  const invincibleRightRef = useRef(0);
  const playerLRef = useRef({ lane: 1 });
  const playerRRef = useRef({ lane: 1 });

  // Shield power-up: grants temporary invincibility per side
  const shieldPowerupsRef = useRef<ShieldPowerup[]>([]);
  const shieldLeftRef = useRef(0);
  const shieldRightRef = useRef(0);
  const [uiShieldLeft, setUiShieldLeft] = useState(false);
  const [uiShieldRight, setUiShieldRight] = useState(false);

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

  // Init BGM
  useEffect(() => {
    const audio = new Audio('/mirror-dash.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    bgmRef.current = audio;
    const onVisibility = () => {
      if (!bgmRef.current) return;
      if (document.hidden) {
        bgmRef.current.pause();
      } else if (stateRef.current === 'playing') {
        bgmRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      audio.pause();
      audio.src = '';
      bgmRef.current = null;
    };
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

  // Spawn obstacle — random danger count per side, same pattern when close
  const spawnObstacle = useCallback(() => {
    const nearby = obstaclesRef.current.filter((o: Obstacle) => o.y < 100);
    let leftDanger: number[];
    let rightDanger: number[];
    if (nearby.length > 0) {
      const closest = nearby.reduce((a: Obstacle, b: Obstacle) => (a.y < b.y ? a : b));
      if (closest.y < 70) {
        leftDanger = [...closest.leftDanger];
        rightDanger = [...closest.rightDanger];
      } else {
        leftDanger = randomDangerLanes(frameRef.current);
        rightDanger = randomDangerLanes(frameRef.current);
      }
    } else {
      leftDanger = randomDangerLanes(frameRef.current);
      rightDanger = randomDangerLanes(frameRef.current);
    }
    obstaclesRef.current.push({ y: -30, leftDanger, rightDanger, type: 'split' });
  }, []);

  // Spawn pickup — place in a safe lane of the given obstacle
  const spawnPickup = useCallback((obs: Obstacle) => {
    const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
    const dangerArr = side === 'left' ? obs.leftDanger : obs.rightDanger;
    const safeLanes = [0, 1, 2].filter(l => !dangerArr.includes(l));
    if (safeLanes.length === 0) return;
    const lane = safeLanes.includes(1) ? 1 : safeLanes[0];
    pickupsRef.current.push({ y: obs.y, side, lane });
  }, []);

  // Spawn shield power-up — place in a safe lane of the given obstacle
  const spawnShieldPowerup = useCallback((obs: Obstacle) => {
    const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
    const dangerArr = side === 'left' ? obs.leftDanger : obs.rightDanger;
    const safeLanes = [0, 1, 2].filter(l => !dangerArr.includes(l));
    if (safeLanes.length === 0) return;
    const lane = safeLanes.includes(1) ? 1 : safeLanes[0];
    shieldPowerupsRef.current.push({ y: obs.y, side, lane });
  }, []);

  // Hit handler
  const hit = useCallback((side: 'left' | 'right') => {
    livesRef.current--;
    if (side === 'left') invincibleLeftRef.current = 90;
    else invincibleRightRef.current = 90;
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
      setUiScore(Math.floor(scoreRef.current));
      const sc = Math.floor(scoreRef.current);
      if (sc > hiScoreRef.current) {
        hiScoreRef.current = sc;
        localStorage.setItem('mirror-dash-best', String(sc));
      }
      setUiHiScore(hiScoreRef.current);
      // Stop BGM
      if (bgmRef.current) bgmRef.current.pause();
    }
  }, [laneX, playerY]);

  // Update
  const update = useCallback((dt: number) => {
    const frame = frameRef.current;
    frameRef.current += dt;

    // Speed ramp — smooth linear, starts 2.5 → maxes 4.5
    speedRef.current = 2.5 + Math.min(2.0, frame * 0.0005);
    if (invincibleLeftRef.current > 0) invincibleLeftRef.current -= dt;
    if (invincibleRightRef.current > 0) invincibleRightRef.current -= dt;

    const speed = speedRef.current;

    // Smooth lane interpolation (dt-adjusted for frame-rate independence)
    const lerpFactor = 1 - Math.pow(0.7, dt);
    visualLaneLRef.current += (playerLRef.current.lane - visualLaneLRef.current) * lerpFactor;
    visualLaneRRef.current += (playerRRef.current.lane - visualLaneRRef.current) * lerpFactor;

    // Accumulate ground offset smoothly (dt-adjusted)
    groundOffsetRef.current = (groundOffsetRef.current + speed * dt) % 40;

    // Spawn obstacles — interval-based, random gap, gets tighter over time
    if (frame - lastSpawnFrameRef.current >= nextSpawnIntervalRef.current) {
      const minGap = Math.max(40, 95 - Math.floor(frame / 800) * 4);
      const tooClose = obstaclesRef.current.some((o: Obstacle) => o.y < minGap - 30);
      if (!tooClose) {
        spawnObstacle();
        lastSpawnFrameRef.current = frame;
        // Next interval: random, base shrinks over time
        const baseInterval = Math.max(40, Math.floor(85 - frame * 0.005));
        nextSpawnIntervalRef.current = baseInterval + Math.floor(Math.random() * 20);
        const newObs = obstaclesRef.current[obstaclesRef.current.length - 1];

        // Heart pickup — rare, cooldown 800-1200 frames
        if (livesRef.current < 3 && frame - lastHeartFrameRef.current >= nextHeartCooldownRef.current) {
          spawnPickup(newObs);
          lastHeartFrameRef.current = frame;
          nextHeartCooldownRef.current = 800 + Math.floor(Math.random() * 400);
        }

        // Shield power-up — very rare, cooldown 1400-2000 frames
        if (shieldLeftRef.current <= 0 && shieldRightRef.current <= 0
            && frame > 600
            && frame - lastShieldFrameRef.current >= nextShieldCooldownRef.current) {
          spawnShieldPowerup(newObs);
          lastShieldFrameRef.current = frame;
          nextShieldCooldownRef.current = 1400 + Math.floor(Math.random() * 600);
        }
      }
    }

    // Tick per-side shield timers
    if (shieldLeftRef.current > 0) {
      shieldLeftRef.current -= dt;
      if (shieldLeftRef.current <= 0) setUiShieldLeft(false);
    }
    if (shieldRightRef.current > 0) {
      shieldRightRef.current -= dt;
      if (shieldRightRef.current <= 0) setUiShieldRight(false);
    }

    const py = playerY();

    // Move & collect shield power-ups (only the collecting side gets shield)
    for (let i = shieldPowerupsRef.current.length - 1; i >= 0; i--) {
      shieldPowerupsRef.current[i].y += speed * dt;
      if (shieldPowerupsRef.current[i].y > H + 20) {
        swapRemove(shieldPowerupsRef.current, i);
        continue;
      }
      const sp = shieldPowerupsRef.current[i];
      if (sp.y > py - 22 && sp.y < py + 22) {
        const spX = laneX(sp.side, sp.lane);
        const shipX = sp.side === 'left'
          ? laneX('left', playerLRef.current.lane)
          : laneX('right', playerRRef.current.lane);
        if (Math.abs(spX - shipX) < LANE_W * 0.7) {
          if (sp.side === 'left') {
            shieldLeftRef.current = 300;
            setUiShieldLeft(true);
          } else {
            shieldRightRef.current = 300;
            setUiShieldRight(true);
          }
          // Cyan/white particle burst
          for (let j = 0; j < 16; j++) {
            particlesRef.current.push({
              x: spX, y: py,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              life: 40,
              color: Math.random() < 0.5 ? '#2fffee' : '#ffffff',
            });
          }
          swapRemove(shieldPowerupsRef.current, i);
        }
      }
    }

    // Move & collect pickups
    for (let i = pickupsRef.current.length - 1; i >= 0; i--) {
      pickupsRef.current[i].y += speed * dt;
      if (pickupsRef.current[i].y > H + 20) {
        swapRemove(pickupsRef.current, i);
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
          swapRemove(pickupsRef.current, i);
        }
      }
    }

    // Move obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      obstaclesRef.current[i].y += speed * dt;
      if (obstaclesRef.current[i].y > H + 40) {
        swapRemove(obstaclesRef.current, i);
        scoreRef.current += 10;
      }
    }

    // Collision (per-side invincibility — each side tracked independently)
    {
      let hitL = false;
      let hitR = false;
      for (const obs of obstaclesRef.current) {
        if (obs.y > py - 20 && obs.y < py + 20) {
          if (invincibleLeftRef.current <= 0 && shieldLeftRef.current <= 0 && obs.leftDanger.includes(playerLRef.current.lane)) {
            hitL = true;
          }
          if (invincibleRightRef.current <= 0 && shieldRightRef.current <= 0 && obs.rightDanger.includes(playerRRef.current.lane)) {
            hitR = true;
          }
          if (hitL || hitR) break;
        }
      }
      if (hitL) hit('left');
      if (hitR && stateRef.current === 'playing') hit('right');
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) swapRemove(particlesRef.current, i);
    }

    if (flashTimerRef.current > 0) flashTimerRef.current -= dt;
    scoreRef.current += dt;
    if (scoreElRef.current) scoreElRef.current.textContent = String(Math.floor(scoreRef.current));
  }, [spawnObstacle, spawnPickup, spawnShieldPowerup, playerY, laneX, hit]);

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
    const lineY = groundOffsetRef.current;
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

    // Obstacles (safe arrows always visible)
    const obsW = LANE_W - 10;
    const obsH = 18;
    for (const obs of obstaclesRef.current) {
      const y = obs.y;
      // Left side
      for (let l = 0; l < LANES; l++) {
        const x = laneX('left', l);
        if (obs.leftDanger.includes(l)) {
          ctx.save();
          ctx.shadowColor = C.dangerLeft;
          ctx.shadowBlur = 12;
          ctx.fillStyle = C.dangerLeft;
          ctx.beginPath();
          roundRect(ctx, x - obsW / 2, y - obsH / 2, obsW, obsH, 4);
          ctx.fill();
          ctx.restore();
        } else {
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
      for (let l = 0; l < LANES; l++) {
        const x = laneX('right', l);
        if (!obs.rightDanger.includes(l)) {
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

    // Shield power-ups (collectible)
    for (const sp of shieldPowerupsRef.current) {
      const x = laneX(sp.side, sp.lane);
      const y = sp.y;
      const pulse = 0.6 + 0.4 * Math.sin(frame * 0.12);
      ctx.save();
      ctx.shadowColor = '#2fffee';
      ctx.shadowBlur = 14 * pulse;
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = pulse;
      ctx.fillText('\uD83D\uDEE1\uFE0F', x, y);
      ctx.beginPath();
      ctx.arc(x, y, 16 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(47,255,238,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Shield active — per-side timer bars at bottom of canvas
    const shieldL = shieldLeftRef.current;
    const shieldR = shieldRightRef.current;
    if (shieldL > 0) {
      const frac = shieldL / 300;
      const barW = (MID - 30) * frac;
      ctx.save();
      ctx.fillStyle = `rgba(47,255,238,${0.3 + 0.15 * Math.sin(frame * 0.1)})`;
      ctx.fillRect(10, H - 8, barW, 4);
      ctx.restore();
    }
    if (shieldR > 0) {
      const frac = shieldR / 300;
      const barW = (MID - 30) * frac;
      ctx.save();
      ctx.fillStyle = `rgba(47,255,238,${0.3 + 0.15 * Math.sin(frame * 0.1)})`;
      ctx.fillRect(W - 10 - barW, H - 8, barW, 4);
      ctx.restore();
    }

    // Players
    const drawPlayer = (side: 'left' | 'right', lane: number, damaged: boolean) => {
      const x = laneX(side, lane);
      const y = playerY();
      const color = side === 'left' ? C.leftNeonLight : C.rightNeonLight;
      const sideShielded = side === 'left' ? shieldL > 0 : shieldR > 0;

      if (damaged && Math.floor(frame / 6) % 2 === 0) return;

      // Shield bubble when this side is shielded
      if (sideShielded) {
        const pulse = 0.4 + 0.2 * Math.sin(frame * 0.12);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y - 4, 22, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(47,255,238,${pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#2fffee';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;

      // Body — neon arrowhead with wing tips
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x - 8, y + 4);
      ctx.lineTo(x - 14, y + 12);
      ctx.lineTo(x - 8, y + 8);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x + 8, y + 8);
      ctx.lineTo(x + 14, y + 12);
      ctx.lineTo(x + 8, y + 4);
      ctx.closePath();
      ctx.fill();

      // Cockpit window
      ctx.fillStyle = side === 'left' ? 'rgba(180,130,255,0.6)' : 'rgba(255,180,220,0.6)';
      ctx.beginPath();
      ctx.arc(x, y - 10, 3, 0, Math.PI * 2);
      ctx.fill();

      // Wing-tip accents
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 12);
      ctx.lineTo(x - 10, y + 14);
      ctx.moveTo(x + 14, y + 12);
      ctx.lineTo(x + 10, y + 14);
      ctx.stroke();

      // Engine trail (twin)
      const trailGrad = ctx.createLinearGradient(x, y + 12, x, y + 34);
      trailGrad.addColorStop(0, color + 'cc');
      trailGrad.addColorStop(1, color + '00');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 10);
      ctx.lineTo(x - 3, y + 10);
      ctx.lineTo(x - 2, y + 32);
      ctx.lineTo(x - 7, y + 32);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 10);
      ctx.lineTo(x + 6, y + 10);
      ctx.lineTo(x + 7, y + 32);
      ctx.lineTo(x + 2, y + 32);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    drawPlayer('left', visualLaneLRef.current, invincibleLeftRef.current > 0);
    drawPlayer('right', visualLaneRRef.current, invincibleRightRef.current > 0);

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
    speedRef.current = 2.5;
    lastSpawnFrameRef.current = 0;
    lastHeartFrameRef.current = 0;
    lastShieldFrameRef.current = 0;
    nextHeartCooldownRef.current = 800;
    nextShieldCooldownRef.current = 1400;
    nextSpawnIntervalRef.current = 85;
    groundOffsetRef.current = 0;
    lastTimeRef.current = 0;
    obstaclesRef.current = [];
    particlesRef.current = [];
    pickupsRef.current = [];
    shieldPowerupsRef.current = [];
    shieldLeftRef.current = 0;
    shieldRightRef.current = 0;
    setUiShieldLeft(false);
    setUiShieldRight(false);
    playerLRef.current.lane = 1;
    playerRRef.current.lane = 1;
    visualLaneLRef.current = 1;
    visualLaneRRef.current = 1;
    invincibleLeftRef.current = 0;
    invincibleRightRef.current = 0;
    flashTimerRef.current = 0;
    flashSideRef.current = null;
    setUiScore(0);
    setUiLives(3);
    // Play BGM
    if (bgmRef.current) {
      bgmRef.current.currentTime = 0;
      bgmRef.current.play().catch(() => {});
    }
  }, []);

  // Keep latest update/draw in refs so the loop never restarts
  const updateFnRef = useRef(update);
  const drawFnRef = useRef(draw);
  useEffect(() => { updateFnRef.current = update; }, [update]);
  useEffect(() => { drawFnRef.current = draw; }, [draw]);

  // Game loop — runs exactly once, never recreated (prevents frame jumps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (timestamp: number) => {
      if (stateRef.current === 'playing') {
        let dt = 1;
        if (lastTimeRef.current > 0) {
          dt = Math.min((timestamp - lastTimeRef.current) / (1000 / 60), 2);
        }
        lastTimeRef.current = timestamp;
        updateFnRef.current(dt);
      } else {
        lastTimeRef.current = 0;
      }
      drawFnRef.current(ctx);
      animIdRef.current = requestAnimationFrame(loop);
    };
    animIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animIdRef.current);
  }, []);

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

  // Pre-created stable handlers — avoids new function instances on every render
  const handleLB = useCallback((e: React.PointerEvent) => { e.preventDefault(); if (stateRef.current === 'playing') moveShip('left', -1); }, [moveShip]);
  const handleLF = useCallback((e: React.PointerEvent) => { e.preventDefault(); if (stateRef.current === 'playing') moveShip('left', 1); }, [moveShip]);
  const handleRB = useCallback((e: React.PointerEvent) => { e.preventDefault(); if (stateRef.current === 'playing') moveShip('right', -1); }, [moveShip]);
  const handleRF = useCallback((e: React.PointerEvent) => { e.preventDefault(); if (stateRef.current === 'playing') moveShip('right', 1); }, [moveShip]);

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
        {/* HUD — hidden on start screen */}
        <div style={{ ...styles.hud, visibility: uiState === 'idle' ? 'hidden' : 'visible' }}>
          <div style={styles.lives}>{livesDisplay}</div>
          <div className="md-title" style={styles.title}>MIRROR DASH</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100, justifyContent: 'flex-end' }}>
            {uiShieldLeft && (
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.5rem', fontWeight: 700, color: C.leftNeonLight, letterSpacing: 1 }}>
                L🛡
              </span>
            )}
            {uiShieldRight && (
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.5rem', fontWeight: 700, color: C.rightNeonLight, letterSpacing: 1 }}>
                R🛡
              </span>
            )}
            <div ref={scoreElRef} style={styles.scoreDisplay}>{uiScore}</div>
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
                <span className="md-desktop-only">
                  <b style={{ color: C.leftNeonLight }}>A / D</b> controls the left ship.<br />
                  <b style={{ color: C.rightNeonLight }}>&larr; / &rarr;</b> controls the right ship.<br />
                </span>
                <span className="md-mobile-only">
                  Use the <b style={{ color: C.leftNeonLight }}>left buttons</b> and <b style={{ color: C.rightNeonLight }}>right buttons</b> below.<br />
                </span>
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

        {/* Controls hint — hidden on mobile via CSS class (no inline display) */}
        <div className="md-keyboard-hint" style={styles.controlsHintBase}>
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
              onPointerDown={handleLB}
            >&#9664;</button>
            <button
              style={{ ...styles.tapBtn, ...styles.tapRightL }}
              onPointerDown={handleLF}
            >&#9654;</button>
          </div>
          <div style={styles.tapLabelCenter}>
            <span style={{ color: C.leftNeonLight, fontSize: '0.55rem' }}>LEFT</span>
            <span style={{ color: C.muted, fontSize: '0.45rem' }}>SHIP</span>
            <span style={{ color: C.rightNeonLight, fontSize: '0.55rem' }}>RIGHT</span>
          </div>
          <div style={styles.tapGroup}>
            <button
              style={{ ...styles.tapBtn, ...styles.tapLeftR }}
              onPointerDown={handleRB}
            >&#9664;</button>
            <button
              style={{ ...styles.tapBtn, ...styles.tapRight }}
              onPointerDown={handleRF}
            >&#9654;</button>
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
        .md-keyboard-hint { display: flex; }
        .md-desktop-only { display: inline; }
        .md-mobile-only { display: none; }
        @media (max-width: 640px) {
          .md-keyboard-hint { display: none; }
          .md-desktop-only { display: none; }
          .md-mobile-only { display: inline; }
        }
        @media (max-width: 400px) {
          .md-title { font-size: 0.9rem !important; letter-spacing: 1px !important; }
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
    fontSize: '1.1rem',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '1.3rem',
    fontWeight: 900,
    letterSpacing: 3,
    background: `linear-gradient(90deg, ${C.leftNeon}, ${C.rightNeon})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    whiteSpace: 'nowrap',
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
  controlsHintBase: {
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
    height: 64,
    borderRadius: 12,
    border: 'none',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '1.4rem',
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
