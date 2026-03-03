import { useState, useEffect, useRef, useCallback } from 'react';
import { trackGameEvent, trackButtonClick, trackSettingsChange } from '../utils/analytics';

// ============================================================
// TYPES
// ============================================================

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'setup' | 'playing' | 'round-clear' | 'game-over';

interface Card {
  id: number;
  type: 'equation' | 'answer';
  display: string;
  answer: number;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================

const DIFFICULTY_CONFIG: Record<Difficulty, { startTime: number; startPairs: number }> = {
  easy:   { startTime: 90, startPairs: 4 },
  medium: { startTime: 75, startPairs: 6 },
  hard:   { startTime: 60, startPairs: 8 },
};

const TIMER_WRONG_PENALTY   = 3;
const TIMER_MATCH_BONUS     = 2;
const TIMER_ROUND_BONUS     = 15;
const SCORE_CORRECT_MATCH   = 50;
const SCORE_WRONG_PENALTY   = 10;
const SCORE_ROUND_BONUS_PER = 100;
const MAX_PAIRS             = 10;

// ============================================================
// SOUND EFFECTS  (Web Audio API – no external dependency)
// ============================================================

function playSound(type: 'flip' | 'match' | 'wrong' | 'roundClear' | 'gameOver') {
  try {
    const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const note = (freq: number, dur: number, delay = 0, wave: OscillatorType = 'sine') => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.05);
    };

    switch (type) {
      case 'flip':       note(660, 0.07, 0, 'square'); break;
      case 'match':
        note(523, 0.10, 0);
        note(659, 0.10, 0.10);
        note(784, 0.18, 0.20);
        break;
      case 'wrong':
        note(220, 0.12, 0,    'sawtooth');
        note(165, 0.12, 0.13, 'sawtooth');
        break;
      case 'roundClear':
        note(523,  0.10, 0);
        note(659,  0.10, 0.10);
        note(784,  0.10, 0.20);
        note(1047, 0.28, 0.30);
        break;
      case 'gameOver':
        note(330, 0.18, 0);
        note(277, 0.18, 0.20);
        note(220, 0.35, 0.40);
        break;
    }
  } catch {
    // Web Audio API not supported – silent fail
  }
}

// ============================================================
// MATH GENERATION
// ============================================================

function generateEquation(
  round: number,
  usedAnswers: Set<number>
): { equation: string; answer: number } | null {
  const ops: Array<'add' | 'sub' | 'mul' | 'div' | 'sq'> = ['add', 'sub'];
  if (round >= 2) ops.push('mul');
  if (round >= 3) ops.push('div', 'sq');

  for (let attempt = 0; attempt < 200; attempt++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    let equation = '';
    let answer = 0;

    if (op === 'add') {
      const max = round <= 1 ? 10 : round <= 2 ? 20 : 40;
      const a = Math.floor(Math.random() * max) + 1;
      const b = Math.floor(Math.random() * max) + 1;
      answer   = a + b;
      equation = `${a} + ${b}`;

    } else if (op === 'sub') {
      const max = round <= 1 ? 12 : round <= 2 ? 25 : 50;
      const a = Math.floor(Math.random() * max) + 2;
      const b = Math.floor(Math.random() * (a - 1)) + 1;
      answer   = a - b;
      equation = `${a} − ${b}`;

    } else if (op === 'mul') {
      const maxF = round <= 3 ? 9 : 12;
      const a = Math.floor(Math.random() * (maxF - 1)) + 2;
      const b = Math.floor(Math.random() * (maxF - 1)) + 2;
      answer   = a * b;
      equation = `${a} × ${b}`;

    } else if (op === 'div') {
      const divisor  = Math.floor(Math.random() * 8) + 2;
      const quotient = Math.floor(Math.random() * 9) + 2;
      answer   = quotient;
      equation = `${divisor * quotient} ÷ ${divisor}`;

    } else {
      // sq – base 2-9
      const base = Math.floor(Math.random() * 8) + 2;
      answer   = base * base;
      equation = `${base}²`;
    }

    if (answer > 0 && !usedAnswers.has(answer)) {
      return { equation, answer };
    }
  }
  return null;
}

function buildCards(round: number, pairCount: number): Card[] {
  const usedAnswers = new Set<number>();
  const cards: Card[] = [];
  let id = 0;

  for (let pairId = 0; pairId < pairCount; pairId++) {
    const eq = generateEquation(round, usedAnswers);
    if (!eq) continue;
    usedAnswers.add(eq.answer);

    cards.push({ id: id++, type: 'equation', display: eq.equation,   answer: eq.answer, pairId, isFlipped: false, isMatched: false });
    cards.push({ id: id++, type: 'answer',   display: String(eq.answer), answer: eq.answer, pairId, isFlipped: false, isMatched: false });
  }

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// ============================================================
// GRID LAYOUT HELPER
// ============================================================

function getGridCols(cardCount: number): string {
  if (cardCount <= 8)  return 'grid-cols-4';
  if (cardCount <= 12) return 'grid-cols-4 sm:grid-cols-6';
  if (cardCount <= 16) return 'grid-cols-4';
  return 'grid-cols-4 sm:grid-cols-5';
}

// ============================================================
// TIME FORMATTER
// ============================================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const MathFlipGame: React.FC = () => {
  const [phase,        setPhase]        = useState<GamePhase>('setup');
  const [difficulty,   setDifficulty]   = useState<Difficulty>('easy');
  const [cards,        setCards]        = useState<Card[]>([]);
  const [flippedIds,   setFlippedIds]   = useState<number[]>([]);
  const [timeLeft,     setTimeLeft]     = useState(90);
  const [round,        setRound]        = useState(1);
  const [score,        setScore]        = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong,   setTotalWrong]   = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [timerFlash,   setTimerFlash]   = useState<'none' | 'red' | 'green'>('none');
  const [shakeIds,     setShakeIds]     = useState<Set<number>>(new Set());
  const [roundClearInfo, setRoundClearInfo] = useState<{ roundNum: number; pairsCount: number } | null>(null);

  const isProcessingRef = useRef(false);
  const roundRef        = useRef(round);
  const scoreRef        = useRef(score);
  const difficultyRef   = useRef(difficulty);

  useEffect(() => { roundRef.current      = round;      }, [round]);
  useEffect(() => { scoreRef.current      = score;      }, [score]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // ── Timer ────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Game over when timer hits 0
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      playSound('gameOver');
      setPhase('game-over');
      trackGameEvent('math-flip', 'complete', { round: roundRef.current, score: scoreRef.current });
    }
  }, [timeLeft, phase]);

  // ── Flash helper ─────────────────────────────────────────

  const flashTimer = useCallback((color: 'red' | 'green') => {
    setTimerFlash(color);
    setTimeout(() => setTimerFlash('none'), 800);
  }, []);

  // ── Start / Restart ──────────────────────────────────────

  const startGame = useCallback((diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    isProcessingRef.current = false;
    setDifficulty(diff);
    setRound(1);
    setScore(0);
    setTimeLeft(config.startTime);
    setCards(buildCards(1, config.startPairs));
    setFlippedIds([]);
    setTotalCorrect(0);
    setTotalWrong(0);
    setTotalMatched(0);
    setTimerFlash('none');
    setShakeIds(new Set());
    setRoundClearInfo(null);
    setPhase('playing');
    trackGameEvent('math-flip', 'start', { difficulty: diff });
    trackSettingsChange('difficulty', diff, 'math-flip');
  }, []);

  // ── Next Round ───────────────────────────────────────────

  const startNextRound = useCallback(() => {
    const newRound   = roundRef.current + 1;
    const basePairs  = DIFFICULTY_CONFIG[difficultyRef.current].startPairs;
    const pairCount  = Math.min(basePairs + (newRound - 1), MAX_PAIRS);
    isProcessingRef.current = false;
    setRound(newRound);
    setCards(buildCards(newRound, pairCount));
    setFlippedIds([]);
    setTimerFlash('none');
    setShakeIds(new Set());
    setRoundClearInfo(null);
    setPhase('playing');
  }, []);

  // Trigger next round after round-clear overlay (1.8 s)
  useEffect(() => {
    if (phase !== 'round-clear') return;
    const t = setTimeout(startNextRound, 1800);
    return () => clearTimeout(t);
  }, [phase, startNextRound]);

  // ── Card Click ───────────────────────────────────────────

  const handleCardClick = useCallback((cardId: number) => {
    if (isProcessingRef.current || phase !== 'playing') return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    playSound('flip');
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));

    if (flippedIds.length === 0) {
      setFlippedIds([cardId]);
      return;
    }

    // Second card flipped – evaluate match
    isProcessingRef.current = true;
    setFlippedIds([]);

    const firstId   = flippedIds[0];
    const firstCard = cards.find(c => c.id === firstId)!;
    const isMatch   = firstCard.answer === card.answer && firstCard.type !== card.type;

    if (isMatch) {
      // ── Correct match ──────────────────────────────────
      playSound('match');
      setCards(prev => prev.map(c =>
        c.id === firstId || c.id === cardId ? { ...c, isFlipped: true, isMatched: true } : c
      ));
      setTimeLeft(prev => prev + TIMER_MATCH_BONUS);
      setScore(prev => Math.max(0, prev + SCORE_CORRECT_MATCH));
      setTotalCorrect(prev => prev + 1);
      setTotalMatched(prev => prev + 1);
      flashTimer('green');

      // Check round complete (currentMatched + 2 new = all cards)
      const currentlyMatched = cards.filter(c => c.isMatched).length;
      if (currentlyMatched + 2 === cards.length) {
        const thisRound  = roundRef.current;
        const thisPairs  = cards.length / 2;
        setTimeout(() => {
          playSound('roundClear');
          setTimeLeft(prev => prev + TIMER_ROUND_BONUS);
          setScore(prev => Math.max(0, prev + SCORE_ROUND_BONUS_PER * thisRound));
          setRoundClearInfo({ roundNum: thisRound, pairsCount: thisPairs });
          setPhase('round-clear');
          isProcessingRef.current = false;
        }, 400);
      } else {
        isProcessingRef.current = false;
      }

    } else {
      // ── Wrong match ────────────────────────────────────
      playSound('wrong');
      setShakeIds(new Set([firstId, cardId]));
      setTimeLeft(prev => Math.max(0, prev - TIMER_WRONG_PENALTY));
      setScore(prev => Math.max(0, prev - SCORE_WRONG_PENALTY));
      setTotalWrong(prev => prev + 1);
      flashTimer('red');

      setTimeout(() => {
        setCards(prev => prev.map(c =>
          c.id === firstId || c.id === cardId ? { ...c, isFlipped: false } : c
        ));
        setShakeIds(new Set());
        isProcessingRef.current = false;
      }, 900);
    }
  }, [cards, flippedIds, phase, flashTimer]);

  // ── Derived ──────────────────────────────────────────────

  const timerIsLow = timeLeft <= 10 && phase === 'playing';

  // ============================================================
  // RENDER: SETUP
  // ============================================================

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">

          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🃏</div>
            <h1 className="text-4xl md:text-5xl font-bold text-green-900 mb-2">Math Flip</h1>
            <p className="text-green-700 text-lg">Match equations with their answers!</p>
          </div>

          {/* How to play */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-green-200 shadow-md">
            <h2 className="font-bold text-green-800 text-lg mb-3">How to Play</h2>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex gap-2 items-start"><span className="mt-0.5">🔄</span><span>Flip two cards to find a matching equation + answer pair</span></li>
              <li className="flex gap-2 items-start"><span className="mt-0.5">✅</span><span>Correct match: <strong className="text-green-800">+{TIMER_MATCH_BONUS}s &amp; +{SCORE_CORRECT_MATCH} pts</strong></span></li>
              <li className="flex gap-2 items-start"><span className="mt-0.5">❌</span><span>Wrong flip: <strong className="text-red-600">−{TIMER_WRONG_PENALTY}s &amp; −{SCORE_WRONG_PENALTY} pts</strong></span></li>
              <li className="flex gap-2 items-start"><span className="mt-0.5">⭐</span><span>Clear the board: <strong className="text-amber-700">+{TIMER_ROUND_BONUS}s bonus!</strong></span></li>
              <li className="flex gap-2 items-start"><span className="mt-0.5">⏱</span><span>The countdown is your only life — don't let it hit <strong>0:00</strong>!</span></li>
            </ul>
          </div>

          {/* Difficulty buttons */}
          <div className="space-y-3">
            <h2 className="text-center font-bold text-green-800 text-lg">Choose Difficulty</h2>

            {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => {
              const cfg = DIFFICULTY_CONFIG[diff];
              const gradients: Record<Difficulty, string> = {
                easy:   'from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600',
                medium: 'from-amber-400   to-orange-500 hover:from-amber-500   hover:to-orange-600',
                hard:   'from-red-400     to-rose-500   hover:from-red-500     hover:to-rose-600',
              };
              const emojis: Record<Difficulty, string> = { easy: '🌱', medium: '🌿', hard: '🔥' };
              const labels: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

              return (
                <button
                  key={diff}
                  onClick={() => {
                    trackButtonClick(`difficulty-${diff}`, 'math-flip-setup');
                    startGame(diff);
                  }}
                  className={`w-full bg-gradient-to-r ${gradients[diff]} text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-between`}
                >
                  <span className="text-3xl">{emojis[diff]}</span>
                  <div className="text-left">
                    <div className="text-xl">{labels[diff]}</div>
                    <div className="text-sm opacity-90">{cfg.startPairs} pairs · {cfg.startTime}s timer</div>
                  </div>
                  <span className="text-xl">▶</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: GAME OVER
  // ============================================================

  if (phase === 'game-over') {
    const totalFlips = totalCorrect + totalWrong;
    const accuracy   = totalFlips > 0 ? Math.round((totalCorrect / totalFlips) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center text-white">

            <div className="text-5xl mb-3">💀</div>
            <h1 className="text-4xl font-bold mb-1">Game Over!</h1>
            <p className="text-gray-300 mb-6">Time ran out!</p>

            {/* Stats */}
            <div className="bg-white/10 rounded-2xl p-5 mb-6 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Final Score</span>
                <span className="font-bold text-yellow-300 text-xl">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Round Reached</span>
                <span className="font-bold">Round {round}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Pairs Matched</span>
                <span className="font-bold text-green-300">{totalMatched}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Correct Matches</span>
                <span className="font-bold text-green-300">{totalCorrect}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Wrong Flips</span>
                <span className="font-bold text-red-300">{totalWrong}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-3">
                <span className="text-gray-300">Accuracy</span>
                <span className="font-bold text-blue-300">{accuracy}%</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  trackButtonClick('try-again', 'math-flip-game-over');
                  trackGameEvent('math-flip', 'restart', { difficulty });
                  startGame(difficulty);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] text-lg"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => {
                  trackButtonClick('change-difficulty', 'math-flip-game-over');
                  setPhase('setup');
                }}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-2xl transition-all duration-200 border border-white/30"
              >
                ⚙️ Change Difficulty
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: PLAYING / ROUND-CLEAR
  // ============================================================

  const gridCols = getGridCols(cards.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-yellow-50 p-3 pb-8 select-none">

      {/* ── HUD ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto mb-4">
        <div className="flex items-stretch gap-2">

          {/* Timer – takes most space */}
          <div className={`flex-1 rounded-2xl px-4 py-2.5 flex items-center gap-2 transition-all duration-200 ${
            timerFlash === 'red'
              ? 'bg-red-500 text-white shadow-lg shadow-red-300'
              : timerFlash === 'green'
              ? 'bg-green-500 text-white shadow-lg shadow-green-300'
              : timerIsLow
              ? 'bg-red-50 border-2 border-red-400'
              : 'bg-white/80 backdrop-blur-sm border border-green-200'
          }`}>
            <span className={`text-xl ${timerIsLow && timerFlash === 'none' ? 'animate-pulse' : ''}`}>⏱</span>
            <span className={`font-mono font-bold text-2xl sm:text-3xl tabular-nums ${
              timerIsLow && timerFlash === 'none'
                ? 'text-red-600 animate-pulse'
                : timerFlash !== 'none'
                ? 'text-white'
                : 'text-green-900'
            }`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Round */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-green-200 text-center min-w-[72px]">
            <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">Round</div>
            <div className="font-bold text-green-900 text-xl leading-tight">{round}</div>
          </div>

          {/* Score */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-green-200 text-right min-w-[80px]">
            <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">Score</div>
            <div className="font-bold text-green-900 text-xl leading-tight">{score.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ── Card Grid ────────────────────────────────────────── */}
      <div className={`max-w-3xl mx-auto grid ${gridCols} gap-2 sm:gap-3`}>
        {cards.map(card => {
          const isFlipped = card.isFlipped || card.isMatched;
          const isShaking = shakeIds.has(card.id);

          let ariaLabel: string;
          if (card.isMatched)                   ariaLabel = `Matched: ${card.display}`;
          else if (isFlipped && card.type === 'equation') ariaLabel = `Equation: ${card.display}`;
          else if (isFlipped && card.type === 'answer')   ariaLabel = `Answer: ${card.display}`;
          else                                  ariaLabel = 'Face-down card';

          return (
            <div
              key={card.id}
              className={`math-flip-shake-wrapper aspect-[3/4] ${isShaking ? 'math-flip-shake' : ''}`}
              style={{ perspective: '900px' }}
            >
              <div
                role="button"
                tabIndex={card.isMatched ? -1 : 0}
                aria-label={ariaLabel}
                aria-pressed={isFlipped}
                onClick={() => handleCardClick(card.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(card.id);
                  }
                }}
                className={`math-flip-card-inner focus:outline-none ${isFlipped ? 'is-flipped' : ''} ${
                  !card.isMatched && !isFlipped ? 'cursor-pointer hover:brightness-110' : ''
                }`}
              >
                {/* Face-down */}
                <div className="math-flip-card-face math-flip-card-front rounded-xl flex items-center justify-center bg-green-800 border-2 border-green-600 shadow-md">
                  <span className="text-2xl sm:text-4xl text-green-400 opacity-50 font-bold">?</span>
                </div>

                {/* Face-up */}
                <div className={`math-flip-card-face math-flip-card-back rounded-xl flex flex-col items-center justify-center border-2 shadow-md p-1 relative ${
                  card.isMatched
                    ? 'bg-yellow-100 border-yellow-400'
                    : card.type === 'equation'
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-emerald-50 border-emerald-300'
                }`}>
                  {card.isMatched && (
                    <span className="absolute top-1 right-1.5 text-green-500 font-bold text-sm leading-none">✓</span>
                  )}
                  <span className={`text-center font-bold leading-tight break-all ${
                    card.type === 'equation'
                      ? 'text-orange-800 text-sm sm:text-base md:text-lg'
                      : 'text-emerald-800 text-xl sm:text-2xl md:text-3xl'
                  }`}>
                    {card.display}
                  </span>
                  {/* Type badge */}
                  <span className={`absolute bottom-1 text-[9px] font-semibold uppercase tracking-wide opacity-50 ${
                    card.type === 'equation' ? 'text-orange-700' : 'text-emerald-700'
                  }`}>
                    {card.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto mt-4 flex items-center justify-center gap-5 text-xs text-green-700">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-800 border border-green-600" />
          <span>Face-down</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
          <span>Equation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          <span>Answer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400" />
          <span>Matched</span>
        </div>
      </div>

      {/* ── Round Clear Overlay ───────────────────────────────── */}
      {phase === 'round-clear' && roundClearInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full border-4 border-yellow-300">
            <div className="text-5xl mb-3">⭐</div>
            <h2 className="text-3xl font-bold text-green-800 mb-1">Round Clear!</h2>
            <p className="text-green-600 mb-5">Round {roundClearInfo.roundNum} completed!</p>

            <div className="space-y-2 text-sm mb-5">
              <div className="bg-green-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-green-700 font-semibold">⏱ Time Bonus</span>
                <span className="text-green-800 font-bold text-base">+{TIMER_ROUND_BONUS}s</span>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-amber-700 font-semibold">🏆 Score Bonus</span>
                <span className="text-amber-800 font-bold text-base">+{(SCORE_ROUND_BONUS_PER * roundClearInfo.roundNum).toLocaleString()} pts</span>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-blue-700 font-semibold">🃏 Pairs Matched</span>
                <span className="text-blue-800 font-bold text-base">{roundClearInfo.pairsCount}</span>
              </div>
            </div>

            <p className="text-gray-400 text-sm animate-pulse">Loading next round…</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathFlipGame;
