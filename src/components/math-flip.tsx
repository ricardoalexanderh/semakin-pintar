import React, { useState, useEffect, useRef, useCallback } from 'react';
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
      case 'match':      note(523, 0.10, 0); note(659, 0.10, 0.10); note(784, 0.18, 0.20); break;
      case 'wrong':      note(220, 0.12, 0, 'sawtooth'); note(165, 0.12, 0.13, 'sawtooth'); break;
      case 'roundClear': note(523, 0.10, 0); note(659, 0.10, 0.10); note(784, 0.10, 0.20); note(1047, 0.28, 0.30); break;
      case 'gameOver':   note(330, 0.18, 0); note(277, 0.18, 0.20); note(220, 0.35, 0.40); break;
    }
  } catch { /* silent fail */ }
}

// ============================================================
// MATH GENERATION
// ============================================================

function generateEquation(round: number, usedAnswers: Set<number>): { equation: string; answer: number } | null {
  const ops: Array<'add' | 'sub' | 'mul' | 'div' | 'sq'> = ['add', 'sub'];
  if (round >= 2) ops.push('mul');
  if (round >= 3) ops.push('div', 'sq');

  for (let attempt = 0; attempt < 200; attempt++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    let equation = '', answer = 0;

    if (op === 'add') {
      const max = round <= 1 ? 10 : round <= 2 ? 20 : 40;
      const a = Math.floor(Math.random() * max) + 1;
      const b = Math.floor(Math.random() * max) + 1;
      answer = a + b; equation = `${a} + ${b}`;
    } else if (op === 'sub') {
      const max = round <= 1 ? 12 : round <= 2 ? 25 : 50;
      const a = Math.floor(Math.random() * max) + 2;
      const b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b; equation = `${a} − ${b}`;
    } else if (op === 'mul') {
      const maxF = round <= 3 ? 9 : 12;
      const a = Math.floor(Math.random() * (maxF - 1)) + 2;
      const b = Math.floor(Math.random() * (maxF - 1)) + 2;
      answer = a * b; equation = `${a} × ${b}`;
    } else if (op === 'div') {
      const d = Math.floor(Math.random() * 8) + 2;
      const q = Math.floor(Math.random() * 9) + 2;
      answer = q; equation = `${d * q} ÷ ${d}`;
    } else {
      const base = Math.floor(Math.random() * 8) + 2;
      answer = base * base; equation = `${base}²`;
    }

    if (answer > 0 && !usedAnswers.has(answer)) return { equation, answer };
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
    cards.push({ id: id++, type: 'equation', display: eq.equation,      answer: eq.answer, pairId, isFlipped: false, isMatched: false });
    cards.push({ id: id++, type: 'answer',   display: String(eq.answer), answer: eq.answer, pairId, isFlipped: false, isMatched: false });
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// ============================================================
// HELPERS
// ============================================================

function getGridCols(n: number): string {
  if (n <= 8)  return 'grid-cols-4';
  if (n <= 12) return 'grid-cols-4 sm:grid-cols-6';
  if (n <= 16) return 'grid-cols-4';
  return 'grid-cols-4 sm:grid-cols-5';
}

function formatTimer(s: number): string {
  if (s < 100) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const MathFlipGame: React.FC = () => {
  const [phase,        setPhase]        = useState<GamePhase>('setup');
  const [difficulty,   setDifficulty]   = useState<Difficulty>('medium');
  const [cards,        setCards]        = useState<Card[]>([]);
  const [flippedIds,   setFlippedIds]   = useState<number[]>([]);
  const [timeLeft,     setTimeLeft]     = useState(75);
  const [timerMax,     setTimerMax]     = useState(75);
  const [round,        setRound]        = useState(1);
  const [score,        setScore]        = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong,   setTotalWrong]   = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [shakeIds,     setShakeIds]     = useState<Set<number>>(new Set());
  const [roundClearInfo, setRoundClearInfo] = useState<{ roundNum: number; pairsCount: number } | null>(null);

  const isProcessingRef = useRef(false);
  const roundRef        = useRef(round);
  const scoreRef        = useRef(score);
  const difficultyRef   = useRef(difficulty);
  const timerSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => { roundRef.current      = round;      }, [round]);
  useEffect(() => { scoreRef.current      = score;      }, [score]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // ── Timer flash via DOM (restarts animation even on rapid repeat) ──
  const flashTimerEl = useCallback((color: 'red' | 'green') => {
    const el = timerSectionRef.current;
    if (!el) return;
    el.classList.remove('mf-timer-flash-red', 'mf-timer-flash-green');
    void el.offsetWidth; // reflow
    el.classList.add(color === 'red' ? 'mf-timer-flash-red' : 'mf-timer-flash-green');
    setTimeout(() => el.classList.remove('mf-timer-flash-red', 'mf-timer-flash-green'), 500);
  }, []);

  // ── Timer tick ──
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      playSound('gameOver');
      setPhase('game-over');
      trackGameEvent('math-flip', 'complete', { round: roundRef.current, score: scoreRef.current });
    }
  }, [timeLeft, phase]);

  // ── Start / Restart ──
  const startGame = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    isProcessingRef.current = false;
    setDifficulty(diff);
    setRound(1);
    setScore(0);
    setTimeLeft(cfg.startTime);
    setTimerMax(cfg.startTime);
    setCards(buildCards(1, cfg.startPairs));
    setFlippedIds([]);
    setTotalCorrect(0);
    setTotalWrong(0);
    setTotalMatched(0);
    setShakeIds(new Set());
    setRoundClearInfo(null);
    setPhase('playing');
    trackGameEvent('math-flip', 'start', { difficulty: diff });
    trackSettingsChange('difficulty', diff, 'math-flip');
  }, []);

  // ── Next Round ──
  const startNextRound = useCallback(() => {
    const newRound  = roundRef.current + 1;
    const basePairs = DIFFICULTY_CONFIG[difficultyRef.current].startPairs;
    const pairCount = Math.min(basePairs + (newRound - 1), MAX_PAIRS);
    isProcessingRef.current = false;
    setRound(newRound);
    setCards(buildCards(newRound, pairCount));
    setFlippedIds([]);
    setShakeIds(new Set());
    setRoundClearInfo(null);
    setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'round-clear') return;
    const t = setTimeout(startNextRound, 1800);
    return () => clearTimeout(t);
  }, [phase, startNextRound]);

  // ── Card flip handler ──
  const handleCardClick = useCallback((cardId: number) => {
    if (isProcessingRef.current || phase !== 'playing') return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    playSound('flip');
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));

    if (flippedIds.length === 0) { setFlippedIds([cardId]); return; }

    isProcessingRef.current = true;
    setFlippedIds([]);
    const firstCard = cards.find(c => c.id === flippedIds[0])!;
    const isMatch   = firstCard.answer === card.answer && firstCard.type !== card.type;

    if (isMatch) {
      playSound('match');
      setCards(prev => prev.map(c =>
        c.id === flippedIds[0] || c.id === cardId ? { ...c, isFlipped: true, isMatched: true } : c
      ));
      setTimeLeft(prev => prev + TIMER_MATCH_BONUS);
      setScore(prev => Math.max(0, prev + SCORE_CORRECT_MATCH));
      setTotalCorrect(prev => prev + 1);
      setTotalMatched(prev => prev + 1);
      flashTimerEl('green');

      const alreadyMatched = cards.filter(c => c.isMatched).length;
      if (alreadyMatched + 2 === cards.length) {
        const thisRound = roundRef.current;
        const thisPairs = cards.length / 2;
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
      playSound('wrong');
      setShakeIds(new Set([flippedIds[0], cardId]));
      setTimeLeft(prev => Math.max(0, prev - TIMER_WRONG_PENALTY));
      setScore(prev => Math.max(0, prev - SCORE_WRONG_PENALTY));
      setTotalWrong(prev => prev + 1);
      flashTimerEl('red');
      setTimeout(() => {
        setCards(prev => prev.map(c =>
          c.id === flippedIds[0] || c.id === cardId ? { ...c, isFlipped: false } : c
        ));
        setShakeIds(new Set());
        isProcessingRef.current = false;
      }, 900);
    }
  }, [cards, flippedIds, phase, flashTimerEl]);

  // ── Derived ──
  const timerPct   = Math.max(0, Math.min(100, (timeLeft / timerMax) * 100));
  const timerState = timeLeft <= 10 ? 'danger' : timeLeft <= Math.floor(timerMax * 0.25) ? 'warn' : '';

  // ============================================================
  // SETUP SCREEN
  // ============================================================

  if (phase === 'setup') {
    return (
      <div className="mf-root flex items-center justify-center p-4">
        <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 1 }}>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="mf-font text-5xl mb-2" style={{ color: '#7ecb7e' }}>
              Math<span style={{ color: '#f5d76e' }}>Flip</span>
            </h1>
            <p style={{ color: '#7a9a7a', fontSize: '0.95rem' }}>
              Match equations with their answers!
            </p>
          </div>

          {/* How to play */}
          <div className="mf-surface p-5 mb-5">
            <p className="mf-font mb-3" style={{ color: '#f5f0e8', fontSize: '1rem' }}>How to Play</p>
            <ul style={{ color: '#7a9a7a', fontSize: '0.85rem', lineHeight: '1.9' }}>
              <li>🔄 Flip two cards to find equation + answer pairs</li>
              <li>✅ Correct match: <strong style={{ color: '#7ecb7e' }}>+{TIMER_MATCH_BONUS}s &amp; +{SCORE_CORRECT_MATCH} pts</strong></li>
              <li>❌ Wrong flip: <strong style={{ color: '#e05555' }}>−{TIMER_WRONG_PENALTY}s &amp; −{SCORE_WRONG_PENALTY} pts</strong></li>
              <li>⭐ Clear the board: <strong style={{ color: '#f5d76e' }}>+{TIMER_ROUND_BONUS}s bonus!</strong></li>
              <li>⏱ Don't let the timer hit <strong style={{ color: '#e05555' }}>0</strong>!</li>
            </ul>
          </div>

          {/* Difficulty */}
          <p className="text-center mb-3 mf-font" style={{ color: '#f5f0e8' }}>Choose Difficulty</p>
          <div className="flex gap-2 justify-center mb-5">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
              <button
                key={diff}
                className={`mf-diff-btn ${difficulty === diff ? 'mf-diff-btn-active' : ''}`}
                onClick={() => {
                  setDifficulty(diff);
                  trackButtonClick(`difficulty-${diff}`, 'math-flip-setup');
                }}
              >
                {diff === 'easy' ? '🌱' : diff === 'medium' ? '🌿' : '🔥'} {diff}
              </button>
            ))}
          </div>
          <div className="text-center mb-6" style={{ color: '#7a9a7a', fontSize: '0.8rem' }}>
            {DIFFICULTY_CONFIG[difficulty].startPairs} pairs · {DIFFICULTY_CONFIG[difficulty].startTime}s timer
          </div>

          <button
            className="mf-btn-primary w-full text-lg"
            onClick={() => {
              trackButtonClick('start-game', 'math-flip-setup');
              startGame(difficulty);
            }}
          >
            Start Game →
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // GAME OVER SCREEN
  // ============================================================

  if (phase === 'game-over') {
    const totalFlips = totalCorrect + totalWrong;
    const accuracy   = totalFlips > 0 ? Math.round((totalCorrect / totalFlips) * 100) : 0;

    return (
      <div className="mf-root flex items-center justify-center p-4">
        <div className="w-full max-w-sm mf-pop-in" style={{ position: 'relative', zIndex: 1 }}>
          <div className="mf-surface p-8 text-center" style={{ border: '2px solid #e05555', boxShadow: '0 0 60px rgba(224,85,85,0.2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>⏰</div>
            <h1 className="mf-font" style={{ fontSize: '2.5rem', color: '#e05555', marginBottom: 4 }}>Time's Up!</h1>
            <p style={{ color: '#7a9a7a', marginBottom: 20 }}>The clock ran out!</p>

            <div className="text-left rounded-xl p-4 mb-6" style={{ background: 'rgba(0,0,0,0.2)', lineHeight: 2.2, fontSize: '0.85rem', color: '#7a9a7a' }}>
              <div className="flex justify-between"><span>Final Score</span><strong className="mf-font" style={{ color: '#f5d76e', fontSize: '1.1rem' }}>{score.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Round Reached</span><strong style={{ color: '#f5f0e8' }}>Round {round}</strong></div>
              <div className="flex justify-between"><span>Pairs Matched</span><strong style={{ color: '#7ecb7e' }}>{totalMatched}</strong></div>
              <div className="flex justify-between"><span>Correct Matches</span><strong style={{ color: '#7ecb7e' }}>{totalCorrect}</strong></div>
              <div className="flex justify-between"><span>Wrong Flips</span><strong style={{ color: '#e05555' }}>{totalWrong}</strong></div>
              <div className="flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 4 }}>
                <span>Accuracy</span><strong style={{ color: '#7ecb7e' }}>{accuracy}%</strong>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="mf-btn-primary w-full text-base"
                onClick={() => {
                  trackButtonClick('try-again', 'math-flip-game-over');
                  trackGameEvent('math-flip', 'restart', { difficulty });
                  startGame(difficulty);
                }}
              >
                🔄 Try Again
              </button>
              <button
                className="mf-btn-secondary w-full text-base"
                onClick={() => {
                  trackButtonClick('change-difficulty', 'math-flip-game-over');
                  setPhase('setup');
                }}
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
  // PLAYING / ROUND-CLEAR
  // ============================================================

  const gridCols = getGridCols(cards.length);

  return (
    <div className="mf-root p-3 pb-8 select-none">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* ── HUD row ── */}
        <div className="flex items-center gap-3">
          {/* Title */}
          <h1 className="mf-font text-2xl sm:text-3xl flex-shrink-0" style={{ color: '#7ecb7e' }}>
            Math<span style={{ color: '#f5d76e' }}>Flip</span>
          </h1>
          <div className="flex gap-2 ml-auto">
            <div className="mf-hud-pill">
              <span>🎯</span>
              <span>Round</span>
              <span className="mf-hud-val mf-hud-val-green">{round}</span>
            </div>
            <div className="mf-hud-pill">
              <span>⭐</span>
              <span>Score</span>
              <span className="mf-hud-val mf-hud-val-yellow">{score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Timer ── */}
        <div ref={timerSectionRef} className="mf-timer">
          <div className="flex justify-between items-center">
            <span className="mf-timer-label">Time Remaining</span>
            <span className={`mf-timer-val ${timerState}`}>{formatTimer(timeLeft)}</span>
          </div>
          <div className="mf-timer-bar-bg">
            <div
              className={`mf-timer-bar ${timerState}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>

        {/* ── Card Grid ── */}
        <div className={`grid ${gridCols} gap-2 sm:gap-3`}>
          {cards.map(card => {
            const isFlipped = card.isFlipped || card.isMatched;
            const isShaking = shakeIds.has(card.id);

            let ariaLabel: string;
            if      (card.isMatched)                          ariaLabel = `Matched: ${card.display}`;
            else if (isFlipped && card.type === 'equation')   ariaLabel = `Equation: ${card.display}`;
            else if (isFlipped && card.type === 'answer')     ariaLabel = `Answer: ${card.display}`;
            else                                              ariaLabel = 'Face-down card';

            return (
              <div
                key={card.id}
                className={`aspect-[3/4] ${isShaking ? 'math-flip-shake' : ''}`}
                style={{ perspective: '900px' }}
              >
                <div
                  role="button"
                  tabIndex={card.isMatched ? -1 : 0}
                  aria-label={ariaLabel}
                  aria-pressed={isFlipped}
                  onClick={() => handleCardClick(card.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(card.id); } }}
                  className={`math-flip-card-inner focus:outline-none ${isFlipped ? 'is-flipped' : ''} ${!card.isMatched && !isFlipped ? 'cursor-pointer' : ''}`}
                >
                  {/* Face-down (default visible – the "?" side) */}
                  <div className="math-flip-card-face mf-card-back rounded-xl flex items-center justify-center">
                    <span className="mf-font" style={{ fontSize: '1.8rem', color: 'rgba(126,203,126,0.3)' }}>?</span>
                  </div>

                  {/* Face-up (rotated 180° by default, revealed on flip) */}
                  <div className={`math-flip-card-face math-flip-card-back rounded-xl flex flex-col items-center justify-center relative p-1 ${
                    card.isMatched ? 'mf-card-matched' : card.type === 'equation' ? 'mf-card-eq' : 'mf-card-ans'
                  }`}>
                    {/* Type label */}
                    <span className="absolute bottom-1" style={{
                      fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '1.5px', opacity: 0.5,
                      color: card.type === 'equation' ? '#7ecb7e' : '#f5d76e',
                    }}>
                      {card.type}
                    </span>

                    {/* Matched check */}
                    {card.isMatched && (
                      <span className="absolute top-1 right-1.5" style={{ color: '#7ecb7e', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
                    )}

                    {/* Content */}
                    <span className={`text-center leading-tight break-all ${card.type === 'equation' ? 'mf-card-eq-text' : 'mf-card-ans-text'}`}
                      style={{ fontSize: card.type === 'equation' ? 'clamp(0.75rem, 3vw, 1.2rem)' : 'clamp(1rem, 4vw, 1.6rem)' }}>
                      {card.display}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Hint bar ── */}
        <p className="text-center" style={{ color: '#7a9a7a', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          ✅ match: +{TIMER_MATCH_BONUS}s &nbsp;|&nbsp; ❌ wrong: −{TIMER_WRONG_PENALTY}s &nbsp;|&nbsp; 🏆 round clear: +{TIMER_ROUND_BONUS}s
        </p>
      </div>

      {/* ── Round Clear Overlay ── */}
      {phase === 'round-clear' && roundClearInfo && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(20,30,20,0.88)', backdropFilter: 'blur(8px)' }}>
          <div className="mf-pop-in mf-surface text-center p-8 max-w-xs w-full" style={{ border: '2px solid #7ecb7e', boxShadow: '0 0 60px rgba(126,203,126,0.2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
            <h2 className="mf-font" style={{ fontSize: '2rem', color: '#7ecb7e', marginBottom: 8 }}>Round Clear!</h2>
            <p style={{ color: '#7a9a7a', marginBottom: 16, fontSize: '0.9rem' }}>
              Round <strong style={{ color: '#f5f0e8' }}>{roundClearInfo.roundNum}</strong> complete!
            </p>
            <div style={{ fontSize: '0.85rem', color: '#7a9a7a', lineHeight: 2.3 }}>
              <div>⏱ Time Bonus: <strong className="mf-font" style={{ color: '#7ecb7e', fontSize: '1rem' }}>+{TIMER_ROUND_BONUS}s</strong></div>
              <div>🏆 Score Bonus: <strong className="mf-font" style={{ color: '#f5d76e', fontSize: '1rem' }}>+{(SCORE_ROUND_BONUS_PER * roundClearInfo.roundNum).toLocaleString()}</strong></div>
              <div>🃏 Pairs: <strong style={{ color: '#f5f0e8' }}>{roundClearInfo.pairsCount}</strong></div>
            </div>
            <p className="animate-pulse mt-4" style={{ color: '#7a9a7a', fontSize: '0.75rem' }}>Loading next round…</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathFlipGame;
