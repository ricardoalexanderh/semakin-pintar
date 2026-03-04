import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Volume2, VolumeX, RotateCcw, Lightbulb, Trophy } from 'lucide-react';
import { trackGameEvent, trackButtonClick, trackGameCompletion } from '../utils/analytics';
import { useGameState } from '../hooks/useGameState';

// === Types ===
type GamePhase = 'setup' | 'countdown' | 'playing' | 'roundEnd' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';

interface RoundResult {
  movesUsed: number;
  minMoves: number;
  efficiency: number;
  timeBonus: number;
  roundScore: number;
  label: 'Perfect!' | 'Nice!' | 'Too slow!';
}

// === Constants ===
const INITIAL_TIME = 45;
const UNDO_COST = 6;
const HINT_COST = 10;
const BASE_SCORE = 1000;
const MOVE_PENALTY = 50;
const TIME_SCORE_RATE = 10;

const BASE_ARRAY_SIZES: Record<Difficulty, number> = { easy: 5, medium: 5, hard: 6 };
const MAX_ARRAY_SIZES:  Record<Difficulty, number> = { easy: 7, medium: 8, hard: 9 };
const BASE_TIME_BONUSES: Record<Difficulty, number> = { easy: 20, medium: 15, hard: 12 };
const MIN_TIME_BONUSES:  Record<Difficulty, number> = { easy: 12, medium: 8, hard: 6 };

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
  orange: '#ff9800',
  white:  '#f0f0f0',
  muted:  '#8892b0',
};

const LS_DIFFICULTY  = 'pairShift_difficulty';
const LS_SOUND       = 'pairShift_sound';
const LS_HIGH_SCORES = 'pairShift_highScores';

const GRID_BG: React.CSSProperties = {
  backgroundImage: `linear-gradient(rgba(255,152,0,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,152,0,0.04) 1px, transparent 1px)`,
  backgroundSize: '40px 40px',
};

// === Helpers ===
const getCurrentArraySize = (difficulty: Difficulty, round: number): number =>
  Math.min(BASE_ARRAY_SIZES[difficulty] + Math.floor(round / 3), MAX_ARRAY_SIZES[difficulty]);

const getCurrentTimeBonus = (difficulty: Difficulty, round: number): number =>
  Math.max(BASE_TIME_BONUSES[difficulty] - Math.floor(round / 3), MIN_TIME_BONUSES[difficulty]);

const isArraySorted = (arr: number[]): boolean =>
  arr.every((v, i) => i === 0 || arr[i - 1] <= v);

const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateRound = (size: number): number[] => {
  const base = Array.from({ length: size }, (_, i) => i + 1);
  let arr: number[];
  do { arr = shuffleArray(base); } while (isArraySorted(arr));
  return arr;
};

/**
 * BFS to compute minimum pair-moves needed to sort the array.
 * Each move: pick adjacent pair (i, i+1), remove them, insert elsewhere.
 */
const computeMinPairMoves = (start: number[]): number => {
  const goal = [...start].sort((a, b) => a - b);
  const startKey = start.join(',');
  const goalKey = goal.join(',');
  if (startKey === goalKey) return 0;

  const queue: [string, number][] = [[startKey, 0]];
  const visited = new Set<string>([startKey]);
  const n = start.length;

  while (queue.length > 0) {
    const [key, moves] = queue.shift()!;
    const current = key.split(',').map(Number);

    for (let i = 0; i < n - 1; i++) {
      const pair = [current[i], current[i + 1]];
      const rest = [...current.slice(0, i), ...current.slice(i + 2)];

      for (let j = 0; j <= rest.length; j++) {
        if (j === i) continue; // no-op: inserts back in same place
        const next = [...rest.slice(0, j), ...pair, ...rest.slice(j)];
        const nextKey = next.join(',');
        if (nextKey === goalKey) return moves + 1;
        if (!visited.has(nextKey)) {
          visited.add(nextKey);
          queue.push([nextKey, moves + 1]);
        }
      }
    }
  }
  return 0;
};

/**
 * Returns a hint: the best adjacent pair to move and where to insert it.
 * Uses a simple greedy heuristic (pick the move that results in the most
 * correct positions / lowest BFS cost from the next state).
 */
const computeHint = (tiles: number[]): { pairIndex: number; gapIndex: number } | null => {
  const n = tiles.length;
  const goal = [...tiles].sort((a, b) => a - b);
  let bestScore = -1;
  let bestMove: { pairIndex: number; gapIndex: number } | null = null;

  for (let i = 0; i < n - 1; i++) {
    const rest = [...tiles.slice(0, i), ...tiles.slice(i + 2)];
    for (let j = 0; j <= rest.length; j++) {
      if (j === i) continue;
      const next = [...rest.slice(0, j), tiles[i], tiles[i + 1], ...rest.slice(j)];
      // Score: count correct positions
      const correct = next.filter((v, idx) => v === goal[idx]).length;
      if (correct > bestScore) {
        bestScore = correct;
        bestMove = { pairIndex: i, gapIndex: j >= i ? j + 2 : j };
      }
    }
  }
  return bestMove;
};

// === Sound ===
const playSound = async (
  type: 'select' | 'pair' | 'move' | 'complete' | 'hint' | 'undo' | 'warn',
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
      const notes:     Record<string, string> = { select: 'E5', pair: 'G5', move: 'G4', hint: 'A4', undo: 'C4', warn: 'C3' };
      const durations: Record<string, string> = { select: '0.1', pair: '0.15', move: '0.2', hint: '0.2', undo: '0.2', warn: '0.1' };
      const synth = makeSynth();
      synth.triggerAttackRelease(notes[type], durations[type]);
      setTimeout(() => synth.dispose(), 1000);
    }
  } catch { /* silent fail */ }
};

// === Component ===
const PairShift: React.FC = () => {
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
  // firstSelected: index of the first clicked card (for pair selection)
  const [firstSelected, setFirstSelected] = useState<number | null>(null);
  // pairSelected: [left index, right index] of confirmed adjacent pair
  const [pairSelected, setPairSelected] = useState<[number, number] | null>(null);
  const [movesUsed, setMovesUsed] = useState(0);
  const [minMoves, setMinMoves] = useState(0);
  const [undoStack, setUndoStack] = useState<number[][]>([]);
  const [hintPair, setHintPair] = useState<{ pairIndex: number; gapIndex: number } | null>(null);
  const [moveAnimating, setMoveAnimating] = useState(false);

  // --- Timer ---
  const timerRef = useRef<number>(INITIAL_TIME);
  const [timerDisplay, setTimerDisplay] = useState<number>(INITIAL_TIME);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Scoring ---
  const [score, setScore] = useState(0);
  const [roundNumber, setRoundNumber] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [efficiencies, setEfficiencies] = useState<number[]>([]);

  const { updateGameState } = useGameState();

  useEffect(() => {
    updateGameState('pair-shift', phase === 'playing' || phase === 'countdown' || phase === 'roundEnd');
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
    trackGameCompletion('pair-shift', score, 0, difficulty);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRound = (roundNum: number) => {
    const size = getCurrentArraySize(difficulty, roundNum);
    const arr = generateRound(size);
    const min = computeMinPairMoves(arr);
    setTiles(arr);
    setMinMoves(min);
    setMovesUsed(0);
    setFirstSelected(null);
    setPairSelected(null);
    setHintPair(null);
    setUndoStack([]);
  };

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
        startRound(0);
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
    trackGameEvent('pair-shift', 'start', { difficulty });
    setPhase('countdown');
  };

  const handleRoundComplete = (totalMoves: number) => {
    const extraMoves = Math.max(0, totalMoves - minMoves);
    const efficiency = totalMoves === 0 ? 100 : Math.round((minMoves / totalMoves) * 100);
    const penalty = extraMoves * MOVE_PENALTY;
    const timeBonusScore = Math.floor(timerRef.current) * TIME_SCORE_RATE;
    const roundScore = Math.max(0, BASE_SCORE - penalty + timeBonusScore);

    const label: RoundResult['label'] =
      extraMoves === 0  ? 'Perfect!' :
      efficiency >= 70  ? 'Nice!'    :
                          'Too slow!';

    const result: RoundResult = {
      movesUsed: totalMoves, minMoves, efficiency,
      timeBonus: timeBonusScore, roundScore, label,
    };
    setLastResult(result);
    setScore(s => s + roundScore);
    setStreak(extraMoves === 0 ? streak + 1 : 0);

    const nextRoundNumber = roundNumber + 1;
    setRoundNumber(nextRoundNumber);
    setEfficiencies(prev => [...prev, efficiency]);

    const bonusSeconds = getCurrentTimeBonus(difficulty, roundNumber);
    timerRef.current = Math.min(timerRef.current + bonusSeconds - extraMoves * 2, 99);

    playSound('complete', soundEnabled);

    setTimeout(() => {
      startRound(nextRoundNumber);
      setLastResult(null);
      setTimerDisplay(timerRef.current);
      setPhase('playing');
    }, 2500);
  };

  /**
   * Applies a pair move: removes the pair at (pairIdx, pairIdx+1)
   * and inserts it so that its first card ends up at gapIndex in the
   * ORIGINAL tile layout (before gaps within the pair are factored out).
   *
   * gapIndex here is in terms of the ORIGINAL tile positions (0..n),
   * meaning "insert before position gapIndex in the original array".
   * We exclude gapIndex === pairIdx (no-op) and gapIndex === pairIdx+2 (no-op).
   */
  const applyPairMove = (currentTiles: number[], pairIdx: number, gapIndex: number): number[] => {
    const pair = [currentTiles[pairIdx], currentTiles[pairIdx + 1]];
    const rest = [...currentTiles.slice(0, pairIdx), ...currentTiles.slice(pairIdx + 2)];

    // Map gapIndex (in original layout, 0..n) to rest insertion position (0..n-2)
    const j = gapIndex <= pairIdx ? gapIndex : gapIndex - 2;

    return [...rest.slice(0, j), ...pair, ...rest.slice(j)];
  };

  const performMove = (pairIdx: number, gapIndex: number) => {
    if (moveAnimating) return;
    const priorTiles = [...tiles];
    const newTiles = applyPairMove(tiles, pairIdx, gapIndex);
    const newMovesCount = movesUsed + 1;

    setMoveAnimating(true);
    setTiles(newTiles);
    setMovesUsed(newMovesCount);
    setUndoStack(prev => [...prev.slice(-4), priorTiles]);
    setPairSelected(null);
    setFirstSelected(null);
    setHintPair(null);
    playSound('move', soundEnabled);

    setTimeout(() => {
      setMoveAnimating(false);
      if (isArraySorted(newTiles)) {
        setPhase('roundEnd');
        handleRoundComplete(newMovesCount);
      }
    }, 200);
  };

  const handleCardClick = (index: number) => {
    if (phase !== 'playing' || moveAnimating) return;
    setHintPair(null);

    if (pairSelected !== null) {
      // A pair is already selected — clicking a card deselects
      setPairSelected(null);
      setFirstSelected(null);
      return;
    }

    if (firstSelected === null) {
      setFirstSelected(index);
      playSound('select', soundEnabled);
    } else if (firstSelected === index) {
      // Clicking same card: deselect
      setFirstSelected(null);
    } else if (Math.abs(firstSelected - index) === 1) {
      // Adjacent click: form a pair (always left index first)
      const left = Math.min(firstSelected, index);
      setPairSelected([left, left + 1]);
      setFirstSelected(null);
      playSound('pair', soundEnabled);
    } else {
      // Non-adjacent click: re-select
      setFirstSelected(index);
      playSound('select', soundEnabled);
    }
  };

  const handleGapClick = (gapIndex: number) => {
    if (phase !== 'playing' || moveAnimating || pairSelected === null) return;
    const [pi] = pairSelected;
    // Invalid (no-op) gaps: pi and pi+2
    if (gapIndex === pi || gapIndex === pi + 2) return;
    // Gap within pair (pi+1) is never rendered as clickable
    performMove(pi, gapIndex);
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || phase !== 'playing') return;
    const prevTiles = undoStack[undoStack.length - 1];
    setTiles(prevTiles);
    setUndoStack(s => s.slice(0, -1));
    setMovesUsed(s => Math.max(0, s - 1));
    timerRef.current = Math.max(1, timerRef.current - UNDO_COST);
    setTimerDisplay(timerRef.current);
    setFirstSelected(null);
    setPairSelected(null);
    setHintPair(null);
    playSound('undo', soundEnabled);
    trackButtonClick('undo', 'pair-shift');
  };

  const handleHint = () => {
    if (phase !== 'playing') return;
    const hint = computeHint(tiles);
    setHintPair(hint);
    timerRef.current = Math.max(1, timerRef.current - HINT_COST);
    setTimerDisplay(timerRef.current);
    if (hint) {
      setFirstSelected(null);
      setPairSelected([hint.pairIndex, hint.pairIndex + 1]);
    }
    playSound('hint', soundEnabled);
    trackButtonClick('hint', 'pair-shift');
  };

  // === Render helpers ===
  const timerColor =
    timerDisplay <= 8  ? `text-[${C.accent}]` :
    timerDisplay <= 15 ? `text-[${C.yellow}]` :
                         `text-[${C.green}]`;
  const timerPulse = timerDisplay <= 8 ? 'animate-pulse' : '';

  const avgEfficiency =
    efficiencies.length > 0
      ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
      : 0;

  const tileSize = tiles.length <= 5 ? 64 : tiles.length <= 7 ? 54 : 44;
  const fontSize  = tiles.length <= 5 ? '1.4rem' : tiles.length <= 7 ? '1.1rem' : '0.9rem';

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
              Pair<span style={{ color: C.orange }}>Shift</span>
            </h1>
            <p className="font-mono text-xs uppercase tracking-[3px] mt-2" style={{ color: C.muted }}>
              pick a pair · slide it · sort
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
                  ? { borderColor: C.orange, color: C.orange, background: 'rgba(255,152,0,0.1)' }
                  : { borderColor: 'rgba(255,152,0,0.15)', color: C.muted, background: C.panel }
                }
              >
                {DIFFICULTY_LABELS[d]} ({BASE_ARRAY_SIZES[d]}+)
              </button>
            ))}
          </div>

          {/* High Scores */}
          <div className="rounded-xl p-4 border" style={{ background: C.panel, borderColor: 'rgba(255,152,0,0.12)' }}>
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
                    ? { borderColor: C.orange, background: 'rgba(255,152,0,0.08)' }
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
            style={{ background: C.panel, borderLeftColor: C.orange, color: C.muted, fontFamily: 'monospace' }}
          >
            <div>
              <span style={{ color: C.white, fontWeight: 700 }}>How to play: </span>
              Click a card, then click an adjacent card to form a <span style={{ color: C.orange }}>pair</span>.
            </div>
            <div>
              Then click any <span style={{ color: C.green }}>▼ gap</span> between the remaining cards to slide the pair there.
            </div>
            <div>Sort all cards lowest → highest in as few pair moves as possible!</div>
            <div>Arrays grow every 3 rounds.</div>
            <div style={{ color: C.accent }}>Undo −{UNDO_COST}s · Hint −{HINT_COST}s</div>
          </div>

          {/* Sound + Start */}
          <div className="flex gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all"
              style={{ background: C.panel, borderColor: 'rgba(255,152,0,0.2)', color: C.muted }}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleStartGame}
              className="flex-1 py-3 rounded-xl font-black text-lg tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: C.orange, color: 'white', boxShadow: '0 4px 20px rgba(255,152,0,0.4)' }}
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
        <p className="font-mono text-sm uppercase tracking-[4px] mb-8" style={{ color: C.orange }}>Get Ready!</p>
        <div
          className={`text-[9rem] font-black leading-none transition-all duration-300 ${countdown === 0 ? 'scale-125' : 'scale-100'}`}
          style={{ color: C.white }}
        >
          {countdown > 0 ? countdown : 'GO!'}
        </div>
        <p className="font-mono text-xs mt-10 uppercase tracking-widest" style={{ color: C.muted }}>
          pick a pair · slide it · sort
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

          <div className="h-2 rounded-full mb-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${avgEfficiency}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.yellow})` }}
            />
          </div>
          <p className="font-mono text-[0.6rem] text-right mb-6" style={{ color: C.muted }}>{avgEfficiency}% efficient</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setScore(0); setRoundNumber(0); setStreak(0); setEfficiencies([]); setLastResult(null);
                trackGameEvent('pair-shift', 'restart', { difficulty });
                setPhase('countdown');
              }}
              className="w-full py-3 rounded-xl font-black tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: C.orange, color: 'white', boxShadow: '0 4px 16px rgba(255,152,0,0.4)' }}
            >
              Play Again →
            </button>
            <button
              onClick={() => setPhase('setup')}
              className="w-full py-3 rounded-xl font-bold border transition-all"
              style={{ background: C.panel, color: C.muted, borderColor: 'rgba(255,152,0,0.2)' }}
            >
              Change Difficulty
            </button>
          </div>
        </div>
      </Page>
    );
  }

  // === Playing Screen (+ Round End overlay) ===
  const n = tiles.length;

  /**
   * Renders the tile row with interactive gap drop zones.
   *
   * Layout:  [Gap0] Tile0 [Gap1] Tile1 ... [GapN]
   *
   * When a pair is selected at (pi, pi+1):
   *   - Tiles pi and pi+1 show as the selected pair (orange highlight)
   *   - Gap(pi) and Gap(pi+2) are no-op → shown as disabled dividers
   *   - Gap(pi+1) is between pair tiles → hidden
   *   - All other gaps are valid drop zones → shown as clickable buttons
   */
  const renderTiles = () => {
    const pi = pairSelected ? pairSelected[0] : -1;
    const elements: React.ReactNode[] = [];

    for (let i = 0; i <= n; i++) {
      // Render gap before tile[i] (or final gap after last tile)
      const isWithinPair = pairSelected && i === pi + 1; // gap between pair tiles
      const isNoop       = pairSelected && (i === pi || i === pi + 2);
      const isValidDrop  = pairSelected && !isWithinPair && !isNoop;

      if (!isWithinPair) {
        elements.push(
          <button
            key={`gap-${i}`}
            onClick={() => isValidDrop ? handleGapClick(i) : undefined}
            className="flex items-center justify-center transition-all duration-150"
            style={{
              width: isValidDrop ? 24 : 8,
              minWidth: isValidDrop ? 24 : 8,
              height: tileSize,
              cursor: isValidDrop ? 'pointer' : 'default',
              borderRadius: 6,
              background: isValidDrop
                ? 'rgba(78,203,113,0.15)'
                : 'transparent',
              border: isValidDrop ? `1.5px dashed ${C.green}` : 'none',
              flexShrink: 0,
            }}
          >
            {isValidDrop && (
              <span style={{ color: C.green, fontSize: '0.7rem', fontWeight: 900, lineHeight: 1 }}>▼</span>
            )}
          </button>
        );
      }

      if (i === n) break;

      // Render tile[i]
      const isPair       = pairSelected && (i === pi || i === pi + 1);
      const isFirst      = firstSelected === i;
      const isHintPair   = hintPair && (i === hintPair.pairIndex || i === hintPair.pairIndex + 1);
      const isSorted     = phase === 'roundEnd';
      const isGoalPos    = tiles[i] === i + 1;

      let bg: string;
      let border: string;
      let textColor: string = C.white;
      let transform: string = '';
      let shadow: string = '';
      let cursor: string = 'pointer';

      if (isSorted) {
        bg = '#1a3a2a'; border = C.green; textColor = C.green;
      } else if (isPair) {
        bg = 'rgba(255,152,0,0.25)'; border = C.orange; transform = 'translateY(-8px) scale(1.08)';
        shadow = '0 12px 28px rgba(255,152,0,0.4)'; textColor = C.orange;
      } else if (isFirst) {
        bg = 'rgba(233,69,96,0.2)'; border = C.accent; transform = 'translateY(-4px) scale(1.04)';
        shadow = '0 8px 20px rgba(233,69,96,0.35)'; textColor = C.accent;
      } else if (isHintPair) {
        bg = C.card; border = C.yellow; textColor = C.yellow;
        shadow = '0 0 16px rgba(245,166,35,0.35)';
      } else if (isGoalPos && phase === 'playing') {
        bg = 'rgba(79,195,247,0.08)'; border = 'rgba(79,195,247,0.3)';
      } else {
        bg = C.card; border = 'rgba(255,152,0,0.15)';
      }

      elements.push(
        <button
          key={`tile-${i}`}
          onClick={() => handleCardClick(i)}
          disabled={phase !== 'playing'}
          className="flex items-center justify-center rounded-[12px] font-black select-none transition-all duration-150 border-[2.5px] flex-shrink-0"
          style={{
            width: tileSize,
            height: tileSize,
            fontSize,
            background: bg,
            borderColor: border,
            color: textColor,
            transform,
            boxShadow: shadow,
            cursor: phase !== 'playing' ? 'default' : cursor,
            zIndex: isPair || isFirst ? 10 : 1,
            position: 'relative',
          }}
        >
          {tiles[i]}
        </button>
      );
    }
    return elements;
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center pt-6 pb-8 px-4 gap-5"
      style={{ backgroundColor: C.bg, color: C.white, ...GRID_BG }}
    >
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: C.white }}>
          Pair<span style={{ color: C.orange }}>Shift</span>
        </h1>
        <p className="font-mono text-[0.6rem] uppercase tracking-[3px] mt-0.5" style={{ color: C.muted }}>
          pick a pair · slide it · sort
        </p>
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-2">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <div
            key={d}
            className="font-mono text-[0.6rem] uppercase tracking-wider px-3 py-1 rounded-lg border"
            style={difficulty === d
              ? { borderColor: C.orange, color: C.orange, background: 'rgba(255,152,0,0.1)' }
              : { borderColor: 'rgba(255,152,0,0.1)', color: C.muted, background: C.panel }
            }
          >
            {DIFFICULTY_LABELS[d]}
          </div>
        ))}
      </div>

      {/* HUD */}
      <div className="flex gap-3 justify-center flex-wrap">
        {/* Timer */}
        <div className="rounded-xl px-4 py-3 text-center border" style={{ background: C.panel, borderColor: 'rgba(255,152,0,0.15)', minWidth: 80 }}>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Time</div>
          <div className={`text-3xl font-black tabular-nums ${timerColor} ${timerPulse}`}>
            {Math.ceil(timerDisplay)}
          </div>
        </div>
        {/* Moves */}
        <div className="rounded-xl px-4 py-3 text-center border" style={{ background: C.panel, borderColor: 'rgba(255,152,0,0.15)', minWidth: 80 }}>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Moves</div>
          <div className="text-3xl font-black" style={{ color: C.orange }}>{movesUsed}</div>
        </div>
        {/* Min moves — only on easy */}
        {difficulty === 'easy' && (
          <div className="rounded-xl px-4 py-3 text-center border" style={{ background: C.panel, borderColor: 'rgba(255,152,0,0.15)', minWidth: 80 }}>
            <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Min</div>
            <div className="text-3xl font-black" style={{ color: C.blue }}>{minMoves}</div>
          </div>
        )}
        {/* Score */}
        <div className="rounded-xl px-4 py-3 text-center border" style={{ background: C.panel, borderColor: 'rgba(255,152,0,0.15)', minWidth: 80 }}>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Score</div>
          <div className="text-3xl font-black" style={{ color: C.green }}>{score.toLocaleString()}</div>
        </div>
      </div>

      {streak > 1 && (
        <div className="font-mono text-xs animate-pulse" style={{ color: C.yellow }}>
          🔥 {streak} round streak!
        </div>
      )}

      {/* Instruction hint */}
      <div
        className="font-mono text-[0.65rem] uppercase tracking-wider px-4 py-2 rounded-lg border"
        style={{
          background: C.panel,
          borderColor: pairSelected ? `rgba(78,203,113,0.3)` : firstSelected !== null ? `rgba(233,69,96,0.3)` : 'rgba(255,152,0,0.15)',
          color: pairSelected ? C.green : firstSelected !== null ? C.accent : C.muted,
        }}
      >
        {pairSelected
          ? '▼ Click a green gap to drop the pair'
          : firstSelected !== null
          ? 'Click an adjacent card to form a pair'
          : 'Click any card to start'
        }
      </div>

      {/* Tiles + Gaps */}
      <div
        className="w-full flex justify-center"
        style={{ padding: '16px', background: C.panel, borderRadius: 16, border: `1.5px solid rgba(255,152,0,0.12)`, maxWidth: 600 }}
      >
        <div className="flex items-center" style={{ gap: 0 }}>
          {renderTiles()}
        </div>
      </div>

      {/* Target arrangement label */}
      <div className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: C.muted }}>
        Sort: LOW → HIGH &nbsp;
        <span style={{ color: C.orange }}>
          [{Array.from({ length: n }, (_, i) => i + 1).join('][')}]
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0 || phase !== 'playing'}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0"
          style={{ background: C.panel, color: C.white, borderColor: 'rgba(255,152,0,0.2)' }}
        >
          <RotateCcw className="w-4 h-4" />
          Undo <span className="text-xs font-black" style={{ color: C.accent }}>−{UNDO_COST}s</span>
        </button>
        <button
          onClick={handleHint}
          disabled={phase !== 'playing' || isArraySorted(tiles)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0"
          style={{ background: C.panel, color: C.white, borderColor: 'rgba(255,152,0,0.2)' }}
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
                <span>Your moves</span>
                <span style={{ color: C.white }}>{lastResult.movesUsed}</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum possible</span>
                <span style={{ color: C.white }}>{lastResult.minMoves}</span>
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

            <div className="h-2 rounded-full mb-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${lastResult.efficiency}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.yellow})` }}
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

export default PairShift;
