import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Volume2, VolumeX, RotateCcw, Lightbulb, Trophy, Lock } from 'lucide-react';
import { trackGameEvent, trackButtonClick, trackGameCompletion } from '../utils/analytics';
import { useGameState } from '../hooks/useGameState';

// === Types ===
type GamePhase = 'setup' | 'countdown' | 'playing' | 'roundEnd' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';
type SortDirection = 'asc' | 'desc';

interface RoundResult {
  swapsUsed: number;
  minSwaps: number;
  efficiency: number;
  timeBonus: number;
  roundScore: number;
  label: 'Perfect!' | 'Nice!' | 'Too slow!';
  direction: SortDirection;
}

// === Constants ===
const INITIAL_TIME = 30;
const UNDO_COST = 6;   // increased from 3
const HINT_COST = 10;  // increased from 5
const BASE_SCORE = 1000;
const SWAP_PENALTY = 50;
const TIME_SCORE_RATE = 10;

// Progressive difficulty: array grows every 3 rounds
const BASE_ARRAY_SIZES: Record<Difficulty, number> = { easy: 4, medium: 5, hard: 7 };
const MAX_ARRAY_SIZES:  Record<Difficulty, number> = { easy: 8, medium: 10, hard: 12 };
// Time bonus shrinks every 3 rounds
const BASE_TIME_BONUSES: Record<Difficulty, number> = { easy: 15, medium: 20, hard: 25 };
const MIN_TIME_BONUSES:  Record<Difficulty, number> = { easy: 8,  medium: 10, hard: 12 };

const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

// Color palette
const C = {
  bg:     '#1a1a2e',
  panel:  '#16213e',
  card:   '#0f3460',
  accent: '#e94560',
  yellow: '#f5a623',
  green:  '#4ecb71',
  blue:   '#4fc3f7',
  purple: '#a78bfa',
  white:  '#f0f0f0',
  muted:  '#8892b0',
};

const LS_DIFFICULTY  = 'sortAttack_difficulty';
const LS_SOUND       = 'sortAttack_sound';
const LS_HIGH_SCORES = 'sortAttack_highScores';

const GRID_BG: React.CSSProperties = {
  backgroundImage: `linear-gradient(rgba(79,195,247,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(79,195,247,0.04) 1px, transparent 1px)`,
  backgroundSize: '40px 40px',
};

// === Progressive Helpers ===
const getCurrentArraySize = (difficulty: Difficulty, round: number): number =>
  Math.min(BASE_ARRAY_SIZES[difficulty] + Math.floor(round / 3), MAX_ARRAY_SIZES[difficulty]);

const getCurrentTimeBonus = (difficulty: Difficulty, round: number): number =>
  Math.max(BASE_TIME_BONUSES[difficulty] - Math.floor(round / 3), MIN_TIME_BONUSES[difficulty]);

// Every 5th round (rounds 4, 9, 14…) is a reverse round
const getSortDirection = (round: number): SortDirection =>
  round > 0 && round % 5 === 4 ? 'desc' : 'asc';

// Locked tiles: none on easy, 1 on medium from round 3, 1-2 on hard
const getLockCount = (difficulty: Difficulty, round: number): number => {
  if (difficulty === 'easy') return 0;
  if (difficulty === 'medium') return round >= 3 ? 1 : 0;
  return round >= 5 ? 2 : round >= 1 ? 1 : 0;
};

// Tile size scales down as arrays grow
const getTileConfig = (count: number) => {
  if (count <= 4)  return { gap: 12, pad: 24, fontSize: '1.5rem'   };
  if (count <= 6)  return { gap: 10, pad: 20, fontSize: '1.2rem'   };
  if (count <= 8)  return { gap: 8,  pad: 16, fontSize: '1rem'     };
  if (count <= 10) return { gap: 6,  pad: 12, fontSize: '0.875rem' };
  return           { gap: 4,  pad: 10, fontSize: '0.75rem'  };
};

// === Algorithms ===
const countInversions = (arr: number[], direction: SortDirection = 'asc'): number => {
  let count = 0;
  for (let i = 0; i < arr.length - 1; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (direction === 'asc' ? arr[i] > arr[j] : arr[i] < arr[j]) count++;
  return count;
};

const isArraySorted = (arr: number[], direction: SortDirection = 'asc') =>
  direction === 'asc'
    ? arr.every((v, i) => i === 0 || arr[i - 1] <= v)
    : arr.every((v, i) => i === 0 || arr[i - 1] >= v);

const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Generates a round's array with optional locked border tiles.
 *
 * Locked tiles are always placed at position 0 (and optionally size-1)
 * with the correct border value so the puzzle stays solvable — values
 * on each side of a lock can freely sort among themselves without
 * needing to cross the locked position.
 */
const generateRoundData = (
  size: number,
  direction: SortDirection,
  lockCount: number,
): { arr: number[]; locked: number[] } => {
  const base = Array.from({ length: size }, (_, i) => i + 1); // [1..size]

  if (lockCount >= 2) {
    // Lock both borders: pos 0 = first correct value, pos size-1 = last correct value
    let arr: number[];
    do {
      const inner = shuffleArray(base.slice(1, -1));
      arr = direction === 'asc' ? [1, ...inner, size] : [size, ...inner, 1];
    } while (isArraySorted(arr, direction));
    return { arr, locked: [0, size - 1] };
  }

  if (lockCount === 1) {
    // Lock position 0 with the "first correct" value for this direction
    let arr: number[];
    do {
      arr = direction === 'asc'
        ? [1, ...shuffleArray(base.slice(1))]
        : [size, ...shuffleArray(base.slice(0, -1))];
    } while (isArraySorted(arr, direction));
    return { arr, locked: [0] };
  }

  // No locks: plain shuffle
  let arr: number[];
  do { arr = shuffleArray(base); }
  while (isArraySorted(arr, direction));
  return { arr, locked: [] };
};

// === Sound ===
const playSound = async (
  type: 'select' | 'swap' | 'complete' | 'hint' | 'undo' | 'warn',
  enabled: boolean,
) => {
  if (!enabled) return;
  try {
    if (Tone.getContext().state !== 'running') await Tone.start();
    const makeSynth = () =>
      new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.1 },
        volume: -16,
      }).toDestination();

    if (type === 'complete') {
      const s1 = makeSynth();
      s1.triggerAttackRelease('C5', '0.15');
      setTimeout(() => { const s2 = makeSynth(); s2.triggerAttackRelease('E5', '0.15'); setTimeout(() => s2.dispose(), 1000); }, 150);
      setTimeout(() => { const s3 = makeSynth(); s3.triggerAttackRelease('G5', '0.3');  setTimeout(() => s3.dispose(), 1000); }, 300);
      setTimeout(() => s1.dispose(), 1000);
    } else {
      const notes:     Record<string, string> = { select: 'E5', swap: 'G4', hint: 'A4', undo: 'C4', warn: 'C3' };
      const durations: Record<string, string> = { select: '0.1', swap: '0.15', hint: '0.2', undo: '0.2', warn: '0.1' };
      const synth = makeSynth();
      synth.triggerAttackRelease(notes[type], durations[type]);
      setTimeout(() => synth.dispose(), 1000);
    }
  } catch { /* silent fail */ }
};

// === Component ===
const SortAttack: React.FC = () => {
  // --- Settings ---
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => (localStorage.getItem(LS_DIFFICULTY) as Difficulty) || 'easy',
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => localStorage.getItem(LS_SOUND) !== 'false',
  );
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_HIGH_SCORES) || '{}');
      return { easy: 0, medium: 0, hard: 0, ...stored };
    } catch {
      return { easy: 0, medium: 0, hard: 0 };
    }
  });

  // --- Phase ---
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [countdown, setCountdown] = useState(3);

  // --- Gameplay ---
  const [tiles, setTiles] = useState<number[]>([]);
  const [originalTiles, setOriginalTiles] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hintPair, setHintPair] = useState<[number, number] | null>(null);
  const [swapAnimating, setSwapAnimating] = useState<[number, number] | null>(null);
  const [undoStack, setUndoStack] = useState<number[][]>([]);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [lockedIndices, setLockedIndices] = useState<number[]>([]);

  // --- Timer ---
  const timerRef = useRef<number>(INITIAL_TIME);
  const [timerDisplay, setTimerDisplay] = useState<number>(INITIAL_TIME);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Scoring ---
  const [score, setScore] = useState(0);
  const [swapsUsed, setSwapsUsed] = useState(0);
  const [roundNumber, setRoundNumber] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [efficiencies, setEfficiencies] = useState<number[]>([]);

  const { updateGameState } = useGameState();

  useEffect(() => {
    updateGameState('sort-attack', phase === 'playing' || phase === 'countdown' || phase === 'roundEnd');
  }, [phase, updateGameState]);

  useEffect(() => { localStorage.setItem(LS_DIFFICULTY, difficulty); }, [difficulty]);
  useEffect(() => { localStorage.setItem(LS_SOUND, String(soundEnabled)); }, [soundEnabled]);

  // Timer tick
  useEffect(() => {
    if (phase !== 'playing') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      timerRef.current -= 0.1;
      setTimerDisplay(Math.max(0, timerRef.current));
      if (timerRef.current <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase('gameover');
      }
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // Save high score on game over
  useEffect(() => {
    if (phase !== 'gameover') return;
    setHighScores(prev => {
      const next = { ...prev, [difficulty]: Math.max(prev[difficulty] || 0, score) };
      localStorage.setItem(LS_HIGH_SCORES, JSON.stringify(next));
      return next;
    });
    trackGameCompletion('sort-attack', score, 0, difficulty);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown → start first round
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        const direction = getSortDirection(0);
        const { arr, locked } = generateRoundData(
          getCurrentArraySize(difficulty, 0),
          direction,
          getLockCount(difficulty, 0),
        );
        setTiles(arr);
        setOriginalTiles(arr);
        setSortDirection(direction);
        setLockedIndices(locked);
        setSwapsUsed(0);
        setSelectedIndex(null);
        setHintPair(null);
        setUndoStack([]);
        timerRef.current = INITIAL_TIME;
        setTimerDisplay(INITIAL_TIME);
        setPhase('playing');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // === Handlers ===
  const handleStartGame = () => {
    setScore(0);
    setRoundNumber(0);
    setStreak(0);
    setEfficiencies([]);
    setLastResult(null);
    trackGameEvent('sort-attack', 'start', { difficulty });
    setPhase('countdown');
  };

  const handleRoundComplete = (totalSwaps: number) => {
    const minSwaps = countInversions(originalTiles, sortDirection);
    const extraSwaps = Math.max(0, totalSwaps - minSwaps);
    const efficiency = totalSwaps === 0 ? 100 : Math.round((minSwaps / totalSwaps) * 100);
    const penalty = extraSwaps * SWAP_PENALTY;
    const timeBonusScore = Math.floor(timerRef.current) * TIME_SCORE_RATE;
    const roundScore = Math.max(0, BASE_SCORE - penalty + timeBonusScore);

    const label: RoundResult['label'] =
      extraSwaps === 0  ? 'Perfect!' :
      efficiency >= 70  ? 'Nice!'    :
                          'Too slow!';

    const result: RoundResult = {
      swapsUsed: totalSwaps, minSwaps, efficiency,
      timeBonus: timeBonusScore, roundScore, label,
      direction: sortDirection,
    };
    setLastResult(result);
    setScore(s => s + roundScore);
    setStreak(extraSwaps === 0 ? streak + 1 : 0);

    const nextRoundNumber = roundNumber + 1;
    setRoundNumber(nextRoundNumber);
    setEfficiencies(prev => [...prev, efficiency]);

    // Time bonus shrinks as rounds progress
    const bonusSeconds = getCurrentTimeBonus(difficulty, roundNumber);
    timerRef.current = Math.min(timerRef.current + bonusSeconds - extraSwaps * 2, 99);

    playSound('complete', soundEnabled);

    setTimeout(() => {
      const nextDirection = getSortDirection(nextRoundNumber);
      const { arr, locked } = generateRoundData(
        getCurrentArraySize(difficulty, nextRoundNumber),
        nextDirection,
        getLockCount(difficulty, nextRoundNumber),
      );
      setTiles(arr);
      setOriginalTiles(arr);
      setSortDirection(nextDirection);
      setLockedIndices(locked);
      setSwapsUsed(0);
      setSelectedIndex(null);
      setHintPair(null);
      setUndoStack([]);
      setLastResult(null);
      setTimerDisplay(timerRef.current);
      setPhase('playing');
    }, 2500);
  };

  const performSwap = (i: number, j: number) => {
    if (swapAnimating) return;
    const priorTiles = [...tiles];
    const newSwapsCount = swapsUsed + 1;
    setSwapAnimating([i, j]);

    setTimeout(() => {
      const newTiles = [...priorTiles];
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
      setTiles(newTiles);
      setSwapsUsed(newSwapsCount);
      setUndoStack(prev => [...prev.slice(-4), priorTiles]);
      setSwapAnimating(null);
      playSound('swap', soundEnabled);

      if (isArraySorted(newTiles, sortDirection)) {
        setPhase('roundEnd');
        handleRoundComplete(newSwapsCount);
      }
    }, 150);
  };

  const handleTileClick = (index: number) => {
    if (phase !== 'playing' || swapAnimating) return;
    if (lockedIndices.includes(index)) return; // locked — cannot interact
    setHintPair(null);

    if (selectedIndex === null) {
      setSelectedIndex(index);
      playSound('select', soundEnabled);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else if (Math.abs(selectedIndex - index) === 1) {
      performSwap(selectedIndex, index);
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
      playSound('select', soundEnabled);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || phase !== 'playing') return;
    const prevTiles = undoStack[undoStack.length - 1];
    setTiles(prevTiles);
    setUndoStack(s => s.slice(0, -1));
    setSwapsUsed(s => Math.max(0, s - 1));
    timerRef.current = Math.max(1, timerRef.current - UNDO_COST);
    setTimerDisplay(timerRef.current);
    setSelectedIndex(null);
    setHintPair(null);
    playSound('undo', soundEnabled);
    trackButtonClick('undo', 'sort-attack');
  };

  const handleHint = () => {
    if (phase !== 'playing') return;
    // Find first inversion that doesn't involve a locked tile
    let pair: [number, number] | null = null;
    for (let i = 0; i < tiles.length - 1; i++) {
      if (lockedIndices.includes(i) || lockedIndices.includes(i + 1)) continue;
      if (sortDirection === 'asc' ? tiles[i] > tiles[i + 1] : tiles[i] < tiles[i + 1]) {
        pair = [i, i + 1];
        break;
      }
    }
    setHintPair(pair);
    timerRef.current = Math.max(1, timerRef.current - HINT_COST);
    setTimerDisplay(timerRef.current);
    playSound('hint', soundEnabled);
    trackButtonClick('hint', 'sort-attack');
  };

  const tileConfig = getTileConfig(tiles.length > 0 ? tiles.length : BASE_ARRAY_SIZES[difficulty]);

  const getTileClasses = (index: number): string => {
    const isSelected  = selectedIndex === index;
    const isAdjacent  = selectedIndex !== null && Math.abs(selectedIndex - index) === 1;
    const isHinted    = hintPair?.includes(index) ?? false;
    const isSorted    = phase === 'roundEnd';
    const isSwapping  = swapAnimating?.includes(index) ?? false;
    const isLocked    = lockedIndices.includes(index);

    const base = `w-full aspect-square flex items-center justify-center rounded-[14px] font-black select-none transition-all duration-150 border-[2.5px]`;

    if (isLocked)    return `${base} cursor-not-allowed bg-[#1a1a3a] text-[${C.muted}] border-[rgba(167,139,250,0.4)]`;
    if (isSorted)    return `${base} cursor-pointer text-[${C.green}] border-[${C.green}] bg-[#1a3a2a]`;
    if (isSelected)  return `${base} cursor-pointer bg-[${C.accent}] border-[#ff6b80] text-white -translate-y-2 scale-110 shadow-[0_12px_32px_rgba(233,69,96,0.45)] z-10`;
    if (isHinted || isAdjacent) return `${base} cursor-pointer bg-[${C.card}] text-white border-[${C.yellow}] shadow-[0_0_16px_rgba(245,166,35,0.35)] animate-pulse`;
    if (isSwapping)  return `${base} cursor-pointer bg-[${C.card}] text-white border-[rgba(79,195,247,0.2)] scale-95 opacity-70`;
    return `${base} cursor-pointer bg-[${C.card}] text-white border-[rgba(79,195,247,0.2)] hover:-translate-y-1 hover:scale-105 hover:border-[${C.blue}] hover:shadow-[0_8px_24px_rgba(79,195,247,0.25)]`;
  };

  const timerColor =
    timerDisplay <= 8  ? `text-[${C.accent}]` :
    timerDisplay <= 15 ? `text-[${C.yellow}]` :
                         `text-[${C.green}]`;
  const timerPulse = timerDisplay <= 8 ? 'animate-pulse' : '';

  const avgEfficiency =
    efficiencies.length > 0
      ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
      : 0;

  const remainingSwaps = (phase === 'playing' || phase === 'roundEnd')
    ? countInversions(tiles, sortDirection)
    : 0;

  // Shared page wrapper
  const Page = ({ children }: { children: React.ReactNode }) => (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: C.bg, color: C.white, ...GRID_BG }}
    >
      {children}
    </div>
  );

  // === Setup Screen ===
  if (phase === 'setup') {
    return (
      <Page>
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tight leading-none" style={{ color: C.white }}>
              Sort<span style={{ color: C.accent }}>Attack</span>
            </h1>
            <p className="font-mono text-xs uppercase tracking-[3px] mt-2" style={{ color: C.muted }}>
              swap · sort · optimize
            </p>
          </div>

          {/* Difficulty */}
          <div className="flex gap-2 justify-center">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="font-mono text-[0.7rem] uppercase tracking-wider px-4 py-2 rounded-lg border transition-all"
                style={difficulty === d
                  ? { borderColor: C.yellow, color: C.yellow, background: 'rgba(245,166,35,0.1)' }
                  : { borderColor: 'rgba(79,195,247,0.15)', color: C.muted, background: C.panel }
                }
              >
                {DIFFICULTY_LABELS[d]} ({BASE_ARRAY_SIZES[d]}+)
              </button>
            ))}
          </div>

          {/* High Scores */}
          <div className="rounded-xl p-4 border" style={{ background: C.panel, borderColor: 'rgba(79,195,247,0.12)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4" style={{ color: C.yellow }} />
              <span className="font-mono text-[0.65rem] uppercase tracking-widest" style={{ color: C.muted }}>High Scores</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <div
                  key={d}
                  className="text-center p-2 rounded-lg border transition-all"
                  style={difficulty === d
                    ? { borderColor: C.yellow, background: 'rgba(245,166,35,0.08)' }
                    : { borderColor: 'transparent' }
                  }
                >
                  <div className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: C.muted }}>{DIFFICULTY_LABELS[d]}</div>
                  <div className="text-lg font-black" style={{ color: C.white }}>{highScores[d] || 0}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How to play */}
          <div
            className="rounded-r-xl px-4 py-3 border-l-4 text-xs space-y-1.5"
            style={{ background: C.panel, borderLeftColor: C.accent, color: C.muted, fontFamily: 'monospace' }}
          >
            <div>
              <span style={{ color: C.white, fontWeight: 700 }}>How to play: </span>
              Click a number, then click an adjacent neighbor to swap. Sort lowest → highest!
            </div>
            <div>Arrays grow every 3 rounds. Every 5th round sorts <span style={{ color: C.purple }}>HIGH → LOW</span>.</div>
            {difficulty !== 'easy' && (
              <div style={{ color: C.purple }}>🔒 Locked tiles appear — route around them.</div>
            )}
            <div style={{ color: C.accent }}>Undo −{UNDO_COST}s · Hint −{HINT_COST}s</div>
          </div>

          {/* Sound + Start */}
          <div className="flex gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all"
              style={{ background: C.panel, borderColor: 'rgba(79,195,247,0.2)', color: C.muted }}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleStartGame}
              className="flex-1 py-3 rounded-xl font-black text-lg tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: C.accent, color: 'white', boxShadow: '0 4px 20px rgba(233,69,96,0.4)' }}
            >
              Start Game
            </button>
          </div>
        </div>
      </Page>
    );
  }

  // === Countdown Screen ===
  if (phase === 'countdown') {
    return (
      <Page>
        <p className="font-mono text-sm uppercase tracking-[4px] mb-8" style={{ color: C.blue }}>Get Ready!</p>
        <div
          className={`text-[9rem] font-black leading-none transition-all duration-300 ${countdown === 0 ? 'scale-125' : 'scale-100'}`}
          style={{ color: C.white }}
        >
          {countdown > 0 ? countdown : 'GO!'}
        </div>
        <p className="font-mono text-xs mt-10 uppercase tracking-widest" style={{ color: C.muted }}>
          adjacent swaps only
        </p>
      </Page>
    );
  }

  // === Game Over Screen ===
  if (phase === 'gameover') {
    const finalHighScore = Math.max(highScores[difficulty] || 0, score);
    const isNewHighScore = score > 0 && score >= (highScores[difficulty] || 0);

    return (
      <Page>
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center border-2"
          style={{ background: C.panel, borderColor: C.accent, boxShadow: `0 0 60px rgba(233,69,96,0.2)` }}
        >
          <div className="text-5xl mb-3">⏰</div>
          <h2 className="text-3xl font-black mb-1" style={{ color: C.white }}>Time's Up!</h2>
          <p className="font-mono text-xs uppercase tracking-widest mb-6" style={{ color: C.muted }}>
            {DIFFICULTY_LABELS[difficulty]} · Round {roundNumber}
          </p>

          {isNewHighScore && (
            <div
              className="rounded-xl px-4 py-2 mb-4 font-bold text-sm border"
              style={{ background: 'rgba(245,166,35,0.1)', borderColor: C.yellow, color: C.yellow }}
            >
              🏆 New High Score!
            </div>
          )}

          {/* Stats */}
          <div className="font-mono text-sm text-left space-y-2 mb-5 leading-loose" style={{ color: C.muted }}>
            <div className="flex justify-between">
              <span>Final Score</span>
              <span className="font-black" style={{ color: C.green }}>{score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Rounds completed</span>
              <span style={{ color: C.white }}>{roundNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg efficiency</span>
              <span style={{ color: C.blue }}>{avgEfficiency}%</span>
            </div>
            <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span>High score</span>
              <span className="font-black" style={{ color: C.yellow }}>{finalHighScore.toLocaleString()}</span>
            </div>
          </div>

          {/* Efficiency bar */}
          <div className="h-2 rounded-full mb-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${avgEfficiency}%`, background: `linear-gradient(90deg, ${C.green}, ${C.blue})` }}
            />
          </div>
          <p className="font-mono text-[0.6rem] text-right mb-6" style={{ color: C.muted }}>{avgEfficiency}% efficient</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setScore(0); setRoundNumber(0); setStreak(0); setEfficiencies([]); setLastResult(null);
                trackGameEvent('sort-attack', 'restart', { difficulty });
                setPhase('countdown');
              }}
              className="w-full py-3 rounded-xl font-black tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: C.accent, color: 'white', boxShadow: '0 4px 16px rgba(233,69,96,0.4)' }}
            >
              Play Again →
            </button>
            <button
              onClick={() => setPhase('setup')}
              className="w-full py-3 rounded-xl font-bold border transition-all hover:border-[#4fc3f7]"
              style={{ background: C.panel, color: C.muted, borderColor: 'rgba(79,195,247,0.2)' }}
            >
              Change Difficulty
            </button>
          </div>
        </div>
      </Page>
    );
  }

  // === Playing Screen (+ Round End overlay) ===
  const isReverseRound = sortDirection === 'desc';

  return (
    <div
      className="min-h-screen flex flex-col items-center pt-6 pb-8 px-4 gap-5"
      style={{ backgroundColor: C.bg, color: C.white, ...GRID_BG }}
    >
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: C.white }}>
          Sort<span style={{ color: C.accent }}>Attack</span>
        </h1>
        <p className="font-mono text-[0.6rem] uppercase tracking-[3px] mt-0.5" style={{ color: C.muted }}>
          swap · sort · optimize
        </p>
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-2">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <div
            key={d}
            className="font-mono text-[0.6rem] uppercase tracking-wider px-3 py-1 rounded-lg border"
            style={difficulty === d
              ? { borderColor: C.yellow, color: C.yellow, background: 'rgba(245,166,35,0.1)' }
              : { borderColor: 'rgba(79,195,247,0.1)', color: C.muted, background: C.panel }
            }
          >
            {DIFFICULTY_LABELS[d]}
          </div>
        ))}
      </div>

      {/* Reverse round badge */}
      {isReverseRound && (
        <div
          className="font-mono text-xs px-4 py-1.5 rounded-full border animate-pulse font-bold uppercase tracking-widest"
          style={{ borderColor: C.purple, color: C.purple, background: 'rgba(167,139,250,0.1)' }}
        >
          REVERSE ↓ HIGH → LOW
        </div>
      )}

      {/* HUD */}
      <div className="flex gap-3 justify-center flex-wrap">
        {/* Timer */}
        <div className="rounded-xl px-4 py-3 text-center border" style={{ background: C.panel, borderColor: 'rgba(79,195,247,0.15)', minWidth: 80 }}>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Time</div>
          <div className={`text-3xl font-black tabular-nums ${timerColor} ${timerPulse}`}>
            {Math.ceil(timerDisplay)}
          </div>
        </div>
        {/* Swaps */}
        <div className="rounded-xl px-4 py-3 text-center border" style={{ background: C.panel, borderColor: 'rgba(79,195,247,0.15)', minWidth: 80 }}>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Swaps</div>
          <div className="text-3xl font-black" style={{ color: C.yellow }}>{swapsUsed}</div>
        </div>
        {/* Min Left — only shown on easy to keep medium/hard challenging */}
        {difficulty === 'easy' && (
          <div className="rounded-xl px-4 py-3 text-center border" style={{ background: C.panel, borderColor: 'rgba(79,195,247,0.15)', minWidth: 80 }}>
            <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Min Left</div>
            <div className="text-3xl font-black" style={{ color: C.blue }}>{remainingSwaps}</div>
          </div>
        )}
        {/* Score */}
        <div className="rounded-xl px-4 py-3 text-center border" style={{ background: C.panel, borderColor: 'rgba(79,195,247,0.15)', minWidth: 80 }}>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Score</div>
          <div className="text-3xl font-black" style={{ color: C.green }}>{score.toLocaleString()}</div>
        </div>
      </div>

      {streak > 1 && (
        <div className="font-mono text-xs animate-pulse" style={{ color: C.yellow }}>
          🔥 {streak} round streak!
        </div>
      )}

      {/* Tiles */}
      <div className="w-full max-w-lg flex flex-col gap-1">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tiles.length}, 1fr)`,
            gap: `${tileConfig.gap}px`,
            padding: `${tileConfig.pad}px`,
            background: C.panel,
            borderRadius: '16px',
            border: `1.5px solid ${isReverseRound ? 'rgba(167,139,250,0.25)' : 'rgba(79,195,247,0.1)'}`,
          }}
        >
          {tiles.map((value, index) => {
            const isLocked = lockedIndices.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleTileClick(index)}
                className={getTileClasses(index)}
                style={{ fontSize: tileConfig.fontSize }}
                disabled={phase !== 'playing'}
              >
                {isLocked ? (
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span>{value}</span>
                    <Lock className="w-2 h-2" style={{ color: C.purple }} />
                  </div>
                ) : value}
              </button>
            );
          })}
        </div>
        {/* Position indices for easy mode */}
        {difficulty === 'easy' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${tiles.length}, 1fr)`,
              gap: `${tileConfig.gap}px`,
              paddingLeft: `${tileConfig.pad}px`,
              paddingRight: `${tileConfig.pad}px`,
            }}
          >
            {tiles.map((_, index) => (
              <span key={index} className="text-center font-mono text-[0.5rem]" style={{ color: C.muted }}>{index + 1}</span>
            ))}
          </div>
        )}
      </div>

      {/* Sort direction label */}
      <div className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: C.muted }}>
        {isReverseRound
          ? <span style={{ color: C.purple }}>Sort: HIGH → LOW</span>
          : <span>Sort: LOW → HIGH</span>
        }
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0 || phase !== 'playing'}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0"
          style={{ background: C.panel, color: C.white, borderColor: 'rgba(79,195,247,0.2)' }}
        >
          <RotateCcw className="w-4 h-4" />
          Undo <span className="text-xs font-black" style={{ color: C.accent }}>−{UNDO_COST}s</span>
        </button>
        <button
          onClick={handleHint}
          disabled={phase !== 'playing' || remainingSwaps === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0"
          style={{ background: C.panel, color: C.white, borderColor: 'rgba(79,195,247,0.2)' }}
        >
          <Lightbulb className="w-4 h-4" style={{ color: C.yellow }} />
          Hint <span className="text-xs font-black" style={{ color: C.accent }}>−{HINT_COST}s</span>
        </button>
      </div>

      {/* Round End overlay */}
      {phase === 'roundEnd' && lastResult && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(26,26,46,0.92)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 text-center border-2"
            style={{
              background: C.panel,
              borderColor: lastResult.label === 'Perfect!' ? C.green : lastResult.label === 'Nice!' ? C.yellow : C.accent,
              boxShadow: `0 0 60px ${lastResult.label === 'Perfect!' ? 'rgba(78,203,113,0.2)' : 'rgba(245,166,35,0.15)'}`,
              animation: 'win-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {/* ── Next round reverse warning ── */}
            {getSortDirection(roundNumber) === 'desc' && (
              <div
                className="rounded-xl px-4 py-3 mb-4 border-2 animate-pulse"
                style={{ background: 'rgba(167,139,250,0.15)', borderColor: C.purple }}
              >
                <div className="text-base font-black tracking-wide" style={{ color: C.purple }}>
                  ⚠️ NEXT ROUND: HIGH → LOW
                </div>
                <div className="font-mono text-[0.65rem] uppercase tracking-widest mt-1" style={{ color: C.muted }}>
                  Reverse round — sort largest first!
                </div>
              </div>
            )}

            {lastResult.direction === 'desc' && (
              <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: C.purple }}>
                ↓ Reverse Round
              </div>
            )}
            <div className="text-4xl mb-2">
              {lastResult.label === 'Perfect!' ? '🏆' : lastResult.label === 'Nice!' ? '⭐' : '✅'}
            </div>
            <div
              className="text-4xl font-black mb-4"
              style={{ color: lastResult.label === 'Perfect!' ? C.green : lastResult.label === 'Nice!' ? C.yellow : C.accent }}
            >
              {lastResult.label}
            </div>

            <div className="font-mono text-sm text-left space-y-2 mb-4 leading-loose" style={{ color: C.muted }}>
              <div className="flex justify-between">
                <span>Your swaps</span>
                <span style={{ color: C.white }}>{lastResult.swapsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum possible</span>
                <span style={{ color: C.white }}>{lastResult.minSwaps}</span>
              </div>
              <div className="flex justify-between">
                <span>Time bonus</span>
                <span style={{ color: C.blue }}>+{lastResult.timeBonus} pts</span>
              </div>
              <div
                className="flex justify-between pt-2 border-t font-black"
                style={{ borderColor: 'rgba(255,255,255,0.08)', color: C.green }}
              >
                <span>Round score</span>
                <span>+{lastResult.roundScore}</span>
              </div>
            </div>

            {/* Efficiency bar */}
            <div className="h-2 rounded-full mb-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${lastResult.efficiency}%`, background: `linear-gradient(90deg, ${C.green}, ${C.blue})` }}
              />
            </div>
            <p className="font-mono text-[0.6rem] text-right mb-4" style={{ color: C.muted }}>
              {lastResult.efficiency}% efficient
            </p>

            <p className="font-mono text-[0.65rem] uppercase tracking-widest animate-pulse" style={{ color: C.muted }}>
              Next round starting…
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortAttack;
