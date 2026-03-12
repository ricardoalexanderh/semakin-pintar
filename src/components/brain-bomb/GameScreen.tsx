// ===== Brain Bomb — Game Screen (Active Player + Waiting) =====
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Player, Question, LobbySettings } from './types';
import { DIFFICULTY_CONFIG } from './types';
import { getRandomQuestion } from './questions';
import { playSound } from './audio';
import { C, playerChip, overlayBase, powerupBtn } from './styles';

interface GameScreenProps {
  players: Player[];
  settings: LobbySettings;
  localPlayerId: string;
  onGameOver: (players: Player[]) => void;
}

interface RoundState {
  currentPlayerIdx: number;
  question: Question;
  timeLeft: number;
  maxTime: number;
  answered: boolean;
  answerIdx: number | null;
  round: number;
  frozen: boolean;
}

type OverlayType = 'none' | 'explosion' | 'chain' | 'sabotage' | 'clone';

const GameScreen: React.FC<GameScreenProps> = ({
  players: initialPlayers,
  settings,
  localPlayerId,
  onGameOver,
}) => {
  const [players, setPlayers] = useState<Player[]>(() =>
    initialPlayers.map((p) => ({
      ...p,
      lives: settings.mode === 'sudden' ? 1 : DIFFICULTY_CONFIG[settings.difficulty].lives,
      score: 0,
      eliminated: false,
      sabotages: 0,
      usedPowerupThisRound: false,
      powerups: { shield: 1, freeze: 1, clone: 1 },
    })),
  );

  const maxTime = DIFFICULTY_CONFIG[settings.difficulty].timer;

  const [round, setRound] = useState<RoundState>({
    currentPlayerIdx: 0,
    question: getRandomQuestion(settings.activeSubs, settings.difficulty),
    timeLeft: maxTime,
    maxTime,
    answered: false,
    answerIdx: null,
    round: 1,
    frozen: false,
  });

  const [overlay, setOverlay] = useState<OverlayType>('none');
  const [explosionInfo, setExplosionInfo] = useState({ name: '', message: '' });
  const [chainQuestion, setChainQuestion] = useState<Question | null>(null);
  const [chainAnswered, setChainAnswered] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const freezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sound = settings.enableSound;
  const currentPlayer = players[round.currentPlayerIdx];
  const isLocalTurn = currentPlayer?.id === localPlayerId;
  const activePlayers = players.filter((p) => !p.eliminated);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  // Timer logic
  useEffect(() => {
    if (round.answered || overlay !== 'none') return;

    timerRef.current = setInterval(() => {
      setRound((prev) => {
        if (prev.frozen) return prev;
        const newTime = prev.timeLeft - 1;

        // Play tick sounds
        if (newTime <= 3 && newTime > 0) playSound('tickDanger', sound);
        else if (newTime <= 8 && newTime > 3) playSound('tickFast', sound);
        else if (newTime > 8) playSound('tick', sound);

        if (newTime <= 0) {
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round.answered, round.frozen, overlay, sound]);

  // Check if timer hit 0
  useEffect(() => {
    if (round.timeLeft <= 0 && !round.answered && overlay === 'none') {
      bombExplodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.timeLeft]);

  const bombExplodes = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSound('explosion', sound);

    const cp = players[round.currentPlayerIdx];

    // Check shield
    if (cp.powerups.shield > 0 && cp.usedPowerupThisRound) {
      // Shield was already applied via usePowerup
    }

    setPlayers((prev) => {
      const next = [...prev];
      const idx = round.currentPlayerIdx;
      next[idx] = { ...next[idx], lives: next[idx].lives - 1 };
      if (next[idx].lives <= 0 || settings.mode === 'sudden') {
        next[idx] = { ...next[idx], eliminated: true };
      }
      return next;
    });

    const isEliminated = cp.lives - 1 <= 0 || settings.mode === 'sudden';
    setExplosionInfo({
      name: cp.name,
      message: isEliminated ? `${cp.name} is ELIMINATED! \uD83D\uDC80` : `${cp.name} loses a life!`,
    });
    setOverlay('explosion');
    setRound((prev) => ({ ...prev, answered: true }));

    setTimeout(() => {
      setOverlay('none');

      // Check for game over
      const remaining = players.filter((p, i) => {
        if (i === round.currentPlayerIdx) return (p.lives - 1) > 0 && settings.mode !== 'sudden';
        return !p.eliminated;
      });

      if (remaining.length <= 1) {
        onGameOver(players.map((p, i) => {
          if (i === round.currentPlayerIdx) return { ...p, lives: Math.max(0, p.lives - 1), eliminated: p.lives - 1 <= 0 || settings.mode === 'sudden' };
          return p;
        }));
        return;
      }

      // Chain reaction?
      if (settings.enableChainReaction && Math.random() > 0.4) {
        triggerChainReaction();
      } else {
        passToNext();
      }
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, round.currentPlayerIdx, settings, sound]);

  const triggerChainReaction = () => {
    const q = getRandomQuestion(settings.activeSubs, settings.difficulty);
    setChainQuestion(q);
    setChainAnswered(false);
    setOverlay('chain');
  };

  const handleChainAnswer = (idx: number) => {
    if (chainAnswered || !chainQuestion) return;
    setChainAnswered(true);

    if (idx !== chainQuestion.correct) {
      playSound('wrong', sound);
      showToast('Wrong! -1 life for you!');
      setPlayers((prev) => {
        const next = [...prev];
        const localIdx = next.findIndex((p) => p.id === localPlayerId);
        if (localIdx >= 0) {
          next[localIdx] = { ...next[localIdx], lives: Math.max(0, next[localIdx].lives - 1) };
          if (next[localIdx].lives <= 0) next[localIdx].eliminated = true;
        }
        return next;
      });
    } else {
      playSound('correct', sound);
      showToast('Correct! You survived the chain!');
    }

    setTimeout(() => {
      setOverlay('none');
      setChainQuestion(null);

      const remaining = players.filter((p) => !p.eliminated);
      if (remaining.length <= 1) {
        onGameOver(players);
        return;
      }
      passToNext();
    }, 1200);
  };

  const passToNext = () => {
    playSound('pass', sound);

    setPlayers((current) => {
      const active = current.filter((p) => !p.eliminated);
      if (active.length <= 1) {
        onGameOver(current);
        return current;
      }

      let nextIdx = round.currentPlayerIdx;
      do {
        nextIdx = (nextIdx + 1) % current.length;
      } while (current[nextIdx].eliminated);

      const newQuestion = getRandomQuestion(settings.activeSubs, settings.difficulty);

      setRound({
        currentPlayerIdx: nextIdx,
        question: newQuestion,
        timeLeft: maxTime,
        maxTime,
        answered: false,
        answerIdx: null,
        round: round.round + 1,
        frozen: false,
      });

      // Reset usedPowerupThisRound for all players
      return current.map((p) => ({ ...p, usedPowerupThisRound: false }));
    });
  };

  const handleAnswer = (idx: number) => {
    if (round.answered || !isLocalTurn) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = idx === round.question.correct;
    setRound((prev) => ({ ...prev, answered: true, answerIdx: idx }));

    if (isCorrect) {
      playSound('correct', sound);
      // Update score
      setPlayers((prev) => {
        const next = [...prev];
        const ci = round.currentPlayerIdx;
        next[ci] = { ...next[ci], score: next[ci].score + 10 + round.timeLeft };

        // Check for sabotage earn: >70% time remaining, no powerup used
        if (settings.enableSabotage && !next[ci].usedPowerupThisRound && round.timeLeft > maxTime * 0.7) {
          next[ci] = { ...next[ci], sabotages: next[ci].sabotages + 1 };
          // Show sabotage overlay
          setTimeout(() => {
            if (next[ci].sabotages > 0) {
              setOverlay('sabotage');
            }
          }, 900);
        }
        return next;
      });

      setTimeout(() => {
        if (overlay === 'none') {
          passToNext();
        }
      }, 800);
    } else {
      playSound('wrong', sound);
      setTimeout(() => bombExplodes(), 800);
    }
  };

  const usePowerup = (type: 'shield' | 'freeze' | 'clone') => {
    if (!isLocalTurn || round.answered) return;
    const cp = players[round.currentPlayerIdx];
    if (cp.powerups[type] <= 0) return;

    playSound('powerup', sound);

    setPlayers((prev) => {
      const next = [...prev];
      const ci = round.currentPlayerIdx;
      next[ci] = {
        ...next[ci],
        usedPowerupThisRound: true,
        powerups: { ...next[ci].powerups, [type]: next[ci].powerups[type] - 1 },
      };
      return next;
    });

    if (type === 'shield') {
      showToast('\uD83D\uDEE1\uFE0F Shield activated! Next explosion blocked!');
    } else if (type === 'freeze') {
      showToast('\u2744\uFE0F Timer frozen for 5 seconds!');
      setRound((prev) => ({ ...prev, frozen: true }));
      freezeTimeoutRef.current = setTimeout(() => {
        setRound((prev) => ({ ...prev, frozen: false }));
      }, 5000);
    } else if (type === 'clone') {
      setOverlay('clone');
    }
  };

  const handleCloneTarget = (targetId: string) => {
    const target = players.find((p) => p.id === targetId);
    if (target) {
      showToast(`\uD83D\uDC65 Bomb cloned to ${target.name}!`);
    }
    setOverlay('none');
  };

  const handleSabotage = (type: 'shuffle' | 'timebomb', targetId: string) => {
    const target = players.find((p) => p.id === targetId);
    if (!target) return;

    playSound('powerup', sound);
    showToast(`\uD83D\uDC80 ${type === 'shuffle' ? 'Shuffle' : 'Time Bomb'} sent to ${target.name}!`);

    setPlayers((prev) => {
      const next = [...prev];
      const ci = round.currentPlayerIdx;
      next[ci] = { ...next[ci], sabotages: Math.max(0, next[ci].sabotages - 1) };
      return next;
    });

    setOverlay('none');
    if (!round.answered) {
      // Continue game
    } else {
      passToNext();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
    };
  }, []);

  // Timer display
  const pct = round.timeLeft / round.maxTime;
  const circumference = 2 * Math.PI * 60;
  const timerOffset = circumference * (1 - pct);
  const timerColor = pct > 0.6 ? C.green : pct > 0.3 ? C.yellow : C.danger;
  const bombDanger = pct <= 0.3;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative' }}>
      {/* Players bar */}
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 500, justifyContent: 'center', flexWrap: 'wrap' }}>
        {players.map((p, i) => (
          <div key={p.id} style={playerChip(i === round.currentPlayerIdx, p.eliminated, p.color)}>
            <span>{p.avatar}</span>
            <span>{p.name.split(' ')[0]}</span>
            <span style={{ display: 'flex', gap: 2, fontSize: '0.6rem' }}>
              {Array.from({ length: DIFFICULTY_CONFIG[settings.difficulty].lives }, (_, li) => (
                <span key={li}>{li < p.lives ? '\u2764\uFE0F' : '\uD83D\uDDA4'}</span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {/* Current player banner */}
      <div style={{
        width: '100%', maxWidth: 500, padding: '12px 20px',
        background: `linear-gradient(135deg, rgba(255,61,61,0.15), rgba(255,149,0,0.1))`,
        border: `1px solid ${currentPlayer?.color || C.accent}55`,
        borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, fontWeight: 800, fontSize: '0.9rem',
      }}>
        <span style={{ fontSize: '1.3rem' }}>{currentPlayer?.avatar}</span>
        <span>{currentPlayer?.name}'s turn</span>
        <span style={{ color: C.muted }}> &mdash; Hold the bomb!</span>
      </div>

      {/* Bomb + Timer */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%', maxWidth: 500 }}>
        <div style={{ width: 120, height: 120, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Timer ring */}
          <div style={{ position: 'absolute', inset: -10 }}>
            <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
              <circle cx="70" cy="70" r="60" fill="none" stroke={timerColor} strokeWidth="4"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={timerOffset}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
          </div>
          {/* Bomb emoji */}
          <div style={{
            fontSize: '5rem',
            animation: bombDanger ? 'bb-bomb-panic 0.3s ease-in-out infinite' : 'bb-bomb-tick 1s ease-in-out infinite',
            filter: `drop-shadow(0 0 ${bombDanger ? 40 : 20}px rgba(255,${bombDanger ? '23,68' : '61,61'},${bombDanger ? '0.9' : '0.5'}))`,
            transition: 'filter 0.3s',
          }}>
            {'\uD83D\uDCA3'}
          </div>
        </div>
        {/* Timer text */}
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2.5rem', letterSpacing: 2, color: timerColor,
          textAlign: 'center',
          animation: bombDanger ? 'bb-pulse-text 0.3s ease infinite alternate' : 'none',
        }}>
          {round.timeLeft}
          {round.frozen && <span style={{ fontSize: '1rem', color: C.accent3 }}> {'\u2744\uFE0F'} FROZEN</span>}
        </div>
      </div>

      {/* Question Card */}
      <div style={{
        background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 20,
        padding: 24, width: '100%', maxWidth: 500, textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})`,
        }} />

        {/* Category badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 99, fontSize: '0.65rem',
          fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 14, background: 'rgba(255,255,255,0.06)',
          color: getCategoryColor(round.question),
        }}>
          {getCategoryIcon(round.question)} {getCategoryName(round.question)}
        </div>

        {/* Question text */}
        <div style={{
          fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800,
          lineHeight: 1.4, marginBottom: 20, color: C.white,
        }}>
          {round.question.q}
        </div>

        {/* Answer grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {round.question.a.map((ans, i) => {
            let bg: string = C.surface;
            let borderC: string = C.border;
            let col: string = C.white;
            let anim = '';

            if (round.answered && round.answerIdx !== null) {
              if (i === round.question.correct) {
                bg = 'rgba(0,230,118,0.15)';
                borderC = C.green;
                col = C.green;
                anim = 'bb-correct-pop 0.4s ease';
              } else if (i === round.answerIdx && i !== round.question.correct) {
                bg = 'rgba(255,23,68,0.15)';
                borderC = C.danger;
                col = C.danger;
                anim = 'bb-wrong-shake 0.4s ease';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={round.answered || !isLocalTurn}
                style={{
                  padding: '14px 10px',
                  background: bg,
                  border: `1.5px solid ${borderC}`,
                  borderRadius: 14,
                  color: col,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: round.answered || !isLocalTurn ? 'default' : 'pointer',
                  textAlign: 'center',
                  animation: anim || 'none',
                  opacity: (round.answered || !isLocalTurn) && !round.answerIdx && i !== round.question.correct ? 0.6 : 1,
                }}
              >
                {ans}
              </button>
            );
          })}
        </div>
      </div>

      {/* Power-ups bar */}
      {settings.enablePowerups && isLocalTurn && !round.answered && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {([
            { key: 'shield' as const, icon: '\uD83D\uDEE1\uFE0F', label: 'Shield' },
            { key: 'freeze' as const, icon: '\u2744\uFE0F', label: 'Freeze' },
            { key: 'clone' as const, icon: '\uD83D\uDC65', label: 'Clone' },
          ]).map(({ key, icon, label }) => {
            const count = currentPlayer?.powerups[key] || 0;
            return (
              <button
                key={key}
                onClick={() => usePowerup(key)}
                disabled={count <= 0}
                style={powerupBtn(count <= 0)}
              >
                <span style={{ fontSize: '1rem' }}>{icon}</span> {label}
                <span style={{
                  background: C.accent4, color: 'white', borderRadius: 99,
                  padding: '1px 6px', fontSize: '0.6rem',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Waiting player view */}
      {!isLocalTurn && !round.answered && overlay === 'none' && (
        <div style={{
          ...lobbyCardStyle, textAlign: 'center', maxWidth: 500,
          border: `1px solid ${C.accent}33`,
        }}>
          <div style={{ fontSize: '0.85rem', color: C.muted, marginBottom: 8 }}>Waiting for</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {currentPlayer?.avatar} {currentPlayer?.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: C.muted, marginTop: 8 }}>to answer...</div>
        </div>
      )}

      {/* ===== OVERLAYS ===== */}

      {/* Explosion */}
      {overlay === 'explosion' && (
        <div style={{ ...overlayBase, background: 'rgba(255,23,68,0.15)', animation: 'bb-explosion-flash 0.5s ease' }}>
          <div style={{ fontSize: '6rem', animation: 'bb-explosion-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>{'\uD83D\uDCA5'}</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem',
            letterSpacing: 4, color: C.danger,
            textShadow: '0 0 40px rgba(255,23,68,0.8)', textAlign: 'center',
          }}>
            {'\uD83D\uDCA5'} BOOM!
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: C.muted }}>{explosionInfo.message}</div>
        </div>
      )}

      {/* Chain Reaction */}
      {overlay === 'chain' && chainQuestion && (
        <div style={{ ...overlayBase, background: 'rgba(162,89,255,0.2)' }}>
          <div style={{
            background: C.card, border: `2px solid ${C.accent4}`, borderRadius: 20,
            padding: '28px 36px', textAlign: 'center', maxWidth: 380, width: '90%',
            boxShadow: '0 0 60px rgba(162,89,255,0.3)', animation: 'bb-chain-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: 3, color: C.accent4, marginBottom: 8 }}>
              {'\u26A1'} CHAIN REACTION!
            </div>
            <div style={{ fontSize: '0.8rem', color: C.muted, marginBottom: 4 }}>Everyone answers &mdash; slowest loses a life!</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '16px 0', padding: 16, background: C.surface, borderRadius: 12 }}>
              {chainQuestion.q}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {chainQuestion.a.map((a, i) => (
                <button
                  key={i}
                  onClick={() => handleChainAnswer(i)}
                  disabled={chainAnswered}
                  style={{
                    padding: 12, background: C.surface,
                    border: `1.5px solid ${C.border}`, borderRadius: 12,
                    color: C.white, fontFamily: "'Nunito', sans-serif",
                    fontSize: '0.9rem', fontWeight: 800, cursor: chainAnswered ? 'default' : 'pointer',
                    opacity: chainAnswered ? 0.6 : 1,
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sabotage */}
      {overlay === 'sabotage' && (
        <div style={{ ...overlayBase, background: 'rgba(255,149,0,0.15)' }}>
          <div style={{
            background: C.card, border: `2px solid ${C.accent2}`, borderRadius: 20,
            padding: 28, textAlign: 'center', maxWidth: 380, width: '90%',
            boxShadow: '0 0 60px rgba(255,149,0,0.3)', animation: 'bb-chain-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: 3, color: C.accent2, marginBottom: 8 }}>
              {'\uD83C\uDFAF'} SABOTAGE!
            </div>
            <div style={{ fontSize: '0.85rem', color: C.muted }}>You answered fast &mdash; choose your sabotage!</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {activePlayers.filter((p) => p.id !== localPlayerId).map((p) => (
                <React.Fragment key={p.id}>
                  <button
                    onClick={() => handleSabotage('shuffle', p.id)}
                    style={sabotageOptionStyle}
                  >
                    <span>{'\uD83D\uDD00'}</span> Shuffle {p.name}'s answers
                  </button>
                  <button
                    onClick={() => handleSabotage('timebomb', p.id)}
                    style={sabotageOptionStyle}
                  >
                    <span>{'\u23F1\uFE0F'}</span> -10s from {p.name}'s timer
                  </button>
                </React.Fragment>
              ))}
              <button
                onClick={() => { setOverlay('none'); passToNext(); }}
                style={{ ...sabotageOptionStyle, color: C.muted, borderColor: C.muted }}
              >
                Skip sabotage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone target picker */}
      {overlay === 'clone' && (
        <div style={{ ...overlayBase, background: 'rgba(0,229,255,0.15)' }}>
          <div style={{
            background: C.card, border: `2px solid ${C.accent3}`, borderRadius: 20,
            padding: 28, textAlign: 'center', maxWidth: 380, width: '90%',
            boxShadow: '0 0 60px rgba(0,229,255,0.3)', animation: 'bb-chain-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: 3, color: C.accent3, marginBottom: 8 }}>
              {'\uD83D\uDC65'} CLONE!
            </div>
            <div style={{ fontSize: '0.85rem', color: C.muted }}>Send a bomb copy to another player!</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {activePlayers.filter((p) => p.id !== localPlayerId).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleCloneTarget(p.id)}
                  style={sabotageOptionStyle}
                >
                  {p.avatar} Clone bomb to <strong>{p.name}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{
        position: 'fixed', top: 20, left: '50%',
        transform: `translateX(-50%) translateY(${toastVisible ? '0' : '-100px'})`,
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '12px 20px', fontSize: '0.85rem', fontWeight: 700,
        zIndex: 1000, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        whiteSpace: 'nowrap', fontFamily: "'Nunito', sans-serif", color: C.white,
      }}>
        {toast}
      </div>
    </div>
  );
};

// Helper styles
const lobbyCardStyle: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 20,
  padding: 24,
  width: '100%',
};

const sabotageOptionStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: C.surface,
  border: `1.5px solid ${C.border}`,
  borderRadius: 12,
  color: C.white,
  fontFamily: "'Nunito', sans-serif",
  fontSize: '0.9rem',
  fontWeight: 800,
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

// Helpers to get category info from question
function getCategoryColor(_q: Question): string {
  const icon = getCategoryIcon(_q);
  const map: Record<string, string> = {
    '\uD83D\uDD22': C.accent2,
    '\uD83E\uDDE0': C.accent4,
    '\uD83D\uDCBB': C.accent3,
    '\uD83D\uDD24': C.green,
    '\uD83C\uDFAF': C.yellow,
  };
  return map[icon] || C.white;
}

function getCategoryIcon(q: Question): string {
  const text = q.q.toLowerCase();
  if (text.includes('binary') || text.includes('print') || text.includes('loop') || text.includes('bug') || text.includes('range') || text.includes('array')) return '\uD83D\uDCBB';
  if (text.includes('anagram') || text.includes('palindrome') || text.includes('analogy') || text.includes('odd one out')) return '\uD83D\uDD24';
  if (text.includes('remember') || text.includes('previous') || text.includes('first question')) return '\uD83C\uDFAF';
  if (text.includes('pattern') || text.includes('true') || text.includes('false') || text.includes('syllogism') || text.includes('all ') || text.includes('if ')) return '\uD83E\uDDE0';
  return '\uD83D\uDD22';
}

function getCategoryName(q: Question): string {
  const icon = getCategoryIcon(q);
  const map: Record<string, string> = {
    '\uD83D\uDD22': 'MATH',
    '\uD83E\uDDE0': 'LOGIC',
    '\uD83D\uDCBB': 'COMP. THINKING',
    '\uD83D\uDD24': 'WORD',
    '\uD83C\uDFAF': 'MEMORY',
  };
  return map[icon] || 'QUIZ';
}

export default GameScreen;
