// ===== Brain Bomb — Game Screen (Active Player + Waiting) =====
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Player, Question, LobbySettings, PeerMessage } from './types';
import { DIFFICULTY_CONFIG } from './types';
import { getRandomQuestion, resetUsedQuestions } from './questions';
import { playSound } from './audio';
import { C, playerChip, overlayBase, powerupBtn } from './styles';
import type { GameRoom } from './webrtc';

interface GameScreenProps {
  players: Player[];
  settings: LobbySettings;
  localPlayerId: string;
  onGameOver: (players: Player[]) => void;
  gameRoom?: GameRoom | null;
  isHost: boolean;
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

interface SyncState {
  players: Player[];
  round: RoundState;
  overlay: OverlayType;
  explosionInfo: { name: string; message: string };
  chainQuestion: Question | null;
  gameOver?: boolean;
}

type OverlayType = 'none' | 'explosion' | 'chain' | 'sabotage' | 'clone';

const GameScreen: React.FC<GameScreenProps> = ({
  players: initialPlayers,
  settings,
  localPlayerId,
  onGameOver,
  gameRoom,
  isHost,
}) => {
  // Reset used questions at game start so we get fresh questions
  useState(() => { resetUsedQuestions(); return null; });

  const [players, setPlayers] = useState<Player[]>(() =>
    initialPlayers.map((p) => ({
      ...p,
      lives: settings.mode === 'sudden' ? 1 : DIFFICULTY_CONFIG[settings.difficulty].lives,
      score: 0,
      eliminated: false,
      sabotages: 0,
      usedPowerupThisRound: false,
      powerups: { shield: 1, freeze: 1, clone: 1 },
      shieldActive: false,
      timePenalty: 0,
      shuffleNextRound: false,
    })),
  );

  const maxTime = DIFFICULTY_CONFIG[settings.difficulty].timer;

  // Only host generates the initial question; guests get it via state sync
  const [round, setRound] = useState<RoundState>(() => ({
    currentPlayerIdx: 0,
    question: isHost
      ? getRandomQuestion(settings.activeSubs, settings.difficulty)
      : { q: '...', a: ['...', '...', '...', '...'], correct: 0, diff: settings.difficulty },
    timeLeft: maxTime,
    maxTime,
    answered: false,
    answerIdx: null,
    round: 1,
    frozen: false,
  }));

  const [overlay, setOverlay] = useState<OverlayType>('none');
  const [explosionInfo, setExplosionInfo] = useState({ name: '', message: '' });
  const [chainQuestion, setChainQuestion] = useState<Question | null>(null);
  const [chainAnswered, setChainAnswered] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const freezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs to always access latest state from callbacks/timeouts (avoids stale closures)
  const playersRef = useRef(players);
  playersRef.current = players;
  const roundRef = useRef(round);
  roundRef.current = round;
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  const explosionInfoRef = useRef(explosionInfo);
  explosionInfoRef.current = explosionInfo;
  const chainQuestionRef = useRef(chainQuestion);
  chainQuestionRef.current = chainQuestion;

  const sound = settings.enableSound;
  const currentPlayer = players[round.currentPlayerIdx];
  const isLocalTurn = currentPlayer?.id === localPlayerId;
  const activePlayers = players.filter((p) => !p.eliminated);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  // --- Sync: Host broadcasts state after changes ---
  const broadcastState = useCallback((
    p: Player[],
    r: RoundState,
    ov: OverlayType,
    ei: { name: string; message: string },
    cq: Question | null,
    gameOver = false,
  ) => {
    if (!isHost || !gameRoom) return;
    const state: SyncState = { players: p, round: r, overlay: ov, explosionInfo: ei, chainQuestion: cq, gameOver };
    gameRoom.broadcast('game-state', state);
  }, [isHost, gameRoom]);

  // Broadcast game over to guests, then call onGameOver locally
  const broadcastGameOver = useCallback((finalPlayers: Player[]) => {
    broadcastState(finalPlayers, roundRef.current, 'none', explosionInfoRef.current, null, true);
    onGameOver(finalPlayers);
  }, [broadcastState, onGameOver]);

  // Handle sync messages passed from parent via gameRoom.gameSyncHandler
  // Not memoized so it always captures fresh closures to handleAnswer, usePowerup, etc.
  const handleSyncMessage = (msg: PeerMessage) => {
    if (msg.type === 'game-state' && !isHost) {
      const state = msg.payload as SyncState;
      if (state.gameOver) {
        onGameOver(state.players);
        return;
      }
      setPlayers(state.players);
      setRound(state.round);
      setOverlay(state.overlay);
      setExplosionInfo(state.explosionInfo);
      setChainQuestion(state.chainQuestion);
    } else if (isHost) {
      // Host receives actions from guests
      if (msg.type === 'answer-submitted') {
        const { answerIdx } = msg.payload as { answerIdx: number };
        handleAnswer(answerIdx, true);
      } else if (msg.type === 'powerup-used') {
        const { type } = msg.payload as { type: 'shield' | 'freeze' | 'clone' };
        usePowerup(type, true);
      } else if (msg.type === 'chain-answer') {
        const { answerIdx, playerId } = msg.payload as { answerIdx: number; playerId: string };
        handleRemoteChainAnswer(answerIdx, playerId);
      } else if (msg.type === 'clone-target') {
        const { targetId } = msg.payload as { targetId: string };
        handleCloneTarget(targetId, true);
      } else if (msg.type === 'sabotage-applied') {
        const { sabotageType, targetId } = msg.payload as { sabotageType: string; targetId: string };
        if (sabotageType === 'skip') {
          handleSkipSabotage(true);
        } else {
          handleSabotage(sabotageType as 'shuffle' | 'timebomb', targetId, true);
        }
      }
    }
  };

  // Expose handleSyncMessage via ref so parent can call it
  const syncRef = useRef(handleSyncMessage);
  syncRef.current = handleSyncMessage;

  // Store syncRef on gameRoom for parent to access
  useEffect(() => {
    if (gameRoom) {
      (gameRoom as unknown as { gameSyncHandler: (msg: PeerMessage) => void }).gameSyncHandler = (msg: PeerMessage) => {
        syncRef.current(msg);
      };
    }
  }, [gameRoom]);

  // Broadcast initial state to guests immediately on mount
  useEffect(() => {
    if (!isHost || !gameRoom) return;
    const t = setTimeout(() => {
      broadcastState(playersRef.current, roundRef.current, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
    }, 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, gameRoom]);

  // Timer logic (host only runs timer, guests get state via sync)
  useEffect(() => {
    if (!isHost) return; // Guests don't run timer
    if (round.answered || overlay !== 'none') return;

    timerRef.current = setInterval(() => {
      setRound((prev) => {
        if (prev.frozen) return prev;
        const newTime = prev.timeLeft - 1;

        if (newTime <= 0) {
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round.answered, round.frozen, overlay, isHost]);

  // Play tick sounds (both host and guest based on round state)
  useEffect(() => {
    if (round.answered || overlay !== 'none') return;
    if (round.timeLeft <= 3 && round.timeLeft > 0) playSound('tickDanger', sound);
    else if (round.timeLeft <= 8 && round.timeLeft > 3) playSound('tickFast', sound);
    else if (round.timeLeft > 8) playSound('tick', sound);
  }, [round.timeLeft, round.answered, overlay, sound]);

  // Check if timer hit 0 (host only) — uses ref to avoid stale closure
  useEffect(() => {
    if (!isHost) return;
    if (round.timeLeft <= 0 && !round.answered && overlay === 'none') {
      bombExplodesRef.current();
    }
  }, [round.timeLeft, round.answered, overlay, isHost]);

  // Sync timer state to guests every second
  useEffect(() => {
    if (!isHost || !gameRoom) return;
    broadcastState(playersRef.current, roundRef.current, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
  }, [round.timeLeft, isHost, gameRoom, broadcastState]);

  // Use refs for functions called from timeouts to avoid stale closures
  const passToNextRef = useRef<(cp?: Player[]) => void>(() => {});
  const triggerChainReactionRef = useRef<(cp?: Player[]) => void>(() => {});

  const bombExplodes = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const curPlayers = playersRef.current;
    const curRound = roundRef.current;
    const cp = curPlayers[curRound.currentPlayerIdx];

    // Shield blocks the explosion
    if (cp.shieldActive) {
      playSound('powerup', sound);
      const shieldedPlayers = curPlayers.map((p, i) =>
        i === curRound.currentPlayerIdx ? { ...p, shieldActive: false } : p
      );
      setPlayers(shieldedPlayers);
      const ei = { name: cp.name, message: `${cp.name}'s shield blocked the explosion!` };
      setExplosionInfo(ei);
      setOverlay('explosion');
      const newRound = { ...curRound, answered: true };
      setRound(newRound);
      broadcastState(shieldedPlayers, newRound, 'explosion', ei, chainQuestionRef.current);
      setTimeout(() => {
        setOverlay('none');
        passToNextRef.current(shieldedPlayers);
      }, 1500);
      return;
    }

    playSound('explosion', sound);

    const newPlayers = curPlayers.map((p, i) => {
      if (i !== curRound.currentPlayerIdx) return p;
      const newLives = p.lives - 1;
      return {
        ...p,
        lives: newLives,
        eliminated: newLives <= 0 || settings.mode === 'sudden',
      };
    });

    setPlayers(newPlayers);

    const isEliminated = cp.lives - 1 <= 0 || settings.mode === 'sudden';
    const ei = {
      name: cp.name,
      message: isEliminated ? `${cp.name} is ELIMINATED! \uD83D\uDC80` : `${cp.name} loses a life!`,
    };
    setExplosionInfo(ei);
    setOverlay('explosion');
    const newRound = { ...curRound, answered: true };
    setRound(newRound);
    broadcastState(newPlayers, newRound, 'explosion', ei, chainQuestionRef.current);

    setTimeout(() => {
      setOverlay('none');

      const remaining = newPlayers.filter((p) => !p.eliminated);
      if (remaining.length <= 1) {
        broadcastGameOver(newPlayers);
        return;
      }

      // Chain reaction?
      if (settings.enableChainReaction && Math.random() > 0.4) {
        triggerChainReactionRef.current(newPlayers);
      } else {
        passToNextRef.current(newPlayers);
      }
    }, 2000);
  };

  const bombExplodesRef = useRef(bombExplodes);
  bombExplodesRef.current = bombExplodes;

  const triggerChainReaction = (currentPlayers?: Player[]) => {
    const q = getRandomQuestion(settings.activeSubs, settings.difficulty);
    setChainQuestion(q);
    setChainAnswered(false);
    setOverlay('chain');
    broadcastState(currentPlayers ?? playersRef.current, roundRef.current, 'chain', explosionInfoRef.current, q);
  };
  triggerChainReactionRef.current = triggerChainReaction;

  const handleRemoteChainAnswer = (idx: number, playerId: string) => {
    const cq = chainQuestionRef.current;
    if (!cq) return;
    if (idx !== cq.correct) {
      setPlayers((prev) => {
        const next = prev.map((p) => {
          if (p.id !== playerId) return p;
          const newLives = Math.max(0, p.lives - 1);
          return { ...p, lives: newLives, eliminated: newLives <= 0 };
        });
        return next;
      });
    }
  };

  const handleChainAnswer = (idx: number) => {
    if (chainAnswered || !chainQuestion) return;
    setChainAnswered(true);

    if (!isHost && gameRoom) {
      // Guest sends chain answer to host
      gameRoom.broadcast('chain-answer', { answerIdx: idx, playerId: localPlayerId });
    }

    if (idx !== chainQuestion.correct) {
      playSound('wrong', sound);
      showToast('Wrong! -1 life for you!');
      if (isHost) {
        setPlayers((prev) => {
          const next = prev.map((p) => {
            if (p.id !== localPlayerId) return p;
            const newLives = Math.max(0, p.lives - 1);
            return { ...p, lives: newLives, eliminated: newLives <= 0 };
          });
          return next;
        });
      }
    } else {
      playSound('correct', sound);
      showToast('Correct! You survived the chain!');
    }

    if (isHost) {
      setTimeout(() => {
        setOverlay('none');
        setChainQuestion(null);
        const remaining = playersRef.current.filter((p) => !p.eliminated);
        if (remaining.length <= 1) {
          broadcastGameOver(playersRef.current);
          return;
        }
        passToNextRef.current();
      }, 1200);
    }
  };

  const passToNext = (currentPlayers?: Player[]) => {
    playSound('pass', sound);
    const cp = currentPlayers ?? playersRef.current;
    const curRound = roundRef.current;

    const active = cp.filter((p) => !p.eliminated);
    if (active.length <= 1) {
      broadcastGameOver(cp);
      return;
    }

    let nextIdx = curRound.currentPlayerIdx;
    do {
      nextIdx = (nextIdx + 1) % cp.length;
    } while (cp[nextIdx].eliminated);

    const nextPlayer = cp[nextIdx];
    let newQuestion = getRandomQuestion(settings.activeSubs, settings.difficulty);

    // Apply shuffle sabotage: randomize answer positions
    if (nextPlayer.shuffleNextRound) {
      const indices = newQuestion.a.map((_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const shuffledAnswers = indices.map((i) => newQuestion.a[i]);
      const newCorrect = indices.indexOf(newQuestion.correct);
      newQuestion = { ...newQuestion, a: shuffledAnswers, correct: newCorrect };
    }

    // Apply time penalty sabotage
    const penalty = nextPlayer.timePenalty || 0;
    const adjustedTime = Math.max(5, maxTime - penalty);

    const newRound: RoundState = {
      currentPlayerIdx: nextIdx,
      question: newQuestion,
      timeLeft: adjustedTime,
      maxTime,
      answered: false,
      answerIdx: null,
      round: curRound.round + 1,
      frozen: false,
    };
    setRound(newRound);

    // Clear effects and reset round state
    const newPlayers = cp.map((p, i) => ({
      ...p,
      usedPowerupThisRound: false,
      timePenalty: i === nextIdx ? 0 : p.timePenalty,
      shuffleNextRound: i === nextIdx ? false : p.shuffleNextRound,
    }));
    setPlayers(newPlayers);
    broadcastState(newPlayers, newRound, 'none', { name: '', message: '' }, null);
  };
  passToNextRef.current = passToNext;

  const handleAnswer = (idx: number, fromRemote = false) => {
    const curRound = roundRef.current;
    if (curRound.answered) return;

    // Guest sends answer to host via WebRTC
    if (!isHost && !fromRemote) {
      const cp = playersRef.current[curRound.currentPlayerIdx];
      if (cp?.id !== localPlayerId) return;
      if (gameRoom) {
        gameRoom.broadcast('answer-submitted', { answerIdx: idx });
      }
      return; // Host will process and broadcast state back
    }

    // Host processes the answer
    if (!isHost) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const curPlayers = playersRef.current;
    const isCorrect = idx === curRound.question.correct;
    const newRound = { ...curRound, answered: true, answerIdx: idx };
    setRound(newRound);

    if (isCorrect) {
      playSound('correct', sound);
      const earnedSabotage = settings.enableSabotage && !curPlayers[curRound.currentPlayerIdx].usedPowerupThisRound && curRound.timeLeft > maxTime * 0.7;
      const newPlayers = curPlayers.map((p, i) => {
        if (i !== curRound.currentPlayerIdx) return p;
        const newScore = p.score + 10 + curRound.timeLeft;
        return {
          ...p,
          score: newScore,
          sabotages: earnedSabotage ? p.sabotages + 1 : p.sabotages,
        };
      });
      setPlayers(newPlayers);

      if (earnedSabotage && newPlayers.filter((p) => !p.eliminated).length > 1) {
        // Show sabotage picker — turn waits until player picks or skips
        setTimeout(() => {
          setOverlay('sabotage');
          broadcastState(newPlayers, newRound, 'sabotage', explosionInfoRef.current, chainQuestionRef.current);
        }, 800);
      } else {
        broadcastState(newPlayers, newRound, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
        setTimeout(() => {
          passToNextRef.current(newPlayers);
        }, 800);
      }
    } else {
      playSound('wrong', sound);
      broadcastState(curPlayers, newRound, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
      setTimeout(() => bombExplodesRef.current(), 800);
    }
  };

  const usePowerup = (type: 'shield' | 'freeze' | 'clone', fromRemote = false) => {
    const curRound = roundRef.current;
    const curPlayers = playersRef.current;
    if (curRound.answered) return;

    // Guest sends powerup use to host
    if (!isHost && !fromRemote) {
      const cp = curPlayers[curRound.currentPlayerIdx];
      if (cp?.id !== localPlayerId) return;
      if (cp.powerups[type] <= 0) return;
      if (gameRoom) {
        gameRoom.broadcast('powerup-used', { type });
      }
      return;
    }

    if (!isHost) return;
    const cp = curPlayers[curRound.currentPlayerIdx];
    if (cp.powerups[type] <= 0) return;

    playSound('powerup', sound);

    const newPlayers = curPlayers.map((p, i) => {
      if (i !== curRound.currentPlayerIdx) return p;
      return {
        ...p,
        usedPowerupThisRound: true,
        powerups: { ...p.powerups, [type]: p.powerups[type] - 1 },
      };
    });
    setPlayers(newPlayers);

    if (type === 'shield') {
      showToast('\uD83D\uDEE1\uFE0F Shield activated! Next explosion blocked!');
      // Mark shield as active on the current player
      const shieldedPlayers = newPlayers.map((p, i) =>
        i === curRound.currentPlayerIdx ? { ...p, shieldActive: true } : p
      );
      setPlayers(shieldedPlayers);
      broadcastState(shieldedPlayers, curRound, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
    } else if (type === 'freeze') {
      showToast('\u2744\uFE0F Timer frozen for 5 seconds!');
      const newRound = { ...curRound, frozen: true };
      setRound(newRound);
      broadcastState(newPlayers, newRound, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
      freezeTimeoutRef.current = setTimeout(() => {
        setRound((prev) => {
          const unfrozen = { ...prev, frozen: false };
          broadcastState(newPlayers, unfrozen, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
          return unfrozen;
        });
      }, 5000);
    } else if (type === 'clone') {
      setOverlay('clone');
      broadcastState(newPlayers, curRound, 'clone', explosionInfoRef.current, chainQuestionRef.current);
    }
  };

  const handleCloneTarget = (targetId: string, fromRemote = false) => {
    // Guest sends clone target selection to host via WebRTC
    if (!isHost && !fromRemote) {
      if (gameRoom) {
        gameRoom.broadcast('clone-target', { targetId });
      }
      return;
    }
    if (!isHost) return;

    const curPlayers = playersRef.current;
    const curRound = roundRef.current;
    const targetIdx = curPlayers.findIndex((p) => p.id === targetId);
    const target = curPlayers[targetIdx];
    if (!target) return;

    showToast(`\uD83D\uDC65 Bomb cloned to ${target.name}!`);
    setOverlay('none');

    // Pass the bomb directly to the target player with a new question
    const newQuestion = getRandomQuestion(settings.activeSubs, settings.difficulty);
    const newRound: RoundState = {
      currentPlayerIdx: targetIdx,
      question: newQuestion,
      timeLeft: maxTime,
      maxTime,
      answered: false,
      answerIdx: null,
      round: curRound.round + 1,
      frozen: false,
    };
    setRound(newRound);
    const newPlayers = curPlayers.map((p) => ({ ...p, usedPowerupThisRound: false }));
    setPlayers(newPlayers);
    broadcastState(newPlayers, newRound, 'none', { name: '', message: '' }, null);
  };

  const handleSabotage = (type: 'shuffle' | 'timebomb', targetId: string, fromRemote = false) => {
    // Guest sends sabotage selection to host via WebRTC
    if (!isHost && !fromRemote) {
      if (gameRoom) {
        gameRoom.broadcast('sabotage-applied', { sabotageType: type, targetId });
      }
      return;
    }

    if (!isHost) return;

    const target = playersRef.current.find((p) => p.id === targetId);
    if (!target) return;

    playSound('powerup', sound);
    showToast(`\uD83D\uDC80 ${type === 'shuffle' ? 'Shuffle' : 'Time Bomb'} sent to ${target.name}!`);

    const curRound = roundRef.current;
    const newPlayers = playersRef.current.map((p, i) => {
      // Decrement sabotage count for the current player
      if (i === curRound.currentPlayerIdx) {
        return { ...p, sabotages: Math.max(0, p.sabotages - 1) };
      }
      // Apply effect to target
      if (p.id === targetId) {
        if (type === 'timebomb') return { ...p, timePenalty: (p.timePenalty || 0) + 10 };
        if (type === 'shuffle') return { ...p, shuffleNextRound: true };
      }
      return p;
    });
    setPlayers(newPlayers);
    setOverlay('none');

    if (!curRound.answered) {
      broadcastState(newPlayers, curRound, 'none', explosionInfoRef.current, chainQuestionRef.current);
    } else {
      passToNextRef.current(newPlayers);
    }
  };

  const handleSkipSabotage = (fromRemote = false) => {
    if (!isHost && !fromRemote) {
      if (gameRoom) {
        gameRoom.broadcast('sabotage-applied', { sabotageType: 'skip', targetId: '' });
      }
      return;
    }
    if (!isHost) return;
    setOverlay('none');
    broadcastState(playersRef.current, roundRef.current, 'none', explosionInfoRef.current, chainQuestionRef.current);
    passToNextRef.current();
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
                  opacity: (round.answered || !isLocalTurn) && round.answerIdx === null && i !== round.question.correct ? 0.6 : 1,
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
            <div style={{ fontSize: '0.85rem', color: C.muted }}>{currentPlayer?.name} answered fast &mdash; choose a sabotage!</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {isLocalTurn ? (
                <>
                  {activePlayers.filter((p) => p.id !== currentPlayer?.id).map((p) => (
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
                    onClick={() => handleSkipSabotage()}
                    style={{ ...sabotageOptionStyle, color: C.muted, borderColor: C.muted }}
                  >
                    Skip sabotage
                  </button>
                </>
              ) : (
                <div style={{ fontSize: '0.9rem', color: C.muted, padding: 16 }}>
                  Waiting for {currentPlayer?.name} to choose...
                </div>
              )}
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
