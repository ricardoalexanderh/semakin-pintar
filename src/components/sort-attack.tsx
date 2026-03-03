import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Volume2, VolumeX, RotateCcw, Lightbulb, Trophy, ArrowUpDown } from 'lucide-react';
import { trackGameEvent, trackButtonClick, trackGameCompletion } from '../utils/analytics';
import { useGameState } from '../hooks/useGameState';

// === Types ===
type GamePhase = 'setup' | 'countdown' | 'playing' | 'roundEnd' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  arraySize: number;
  timeBonus: number;
  label: string;
}

interface RoundResult {
  swapsUsed: number;
  minSwaps: number;
  efficiency: number;
  timeBonus: number;
  roundScore: number;
  label: 'Perfect!' | 'Nice!' | 'Too slow!';
}

// === Constants ===
const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { arraySize: 4, timeBonus: 15, label: 'Easy' },
  medium: { arraySize: 6, timeBonus: 20, label: 'Medium' },
  hard:   { arraySize: 9, timeBonus: 25, label: 'Hard' },
};

const INITIAL_TIME = 30;
const UNDO_COST = 3;
const HINT_COST = 5;
const BASE_SCORE = 1000;
const SWAP_PENALTY = 50;
const TIME_SCORE_RATE = 10;

const TILE_SIZES: Record<Difficulty, string> = {
  easy:   'w-16 h-16 text-2xl sm:w-20 sm:h-20 sm:text-3xl',
  medium: 'w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl',
  hard:   'w-12 h-12 text-lg sm:w-14 sm:h-14 sm:text-xl',
};

const LS_DIFFICULTY  = 'sortAttack_difficulty';
const LS_SOUND       = 'sortAttack_sound';
const LS_HIGH_SCORES = 'sortAttack_highScores';

// === Algorithms ===
const countInversions = (arr: number[]): number => {
  let count = 0;
  for (let i = 0; i < arr.length - 1; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (arr[i] > arr[j]) count++;
  return count;
};

const generateShuffledArray = (size: number): number[] => {
  const base = Array.from({ length: size }, (_, i) => i + 1);
  let arr: number[];
  do {
    arr = [...base];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (arr.every((v, i) => v === i + 1));
  return arr;
};

const isArraySorted = (arr: number[]) => arr.every((v, i) => i === 0 || arr[i - 1] <= v);

const findFirstInversion = (arr: number[]): [number, number] | null => {
  for (let i = 0; i < arr.length - 1; i++)
    if (arr[i] > arr[i + 1]) return [i, i + 1];
  return null;
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
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
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
  // --- Settings (persisted) ---
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

  // Hide floating buttons while game is active
  useEffect(() => {
    updateGameState('sort-attack', phase === 'playing' || phase === 'countdown' || phase === 'roundEnd');
  }, [phase, updateGameState]);

  // Persist settings
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

  // Update high score + analytics when game ends
  useEffect(() => {
    if (phase !== 'gameover') return;
    setHighScores(prev => {
      const next = { ...prev, [difficulty]: Math.max(prev[difficulty] || 0, score) };
      localStorage.setItem(LS_HIGH_SCORES, JSON.stringify(next));
      return next;
    });
    trackGameCompletion('sort-attack', score, 0, difficulty);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown → start round
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        const arr = generateShuffledArray(DIFFICULTY_CONFIG[difficulty].arraySize);
        setTiles(arr);
        setOriginalTiles(arr);
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
    const minSwaps = countInversions(originalTiles);
    const extraSwaps = Math.max(0, totalSwaps - minSwaps);
    const efficiency = totalSwaps === 0 ? 100 : Math.round((minSwaps / totalSwaps) * 100);
    const penalty = extraSwaps * SWAP_PENALTY;
    const timeBonusScore = Math.floor(timerRef.current) * TIME_SCORE_RATE;
    const roundScore = Math.max(0, BASE_SCORE - penalty + timeBonusScore);

    const label: RoundResult['label'] =
      extraSwaps === 0    ? 'Perfect!' :
      efficiency >= 70   ? 'Nice!'     :
                           'Too slow!';

    const result: RoundResult = { swapsUsed: totalSwaps, minSwaps, efficiency, timeBonus: timeBonusScore, roundScore, label };
    setLastResult(result);
    setScore(s => s + roundScore);
    setStreak(extraSwaps === 0 ? streak + 1 : 0);
    setRoundNumber(r => r + 1);
    setEfficiencies(prev => [...prev, efficiency]);

    const { timeBonus: bonusSeconds } = DIFFICULTY_CONFIG[difficulty];
    const timePenalty = extraSwaps * 2;
    timerRef.current = Math.min(timerRef.current + bonusSeconds - timePenalty, 99);

    playSound('complete', soundEnabled);

    setTimeout(() => {
      const arr = generateShuffledArray(DIFFICULTY_CONFIG[difficulty].arraySize);
      setTiles(arr);
      setOriginalTiles(arr);
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

      if (isArraySorted(newTiles)) {
        setPhase('roundEnd');
        handleRoundComplete(newSwapsCount);
      }
    }, 150);
  };

  const handleTileClick = (index: number) => {
    if (phase !== 'playing' || swapAnimating) return;
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
    const pair = findFirstInversion(tiles);
    setHintPair(pair);
    timerRef.current = Math.max(1, timerRef.current - HINT_COST);
    setTimerDisplay(timerRef.current);
    playSound('hint', soundEnabled);
    trackButtonClick('hint', 'sort-attack');
  };

  const getTileClasses = (index: number): string => {
    const isSelected  = selectedIndex === index;
    const isAdjacent  = selectedIndex !== null && Math.abs(selectedIndex - index) === 1;
    const isHinted    = hintPair?.includes(index) ?? false;
    const isSorted    = phase === 'roundEnd';
    const isSwapping  = swapAnimating?.includes(index) ?? false;

    const classes: string[] = [
      'flex items-center justify-center rounded-2xl font-bold select-none cursor-pointer',
      'transition-all duration-150 border-2',
      TILE_SIZES[difficulty],
    ];

    if (isSorted) {
      classes.push('bg-green-500 border-green-400 text-white scale-105');
    } else if (isSelected) {
      classes.push('bg-purple-500 border-purple-400 text-white scale-110 shadow-lg shadow-purple-900/50');
    } else if (isHinted) {
      classes.push('bg-yellow-400 border-yellow-300 text-gray-900 animate-pulse');
    } else if (isAdjacent) {
      classes.push('border-purple-400 bg-purple-900/40 text-white animate-pulse');
    } else {
      classes.push('bg-gray-700 border-gray-600 text-white hover:border-purple-400 hover:bg-gray-600');
    }
    if (isSwapping) classes.push('scale-95 opacity-70');

    return classes.join(' ');
  };

  const timerColor =
    timerDisplay <= 8  ? 'text-red-400'    :
    timerDisplay <= 15 ? 'text-yellow-400' :
                         'text-emerald-400';
  const timerPulse = timerDisplay <= 8 ? 'animate-pulse' : '';

  const avgEfficiency =
    efficiencies.length > 0
      ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
      : 0;

  // === Setup Screen ===
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-8">
          {/* Title */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-900/50">
                <ArrowUpDown className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Sort Attack</h1>
            <p className="text-gray-400 text-sm">Sort scrambled numbers using only adjacent swaps. Race the clock!</p>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-3 text-center">Difficulty</p>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 px-1 rounded-xl font-semibold text-sm transition-all border-2 ${
                    difficulty === d
                      ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-900/50 scale-105'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-cyan-500 hover:bg-gray-600'
                  }`}
                >
                  <div>{DIFFICULTY_CONFIG[d].label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{DIFFICULTY_CONFIG[d].arraySize} tiles</div>
                </button>
              ))}
            </div>
          </div>

          {/* High Scores */}
          <div className="mb-6 bg-gray-700/50 rounded-2xl p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-300">High Scores</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <div
                  key={d}
                  className={`text-center p-2 rounded-xl ${difficulty === d ? 'bg-cyan-900/50 border border-cyan-600' : ''}`}
                >
                  <div className="text-xs text-gray-400">{DIFFICULTY_CONFIG[d].label}</div>
                  <div className="text-lg font-bold text-white">{highScores[d] || 0}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-full mb-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 transition-colors text-sm"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Sound {soundEnabled ? 'On' : 'Off'}
          </button>

          {/* Start */}
          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-cyan-900/50 hover:shadow-xl transition-all active:scale-95"
          >
            Start Game
          </button>

          {/* Instructions */}
          <div className="mt-6 text-xs text-gray-500 space-y-1">
            <p>• Click a tile to select it (purple highlight)</p>
            <p>• Click an adjacent tile to swap them</p>
            <p>• Sort all numbers from smallest to largest</p>
            <p>• Complete rounds quickly to earn bonus time</p>
          </div>
        </div>
      </div>
    );
  }

  // === Countdown Screen ===
  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cyan-400 text-xl mb-6 font-semibold tracking-widest uppercase">Get Ready!</p>
          <div
            className={`text-9xl font-black text-white drop-shadow-2xl transition-all duration-300 ${
              countdown === 0 ? 'scale-125' : 'scale-100'
            }`}
          >
            {countdown > 0 ? countdown : 'GO!'}
          </div>
          <p className="text-gray-500 text-sm mt-8">Use only adjacent swaps to sort</p>
        </div>
      </div>
    );
  }

  // === Game Over Screen ===
  if (phase === 'gameover') {
    const finalHighScore = Math.max(highScores[difficulty] || 0, score);
    const isNewHighScore = score > 0 && score >= (highScores[difficulty] || 0);

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-8 text-center">
          <div className="text-5xl mb-3">⏰</div>
          <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>

          {isNewHighScore && (
            <div className="bg-yellow-900/40 border border-yellow-600 rounded-xl px-4 py-2 mb-4 text-yellow-400 font-semibold text-sm">
              🏆 New High Score!
            </div>
          )}

          <div className="bg-gray-700/50 rounded-2xl p-6 mb-6 space-y-3 border border-gray-600">
            <div>
              <div className="text-sm text-gray-400 mb-1">Final Score</div>
              <div className="text-5xl font-black text-cyan-400">{score.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gray-700 rounded-xl p-3 border border-gray-600">
                <div className="text-xs text-gray-400">Rounds</div>
                <div className="text-xl font-bold text-white">{roundNumber}</div>
              </div>
              <div className="bg-gray-700 rounded-xl p-3 border border-gray-600">
                <div className="text-xs text-gray-400">Avg Efficiency</div>
                <div className="text-xl font-bold text-white">{avgEfficiency}%</div>
              </div>
            </div>
            <div className="bg-gray-700 rounded-xl p-3 border border-gray-600">
              <div className="text-xs text-gray-400">High Score ({DIFFICULTY_CONFIG[difficulty].label})</div>
              <div className="text-xl font-bold text-yellow-400">{finalHighScore.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setScore(0);
                setRoundNumber(0);
                setStreak(0);
                setEfficiencies([]);
                setLastResult(null);
                trackGameEvent('sort-attack', 'restart', { difficulty });
                setPhase('countdown');
              }}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-900/50 transition-all active:scale-95"
            >
              Play Again
            </button>
            <button
              onClick={() => setPhase('setup')}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-semibold rounded-2xl transition-colors"
            >
              Change Difficulty
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === Playing Screen (+ RoundEnd overlay) ===
  const remainingSwaps = countInversions(tiles);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start p-4 pt-6">
      {/* Timer + Score row */}
      <div className="w-full max-w-lg mb-5">
        <div className="flex items-center justify-between bg-gray-800 rounded-2xl border border-gray-700 px-5 py-3">
          <div className="text-center min-w-[60px]">
            <div className="text-xs text-gray-500 font-medium">Score</div>
            <div className="text-xl font-bold text-white tabular-nums">{score.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className={`text-5xl font-black tabular-nums ${timerColor} ${timerPulse}`}>
              {Math.ceil(timerDisplay)}
            </div>
            <div className="text-xs text-gray-500">seconds</div>
          </div>
          <div className="text-center min-w-[60px]">
            <div className="text-xs text-gray-500 font-medium">Round</div>
            <div className="text-xl font-bold text-white">{roundNumber + 1}</div>
          </div>
        </div>

        {streak > 1 && (
          <div className="text-center mt-2 text-sm text-orange-400 font-semibold animate-pulse">
            🔥 {streak} round streak!
          </div>
        )}
      </div>

      {/* Swaps info */}
      <div className="mb-4 text-center">
        <span className="text-sm text-gray-500">
          Swaps used: <span className="font-bold text-purple-400">{swapsUsed}</span>
          {'  ·  '}
          Min left: <span className="font-bold text-emerald-400">{remainingSwaps}</span>
        </span>
      </div>

      {/* Tiles */}
      <div className="flex flex-wrap justify-center gap-3 mb-6 px-2 max-w-lg">
        {tiles.map((value, index) => (
          <button
            key={index}
            onClick={() => handleTileClick(index)}
            className={getTileClasses(index)}
            disabled={phase !== 'playing'}
          >
            {value}
          </button>
        ))}
      </div>

      {/* Undo + Hint */}
      <div className="flex gap-3">
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0 || phase !== 'playing'}
          className="flex items-center gap-2 px-5 py-3 bg-gray-800 rounded-2xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Undo <span className="text-red-400 text-xs font-bold">−{UNDO_COST}s</span>
        </button>
        <button
          onClick={handleHint}
          disabled={phase !== 'playing' || remainingSwaps === 0}
          className="flex items-center gap-2 px-5 py-3 bg-gray-800 rounded-2xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          Hint <span className="text-red-400 text-xs font-bold">−{HINT_COST}s</span>
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-600">{DIFFICULTY_CONFIG[difficulty].label} Mode</div>

      {/* Round End overlay */}
      {phase === 'roundEnd' && lastResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-8 max-w-sm w-full text-center">
            <div
              className={`text-5xl font-black mb-5 ${
                lastResult.label === 'Perfect!' ? 'text-green-400' :
                lastResult.label === 'Nice!'    ? 'text-yellow-400' :
                                                  'text-orange-400'
              }`}
            >
              {lastResult.label}
            </div>

            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-400">Swaps used</span>
                <span className="font-bold text-white">
                  {lastResult.swapsUsed}
                  <span className="text-gray-500 font-normal"> (min: {lastResult.minSwaps})</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Efficiency</span>
                <span className="font-bold text-white">{lastResult.efficiency}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time Bonus</span>
                <span className="font-bold text-cyan-400">+{lastResult.timeBonus} pts</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                <span className="font-semibold text-gray-300">Round Score</span>
                <span className="font-black text-purple-400">+{lastResult.roundScore} pts</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 animate-pulse">Next round starting…</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortAttack;
