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
  startTime: number;
  answered: boolean;
  answerIdx: number | null;
  round: number;
  frozen: boolean;
  blind: boolean;
  blindAnswers: number[];
  isBonus?: boolean;
  decoy?: boolean;
  decoyAnswer?: string;
}

interface SyncState {
  players: Player[];
  round: RoundState;
  overlay: OverlayType;
  explosionInfo: { name: string; message: string };
  chainQuestion: Question | null;
  chainTimeLeft?: number;
  gameOver?: boolean;
  toastMessage?: string;
  throwTargetId?: string;
  throwFromName?: string;
  chainRespondentCount?: number;
  luckyWinnerId?: string;
}

type OverlayType = 'none' | 'explosion' | 'chain' | 'sabotage' | 'clone' | 'lucky';

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
      blindNextRound: false,
      decoyNextRound: false,
      savedTime: settings.mode === 'sudden' ? DIFFICULTY_CONFIG[settings.difficulty].timer : (settings.timer || DIFFICULTY_CONFIG[settings.difficulty].timer),
    })),
  );

  const maxTime = settings.timer || DIFFICULTY_CONFIG[settings.difficulty].timer;

  // Only host generates the initial question; guests get it via state sync
  const [round, setRound] = useState<RoundState>(() => ({
    currentPlayerIdx: 0,
    question: isHost
      ? getRandomQuestion(settings.activeSubs, settings.difficulty)
      : { q: '...', a: ['...', '...', '...', '...'], correct: 0, diff: settings.difficulty },
    timeLeft: maxTime,
    maxTime,
    startTime: maxTime,
    answered: false,
    answerIdx: null,
    round: 1,
    frozen: false,
    blind: false,
    blindAnswers: [],
  }));

  const [overlay, setOverlay] = useState<OverlayType>('none');
  const [explosionInfo, setExplosionInfo] = useState({ name: '', message: '' });
  const [chainQuestion, setChainQuestion] = useState<Question | null>(null);
  const [chainAnswered, setChainAnswered] = useState(false);
  const [chainRespondents, setChainRespondents] = useState<Set<string>>(new Set());
  const [chainTimeLeft, setChainTimeLeft] = useState(0);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [throwNotif, setThrowNotif] = useState(false);
  const [throwFromName, setThrowFromName] = useState('');
  const [yourTurnNotif, setYourTurnNotif] = useState(false);
  const [luckyWinnerId, setLuckyWinnerId] = useState<string | null>(null);
  const [sabotageStep, setSabotageStep] = useState<'type' | 'target'>('type');
  const [selectedSabotageType, setSelectedSabotageType] = useState<'blind' | 'timebomb' | 'decoy' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingToastRef = useRef<string | undefined>(undefined);
  const chainTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chainTimeLeftRef = useRef(0);
  const freezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blindTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chainTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const chainRespondentsRef = useRef(chainRespondents);
  chainRespondentsRef.current = chainRespondents;
  const chainWrongAnswersRef = useRef<Set<string>>(new Set());
  chainTimeLeftRef.current = chainTimeLeft;
  const luckyWinnerIdRef = useRef<string | null>(null);
  luckyWinnerIdRef.current = luckyWinnerId;

  const sound = settings.enableSound;
  const currentPlayer = players[round.currentPlayerIdx];
  const isLocalTurn = currentPlayer?.id === localPlayerId;
  const activePlayers = players.filter((p) => !p.eliminated);

  // Show "YOUR TURN" overlay when it becomes the local player's turn (skip on throw, which has its own overlay)
  const prevRoundRef = useRef(round.round);
  useEffect(() => {
    if (isLocalTurn && round.round !== prevRoundRef.current && !throwNotif && overlay === 'none') {
      setYourTurnNotif(true);
      playSound('pass', sound);
      setTimeout(() => setYourTurnNotif(false), 800);
    }
    prevRoundRef.current = round.round;
  }, [round.round, isLocalTurn, throwNotif, overlay, sound]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  // Broadcast a toast to all players (host shows locally + sends to guests)
  const broadcastToast = useCallback((msg: string) => {
    showToast(msg);
    pendingToastRef.current = msg;
  }, [showToast]);

  // --- Sync: Host broadcasts state after changes ---
  const broadcastState = useCallback((
    p: Player[],
    r: RoundState,
    ov: OverlayType,
    ei: { name: string; message: string },
    cq: Question | null,
    gameOver = false,
    toastMessage?: string,
    throwTargetId?: string,
    throwFromName?: string,
  ) => {
    if (!isHost || !gameRoom) return;
    const toastMsg = toastMessage || pendingToastRef.current;
    pendingToastRef.current = undefined;
    const state: SyncState = { players: p, round: r, overlay: ov, explosionInfo: ei, chainQuestion: cq, chainTimeLeft: chainTimeLeftRef.current, gameOver, toastMessage: toastMsg, throwTargetId, throwFromName, chainRespondentCount: chainRespondentsRef.current.size, luckyWinnerId: luckyWinnerIdRef.current || undefined };
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
      // --- Guest sound effects: detect state changes, scoped to local player ---
      const wasMyTurn = players[round.currentPlayerIdx]?.id === localPlayerId;
      const isMyTurn = state.players[state.round.currentPlayerIdx]?.id === localPlayerId;

      // Answer sound: only for the player who answered
      if (state.round.answered && !round.answered && wasMyTurn) {
        if (state.round.answerIdx === state.round.question.correct) {
          playSound('correct', sound);
        } else {
          playSound('wrong', sound);
        }
      }
      // Pass turn sound: play for the player receiving the turn
      if (state.round.currentPlayerIdx !== round.currentPlayerIdx && state.overlay !== 'explosion' && state.overlay !== 'chain' && state.overlay !== 'lucky' && !state.round.answered && isMyTurn) {
        playSound('pass', sound);
      }
      // Powerup / sabotage sound: play for the player who used it
      if ((state.overlay === 'sabotage' && overlay !== 'sabotage') || (state.overlay === 'clone' && overlay !== 'clone')) {
        if (wasMyTurn) playSound('powerup', sound);
      }
      // Explosion sound: play for all players
      if (state.overlay === 'explosion' && overlay !== 'explosion') {
        playSound('explosion', sound);
      }

      setPlayers(state.players);
      setRound(state.round);
      setOverlay(state.overlay);
      setExplosionInfo(state.explosionInfo);
      setChainQuestion(state.chainQuestion);
      if (state.chainTimeLeft != null) setChainTimeLeft(state.chainTimeLeft);
      // Sync chain respondent count from host
      if (state.chainRespondentCount != null && state.chainRespondentCount !== chainRespondents.size) {
        const dummy = new Set(Array.from({ length: state.chainRespondentCount }, (_, i) => `r${i}`));
        setChainRespondents(dummy);
      }
      // Reset chainAnswered only when a NEW chain/lucky starts (not on every timer sync)
      if ((state.overlay === 'chain' || state.overlay === 'lucky') && state.chainQuestion && overlay !== 'chain' && overlay !== 'lucky') {
        setChainAnswered(false);
      }
      // Sync lucky winner
      if (state.luckyWinnerId) {
        setLuckyWinnerId(state.luckyWinnerId);
      } else if (state.overlay !== 'lucky') {
        setLuckyWinnerId(null);
      }
      // Throw notification: centered overlay for target, toast for others
      if (state.throwTargetId) {
        if (state.throwTargetId === localPlayerId) {
          setThrowNotif(true);
          setThrowFromName(state.throwFromName || '');
        } else if (state.toastMessage) {
          showToast(state.toastMessage);
        }
      } else {
        setThrowNotif(false);
        if (state.toastMessage) {
          showToast(state.toastMessage);
        }
      }
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
      } else if (msg.type === 'lucky-answer') {
        const { answerIdx, playerId, timestamp } = msg.payload as { answerIdx: number; playerId: string; timestamp?: number };
        handleRemoteLuckyAnswer(answerIdx, playerId, timestamp);
      } else if (msg.type === 'clone-target') {
        const { targetId } = msg.payload as { targetId: string };
        handleCloneTarget(targetId, true);
      } else if (msg.type === 'sabotage-applied') {
        const { sabotageType, targetId } = msg.payload as { sabotageType: string; targetId: string };
        if (sabotageType === 'skip') {
          handleSkipSabotage(true);
        } else {
          handleSabotage(sabotageType as 'blind' | 'timebomb' | 'decoy', targetId, true);
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

  // Sync timer state to guests every second (skip when timer expired — bombExplodes handles that)
  useEffect(() => {
    if (!isHost || !gameRoom) return;
    if (round.timeLeft <= 0) return;
    broadcastState(playersRef.current, roundRef.current, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
  }, [round.timeLeft, isHost, gameRoom, broadcastState]);

  // Use refs for functions called from timeouts to avoid stale closures
  const passToNextRef = useRef<(cp?: Player[]) => void>(() => {});
  const triggerChainReactionRef = useRef<(cp?: Player[]) => void>(() => {});
  const triggerLuckyQuestionRef = useRef<(cp?: Player[]) => void>(() => {});

  const bombExplodes = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const curPlayers = playersRef.current;
    const curRound = roundRef.current;
    const cp = curPlayers[curRound.currentPlayerIdx];

    // Shield blocks the explosion
    if (cp.shieldActive) {
      if (cp.id === localPlayerId) playSound('powerup', sound);
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
      const chainRoll = Math.random();
      console.log('[Brain Bomb] Chain check:', { enableChainReaction: settings.enableChainReaction, chainRoll, willTrigger: settings.enableChainReaction && chainRoll > 0.4, remaining: remaining.length });
      if (settings.enableChainReaction && chainRoll > 0.4) {
        triggerChainReactionRef.current(newPlayers);
      } else {
        passToNextRef.current(newPlayers);
      }
    }, 2000);
  };

  const bombExplodesRef = useRef(bombExplodes);
  bombExplodesRef.current = bombExplodes;

  // Chain reaction timer config: 20/15/10 by difficulty
  const chainMaxTime = { easy: 20, medium: 15, hard: 10 }[settings.difficulty];

  // Host: finish the chain reaction and move on
  const finishChainReaction = useCallback(() => {
    if (chainTimeoutRef.current) { clearTimeout(chainTimeoutRef.current); chainTimeoutRef.current = null; }
    if (chainTimerRef.current) { clearInterval(chainTimerRef.current); chainTimerRef.current = null; }
    // Penalize players who didn't answer OR answered wrong (-1 life)
    const respondents = chainRespondentsRef.current;
    const wrongAnswers = chainWrongAnswersRef.current;
    const penalized = playersRef.current.map((p) => {
      if (p.eliminated) return p;
      const didntAnswer = !respondents.has(p.id);
      const answeredWrong = wrongAnswers.has(p.id);
      if (!didntAnswer && !answeredWrong) return p;
      const newLives = Math.max(0, p.lives - 1);
      return { ...p, lives: newLives, eliminated: newLives <= 0 };
    });
    setPlayers(penalized);
    chainWrongAnswersRef.current = new Set();

    // Brief delay so players see the result, then proceed
    setTimeout(() => {
      setOverlay('none');
      setChainQuestion(null);
      setChainAnswered(false);
      setChainRespondents(new Set());
      setChainTimeLeft(0);
      broadcastState(penalized, roundRef.current, 'none', explosionInfoRef.current, null);
      const remaining = penalized.filter((p) => !p.eliminated);
      if (remaining.length <= 1) {
        broadcastGameOver(penalized);
        return;
      }
      passToNextRef.current(penalized);
    }, 800);
  }, [broadcastGameOver, broadcastState]);
  const finishChainRef = useRef(finishChainReaction);
  finishChainRef.current = finishChainReaction;

  // Host: check if all active (non-eliminated) players have answered the chain
  const checkChainComplete = useCallback((respondents: Set<string>) => {
    const active = playersRef.current.filter((p) => !p.eliminated);
    console.log('[Brain Bomb] Chain progress:', respondents.size, '/', active.length);
    if (respondents.size >= active.length) {
      console.log('[Brain Bomb] Chain complete — finishing');
      finishChainRef.current();
    }
  }, []);

  const triggerChainReaction = (currentPlayers?: Player[]) => {
    const q = getRandomQuestion(settings.activeSubs, settings.difficulty, settings.enableProgressiveDifficulty ? roundRef.current.round : undefined);
    // Use the exploded player's saved time (their turn start time) as chain timer
    const cp = (currentPlayers ?? playersRef.current)[roundRef.current.currentPlayerIdx];
    const chainTime = cp?.savedTime ?? chainMaxTime;
    setChainQuestion(q);
    chainQuestionRef.current = q;
    setChainAnswered(false);
    setChainRespondents(new Set());
    chainWrongAnswersRef.current = new Set();
    setChainTimeLeft(chainTime);
    chainTimeLeftRef.current = chainTime;
    setOverlay('chain');
    overlayRef.current = 'chain';
    broadcastState(currentPlayers ?? playersRef.current, roundRef.current, 'chain', explosionInfoRef.current, q);

    // Start visible countdown timer for chain reaction
    if (isHost) {
      if (chainTimerRef.current) clearInterval(chainTimerRef.current);
      chainTimerRef.current = setInterval(() => {
        setChainTimeLeft((prev) => {
          if (prev <= 1) {
            if (chainTimerRef.current) { clearInterval(chainTimerRef.current); chainTimerRef.current = null; }
            finishChainRef.current();
            return 0;
          }
          const next = prev - 1;
          // Sync chain timer to guests
          chainTimeLeftRef.current = next;
          broadcastState(playersRef.current, roundRef.current, 'chain', explosionInfoRef.current, chainQuestionRef.current);
          return next;
        });
      }, 1000);
    }
  };
  triggerChainReactionRef.current = triggerChainReaction;

  const handleRemoteChainAnswer = (idx: number, playerId: string) => {
    const cq = chainQuestionRef.current;
    if (!cq) return;
    if (idx !== cq.correct) {
      chainWrongAnswersRef.current.add(playerId);
    }
    // Track this player's response
    const updated = new Set(chainRespondentsRef.current);
    updated.add(playerId);
    setChainRespondents(updated);
    chainRespondentsRef.current = updated;
    checkChainComplete(updated);
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
        chainWrongAnswersRef.current.add(localPlayerId);
      }
    } else {
      playSound('correct', sound);
      showToast('Correct! You survived the chain!');
    }

    // Host: track own response and check if all done
    if (isHost) {
      const updated = new Set(chainRespondentsRef.current);
      updated.add(localPlayerId);
      setChainRespondents(updated);
      chainRespondentsRef.current = updated;
      checkChainComplete(updated);
    }
  };

  // === Lucky Question (all-player race for +1 life) ===
  const finishLuckyQuestion = useCallback(() => {
    if (chainTimeoutRef.current) { clearTimeout(chainTimeoutRef.current); chainTimeoutRef.current = null; }
    if (chainTimerRef.current) { clearInterval(chainTimerRef.current); chainTimerRef.current = null; }

    const winnerId = luckyWinnerIdRef.current;
    const maxLives = settings.mode === 'sudden' ? 1 : DIFFICULTY_CONFIG[settings.difficulty].lives;
    const updatedPlayers = winnerId
      ? playersRef.current.map((p) => p.id === winnerId ? { ...p, lives: Math.min(p.lives + 1, maxLives) } : p)
      : playersRef.current;
    setPlayers(updatedPlayers);

    setTimeout(() => {
      setOverlay('none');
      setChainQuestion(null);
      setChainAnswered(false);
      setChainRespondents(new Set());
      setChainTimeLeft(0);
      setLuckyWinnerId(null);
      luckyWinnerIdRef.current = null;
      broadcastState(updatedPlayers, roundRef.current, 'none', explosionInfoRef.current, null);
      passToNextRef.current(updatedPlayers);
    }, 2000);
  }, [broadcastState, settings.mode, settings.difficulty]);
  const finishLuckyRef = useRef(finishLuckyQuestion);
  finishLuckyRef.current = finishLuckyQuestion;

  const triggerLuckyQuestion = (currentPlayers?: Player[]) => {
    const q = getRandomQuestion(settings.activeSubs, settings.difficulty, settings.enableProgressiveDifficulty ? roundRef.current.round : undefined);
    setChainQuestion(q);
    chainQuestionRef.current = q;
    setChainAnswered(false);
    setChainRespondents(new Set());
    setLuckyWinnerId(null);
    luckyWinnerIdRef.current = null;
    luckyPendingRef.current = null;
    setChainTimeLeft(maxTime);
    chainTimeLeftRef.current = maxTime;
    setOverlay('lucky');
    overlayRef.current = 'lucky';
    broadcastState(currentPlayers ?? playersRef.current, roundRef.current, 'lucky', explosionInfoRef.current, q);

    if (isHost) {
      if (chainTimerRef.current) clearInterval(chainTimerRef.current);
      chainTimerRef.current = setInterval(() => {
        setChainTimeLeft((prev) => {
          if (prev <= 1) {
            if (chainTimerRef.current) { clearInterval(chainTimerRef.current); chainTimerRef.current = null; }
            finishLuckyRef.current();
            return 0;
          }
          const next = prev - 1;
          chainTimeLeftRef.current = next;
          broadcastState(playersRef.current, roundRef.current, 'lucky', explosionInfoRef.current, chainQuestionRef.current);
          return next;
        });
      }, 1000);
    }
  };
  triggerLuckyQuestionRef.current = triggerLuckyQuestion;

  // Track the earliest correct lucky answer (timestamp + playerId) so host can fairly resolve ties
  const luckyPendingRef = useRef<{ playerId: string; timestamp: number } | null>(null);

  const resolveLuckyWinner = (candidateId: string, candidateTimestamp: number) => {
    if (luckyWinnerIdRef.current) return; // already resolved
    const pending = luckyPendingRef.current;
    // Pick the earlier timestamp, or keep existing if tied
    if (pending && pending.timestamp <= candidateTimestamp) return; // existing pending is earlier
    luckyPendingRef.current = { playerId: candidateId, timestamp: candidateTimestamp };
  };

  const finalizeLuckyWinner = () => {
    if (luckyWinnerIdRef.current) return;
    const winner = luckyPendingRef.current;
    if (!winner) return;
    setLuckyWinnerId(winner.playerId);
    luckyWinnerIdRef.current = winner.playerId;
    const p = playersRef.current.find((p) => p.id === winner.playerId);
    broadcastToast(`\u2B50 ${p?.name || 'Someone'} wins the Lucky Question! +1 life!`);
    if (chainTimerRef.current) { clearInterval(chainTimerRef.current); chainTimerRef.current = null; }
    luckyPendingRef.current = null;
    finishLuckyRef.current();
  };

  const handleRemoteLuckyAnswer = (idx: number, playerId: string, timestamp?: number) => {
    const cq = chainQuestionRef.current;
    if (!cq || luckyWinnerIdRef.current) return;
    if (idx === cq.correct) {
      resolveLuckyWinner(playerId, timestamp ?? Date.now());
      // If host hasn't answered yet, finalize after a short window
      setTimeout(() => finalizeLuckyWinner(), 300);
    }
  };

  const handleLuckyAnswer = (idx: number) => {
    if (chainAnswered || !chainQuestion) return;
    setChainAnswered(true);
    const answerTime = Date.now();

    if (!isHost && gameRoom) {
      gameRoom.broadcast('lucky-answer', { answerIdx: idx, playerId: localPlayerId, timestamp: answerTime });
    }

    if (idx !== chainQuestion.correct) {
      playSound('wrong', sound);
      showToast('Wrong! No extra life for you.');
    } else {
      playSound('correct', sound);
      if (isHost) {
        // Register host's answer with its timestamp, then wait for any guest answers to arrive
        resolveLuckyWinner(localPlayerId, answerTime);
        setTimeout(() => finalizeLuckyWinner(), 300);
      }
    }
  };

  const passToNext = (currentPlayers?: Player[]) => {
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
    // Play pass sound for the player receiving the turn
    if (nextPlayer.id === localPlayerId) playSound('pass', sound);
    const newQuestion = getRandomQuestion(settings.activeSubs, settings.difficulty, settings.enableProgressiveDifficulty ? curRound.round + 1 : undefined);

    // Save current player's remaining time + bonus for their next turn (only on correct answer)
    const bonusSeconds = { easy: 10, medium: 5, hard: 3 }[settings.difficulty];
    const wasCorrect = curRound.answerIdx !== null && curRound.answerIdx === curRound.question.correct;
    const savedTimeForCurrent = wasCorrect
      ? Math.min(curRound.timeLeft + bonusSeconds, maxTime)
      : maxTime; // Reset to full on explosion

    // Next player uses their own saved time (from their previous turn)
    const nextPlayerTime = nextPlayer.savedTime ?? maxTime;
    // Apply time penalty sabotage
    const penalty = nextPlayer.timePenalty || 0;
    const adjustedTime = Math.max(5, nextPlayerTime - penalty);

    // Apply blind sabotage: blur ALL answers (gradually becomes visible)
    const isBlind = !!nextPlayer.blindNextRound;
    const blindAnswers = isBlind ? newQuestion.a.map((_, i) => i) : [];

    const nextRound = curRound.round + 1;
    const isLuckyRound = nextRound > 0 && nextRound % 8 === 0;

    // Apply decoy sabotage: add a fake 5th answer
    const hasDecoy = !!nextPlayer.decoyNextRound;
    let decoyAnswer = '';
    if (hasDecoy) {
      // Generate a plausible fake answer from a different question in the same category
      const otherQ = getRandomQuestion(settings.activeSubs, settings.difficulty);
      const otherAnswers = otherQ.a.filter((a) => !newQuestion.a.includes(a));
      if (otherAnswers.length > 0) {
        decoyAnswer = otherAnswers[Math.floor(Math.random() * otherAnswers.length)];
      } else {
        // Fallback: slightly modify a wrong answer
        const wrongAnswers = newQuestion.a.filter((_, i) => i !== newQuestion.correct);
        const base = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
        decoyAnswer = base + '?';
      }
    }

    const newRound: RoundState = {
      currentPlayerIdx: nextIdx,
      question: newQuestion,
      timeLeft: adjustedTime,
      maxTime,
      startTime: adjustedTime,
      answered: false,
      answerIdx: null,
      round: nextRound,
      frozen: false,
      blind: isBlind,
      blindAnswers,
      isBonus: false,
      decoy: hasDecoy,
      decoyAnswer: hasDecoy ? decoyAnswer : undefined,
    };
    setRound(newRound);

    // Clear blind state after 5 seconds (CSS animation handles gradual reveal)
    if (isBlind) {
      blindTimeoutRef.current = setTimeout(() => {
        setRound((prev) => {
          const revealed = { ...prev, blind: false, blindAnswers: [] };
          broadcastState(playersRef.current, revealed, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
          return revealed;
        });
      }, 5000);
    }

    // Clear effects, reset round state, and save per-player timer
    const newPlayers = cp.map((p, i) => ({
      ...p,
      usedPowerupThisRound: false,
      timePenalty: i === nextIdx ? 0 : p.timePenalty,
      blindNextRound: i === nextIdx ? false : p.blindNextRound,
      decoyNextRound: i === nextIdx ? false : p.decoyNextRound,
      savedTime: i === curRound.currentPlayerIdx ? savedTimeForCurrent : p.savedTime,
    }));
    setPlayers(newPlayers);
    broadcastState(newPlayers, newRound, 'none', { name: '', message: '' }, null);

    // Lucky Question: every 8 rounds, trigger all-player race for +1 life
    if (isLuckyRound && isHost) {
      setTimeout(() => {
        triggerLuckyQuestionRef.current(newPlayers);
      }, 500);
    }
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
      if (curPlayers[curRound.currentPlayerIdx]?.id === localPlayerId) playSound('correct', sound);
      const startTime = curRound.startTime;
      const earnedSabotage = settings.enableSabotage && !curPlayers[curRound.currentPlayerIdx].usedPowerupThisRound && curRound.timeLeft > startTime * 0.85;
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
        // Broadcast answered state immediately so guests see green highlight
        broadcastState(newPlayers, newRound, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
        // Show sabotage picker after delay
        setTimeout(() => {
          setSabotageStep('type');
          setSelectedSabotageType(null);
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
      if (curPlayers[curRound.currentPlayerIdx]?.id === localPlayerId) playSound('wrong', sound);
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

    if (cp.id === localPlayerId) playSound('powerup', sound);

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
      broadcastToast(`\uD83D\uDEE1\uFE0F ${cp.name} activated Shield!`);
      // Mark shield as active on the current player
      const shieldedPlayers = newPlayers.map((p, i) =>
        i === curRound.currentPlayerIdx ? { ...p, shieldActive: true } : p
      );
      setPlayers(shieldedPlayers);
      broadcastState(shieldedPlayers, curRound, overlayRef.current, explosionInfoRef.current, chainQuestionRef.current);
    } else if (type === 'freeze') {
      broadcastToast(`\u2744\uFE0F ${cp.name} froze the timer!`);
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

    // Stop timer and mark round as answered so bomb doesn't explode during notification
    if (timerRef.current) clearInterval(timerRef.current);
    const pausedRound = { ...curRound, answered: true };
    setRound(pausedRound);
    setOverlay('none');

    // Show centered overlay for the target, toast for others
    const thrower = curPlayers[curRound.currentPlayerIdx];
    const throwMsg = `\uD83D\uDCA8 ${thrower?.name} threw the bomb to ${target.name}!`;
    if (target.id === localPlayerId) {
      setThrowNotif(true);
      setThrowFromName(thrower?.name || '');
    } else {
      showToast(throwMsg);
    }
    broadcastState(curPlayers, pausedRound, 'none', explosionInfoRef.current, chainQuestionRef.current, false, throwMsg, target.id, thrower?.name);

    setTimeout(() => {
      setThrowNotif(false);
      // Pass the same question to the target (strategic throw for hard questions)
      const sameQuestion = curRound.question;
      const bonusSecs = { easy: 10, medium: 5, hard: 3 }[settings.difficulty];
      const redirectTime = Math.min(curRound.timeLeft + bonusSecs, maxTime);
      const newRound: RoundState = {
        currentPlayerIdx: targetIdx,
        question: sameQuestion,
        timeLeft: redirectTime,
        maxTime,
        startTime: redirectTime,
        answered: false,
        answerIdx: null,
        round: curRound.round + 1,
        frozen: false,
        blind: false,
        blindAnswers: [],
      };
      setRound(newRound);
      setOverlay('none');
      const newPlayers = curPlayers.map((p) => ({ ...p, usedPowerupThisRound: false }));
      setPlayers(newPlayers);
      broadcastState(newPlayers, newRound, 'none', { name: '', message: '' }, null);
    }, 2000);
  };

  const handleSabotage = (type: 'blind' | 'timebomb' | 'decoy', targetId: string, fromRemote = false) => {
    // Guest sends sabotage selection to host via WebRTC
    if (!isHost && !fromRemote) {
      if (gameRoom) {
        gameRoom.broadcast('sabotage-applied', { sabotageType: type, targetId });
      }
      return;
    }

    if (!isHost) return;

    // Use functional updater to avoid stale state race conditions
    setPlayers((prevPlayers) => {
      const target = prevPlayers.find((p) => p.id === targetId);
      if (!target) return prevPlayers;

      const curRound = roundRef.current;
      const curPlayer = prevPlayers[curRound.currentPlayerIdx];
      if (curPlayer?.id === localPlayerId) playSound('powerup', sound);
      const typeLabel = type === 'blind' ? 'Blind' : type === 'timebomb' ? 'Time Bomb' : 'Decoy';
      broadcastToast(`\uD83D\uDC80 ${typeLabel} sent to ${target.name}!`);

      const newPlayers = prevPlayers.map((p, i) => {
        if (i === curRound.currentPlayerIdx) {
          return { ...p, sabotages: Math.max(0, p.sabotages - 1) };
        }
        if (p.id === targetId) {
          if (type === 'timebomb') {
            const penalty = { easy: 8, medium: 5, hard: 3 }[settings.difficulty];
            return { ...p, timePenalty: (p.timePenalty || 0) + penalty };
          }
          if (type === 'blind') return { ...p, blindNextRound: true };
          if (type === 'decoy') return { ...p, decoyNextRound: true };
        }
        return p;
      });

      // Schedule broadcast/passToNext after state commits
      setTimeout(() => {
        if (!curRound.answered) {
          broadcastState(newPlayers, curRound, 'none', explosionInfoRef.current, chainQuestionRef.current);
        } else {
          passToNextRef.current(newPlayers);
        }
      }, 0);

      return newPlayers;
    });
    setOverlay('none');
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
      if (blindTimeoutRef.current) clearTimeout(blindTimeoutRef.current);
      if (chainTimeoutRef.current) clearTimeout(chainTimeoutRef.current);
      if (chainTimerRef.current) clearInterval(chainTimerRef.current);
    };
  }, []);

  // Timer display
  const pct = round.timeLeft / round.maxTime;
  const circumference = 2 * Math.PI * 60;
  const timerOffset = circumference * (1 - pct);
  const timerColor = pct > 0.6 ? C.green : pct > 0.3 ? C.yellow : C.danger;
  const bombDanger = pct <= 0.3;

  return (
    <div style={{ padding: 'clamp(8px, 1.5vh, 16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.2vh, 12px)', position: 'relative', height: 'calc(100dvh - 4rem)', overflow: 'hidden', boxSizing: 'border-box', width: '100%' }}>
      {/* Players bar */}
      <div style={{ display: 'flex', gap: 'clamp(4px, 1vw, 8px)', width: '100%', maxWidth: 500, justifyContent: 'center', flexWrap: 'wrap' }}>
        {players.map((p, i) => (
          <div key={p.id} style={playerChip(i === round.currentPlayerIdx, p.eliminated, p.color)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
              <span>{p.avatar}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 2, fontSize: '0.6rem', justifyContent: 'center' }}>
              {Array.from({ length: DIFFICULTY_CONFIG[settings.difficulty].lives }, (_, li) => (
                <span key={li}>{li < p.lives ? '\u2764\uFE0F' : '\uD83D\uDDA4'}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Current player banner */}
      <div style={{
        width: '100%', maxWidth: 500, padding: 'clamp(8px, 1vh, 12px) clamp(12px, 3vw, 20px)', boxSizing: 'border-box' as const,
        background: `linear-gradient(135deg, rgba(255,61,61,0.15), rgba(255,149,0,0.1))`,
        border: `1px solid ${currentPlayer?.color || C.accent}55`,
        borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, fontWeight: 800, fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
      }}>
        <span style={{ fontSize: '1.3rem' }}>{currentPlayer?.avatar}</span>
        <span>{currentPlayer?.name}'s turn</span>
        <span style={{ color: C.muted }}> &mdash; Hold the bomb!</span>
      </div>

      {/* Bomb + Timer */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(2px, 0.5vh, 8px)', width: '100%', maxWidth: 500, marginTop: 'clamp(4px, 1vh, 12px)' }}>
        <div style={{ width: 'clamp(70px, 12vh, 120px)', height: 'clamp(70px, 12vh, 120px)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            fontSize: 'clamp(3.5rem, 10vh, 5rem)',
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
          fontSize: 'clamp(1.8rem, 4vh, 2.5rem)', letterSpacing: 2, color: timerColor,
          textAlign: 'center',
          animation: bombDanger ? 'bb-pulse-text 0.3s ease infinite alternate' : 'none',
        }}>
          {round.timeLeft}
          {round.frozen && <span style={{ fontSize: '1rem', color: C.accent3 }}> {'\u2744\uFE0F'} FROZEN</span>}
        </div>
      </div>

      {/* Question Card */}
      <div style={{
        background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 'clamp(12px, 3vw, 20px)',
        padding: 'clamp(14px, 2vh, 24px)', width: '100%', maxWidth: 500, textAlign: 'center', boxSizing: 'border-box' as const,
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
          marginBottom: 'clamp(6px, 1vh, 14px)', background: 'rgba(255,255,255,0.06)',
          color: getCategoryColor(round.question),
        }}>
          {getCategoryIcon(round.question)} {getCategoryName(round.question)}
        </div>

        {/* Question text */}
        <div style={{
          fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800,
          lineHeight: 1.4, marginBottom: 'clamp(8px, 1.5vh, 20px)', color: C.white,
        }}>
          {round.question.q}
        </div>

        {/* Answer grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1vh, 10px)' }}>
          {/* Combine real answers with optional decoy */}
          {(() => {
            const allAnswers: { text: string; idx: number; isDecoy: boolean }[] = round.question.a.map((ans, i) => ({
              text: ans, idx: i, isDecoy: false,
            }));
            if (round.decoy && round.decoyAnswer) {
              // Insert decoy at a random-ish but stable position (based on round number)
              const insertPos = round.round % (allAnswers.length + 1);
              allAnswers.splice(insertPos, 0, { text: round.decoyAnswer, idx: -1, isDecoy: true });
            }
            return allAnswers.map((item, renderIdx) => {
              const isBlinded = round.blind && round.blindAnswers.includes(item.idx);
              let bg: string = C.surface;
              let borderC: string = C.border;
              let col: string = C.white;
              let anim = '';

              if (round.answered && round.answerIdx !== null) {
                if (!item.isDecoy && item.idx === round.question.correct) {
                  bg = 'rgba(0,230,118,0.15)';
                  borderC = C.green;
                  col = C.green;
                  anim = 'bb-correct-pop 0.4s ease';
                } else if (
                  (item.isDecoy && round.answerIdx === -1) ||
                  (!item.isDecoy && item.idx === round.answerIdx && item.idx !== round.question.correct)
                ) {
                  bg = 'rgba(255,23,68,0.15)';
                  borderC = C.danger;
                  col = C.danger;
                  anim = 'bb-wrong-shake 0.4s ease';
                }
              }

              return (
                <button
                  key={item.isDecoy ? 'decoy' : item.idx}
                  onClick={() => handleAnswer(item.isDecoy ? -1 : item.idx)}
                  disabled={round.answered || !isLocalTurn}
                  style={{
                    padding: 'clamp(10px, 1.5vh, 14px) clamp(8px, 2vw, 10px)',
                    background: bg,
                    border: `1.5px solid ${borderC}`,
                    borderRadius: 'clamp(8px, 2vw, 14px)',
                    color: col,
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                    fontWeight: 800,
                    cursor: round.answered || !isLocalTurn ? 'default' : 'pointer',
                    textAlign: 'center',
                    animation: isBlinded ? 'bb-blur-reveal 5s ease-out forwards' : (anim || 'none'),
                    opacity: round.answered && round.answerIdx !== null && !item.isDecoy && item.idx !== round.question.correct && item.idx !== round.answerIdx ? 0.6 : 1,
                    filter: isBlinded ? 'blur(12px)' : 'none',
                    // 5th decoy answer spans full width
                    ...(round.decoy && renderIdx === allAnswers.length - 1 && allAnswers.length % 2 !== 0 ? { gridColumn: '1 / -1' } : {}),
                  }}
                >
                  {item.text}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Power-ups bar */}
      {settings.enablePowerups && isLocalTurn && !round.answered && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {([
            { key: 'shield' as const, icon: '\uD83D\uDEE1\uFE0F', label: 'Shield' },
            { key: 'freeze' as const, icon: '\u2744\uFE0F', label: 'Freeze' },
            { key: 'clone' as const, icon: '\uD83E\uDDE8', label: 'Throw' },
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

      {/* Waiting player overlay on question card */}
      {!isLocalTurn && !round.answered && overlay === 'none' && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(12px, 2vh, 24px)',
          background: 'linear-gradient(to top, rgba(13,13,15,0.95) 60%, rgba(13,13,15,0))',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: C.card,
            border: `1.5px solid ${C.accent}44`,
            borderRadius: 16,
            padding: '12px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            animation: 'bb-pulse-text 2s ease infinite alternate',
          }}>
            <div style={{ fontSize: '0.75rem', color: C.muted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 }}>Not your turn</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {currentPlayer?.avatar} {currentPlayer?.name} is answering...
            </div>
          </div>
        </div>
      )}

      {/* ===== OVERLAYS ===== */}

      {/* Your turn notification */}
      {yourTurnNotif && (
        <div style={{ ...overlayBase, background: 'rgba(0,200,100,0.12)', pointerEvents: 'none' }}>
          <div style={{ fontSize: '4rem' }}>{'\uD83E\uDDE0'}</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem',
            letterSpacing: 4, color: C.green,
            textShadow: '0 0 30px rgba(0,200,100,0.6)', textAlign: 'center',
          }}>
            YOUR TURN!
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: C.muted, marginTop: 4 }}>Answer quickly!</div>
        </div>
      )}

      {/* Bomb throw notification — centered for the receiver */}
      {throwNotif && (
        <div style={{ ...overlayBase, background: 'rgba(255,149,0,0.15)' }}>
          <div style={{ fontSize: '5rem', animation: 'bb-pulse-bomb 1s ease-in-out infinite' }}>{'\uD83D\uDCA3'}</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem',
            letterSpacing: 4, color: C.accent2,
            textShadow: '0 0 30px rgba(255,149,0,0.6)', textAlign: 'center',
          }}>
            BOMB INCOMING!
          </div>
          {throwFromName && <div style={{ fontSize: '1rem', fontWeight: 800, color: C.white }}>from {throwFromName}</div>}
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: C.muted, marginTop: 4 }}>Get ready to answer...</div>
        </div>
      )}

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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: 3, color: C.accent4, textAlign: 'center' }}>
                {'\u26A1'} CHAIN REACTION!
              </div>
              {chainTimeLeft > 0 && (
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem',
                  color: chainTimeLeft <= 5 ? C.danger : C.accent4,
                  background: `${chainTimeLeft <= 5 ? C.danger : C.accent4}22`,
                  padding: '4px 14px', borderRadius: 10, minWidth: 36, textAlign: 'center',
                  animation: chainTimeLeft <= 5 ? 'bb-pulse-text 0.5s ease infinite alternate' : 'none',
                }}>
                  {chainTimeLeft}s
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: C.muted, marginBottom: 4 }}>Everyone answers &mdash; wrong answer loses a life!</div>
            {!chainAnswered ? (
              <>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '16px 0', padding: 16, background: C.surface, borderRadius: 12 }}>
                  {chainQuestion.q}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {chainQuestion.a.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => handleChainAnswer(i)}
                      style={{
                        padding: 12, background: C.surface,
                        border: `1.5px solid ${C.border}`, borderRadius: 12,
                        color: C.white, fontFamily: "'Nunito', sans-serif",
                        fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{'\u2705'}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: C.muted }}>
                  Waiting for other players...
                </div>
                <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 8 }}>
                  {chainRespondents.size} / {activePlayers.length} answered
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lucky Question — all-player race */}
      {overlay === 'lucky' && chainQuestion && (
        <div style={{ ...overlayBase, background: 'rgba(255,215,0,0.15)' }}>
          <div style={{
            background: C.card, border: '2px solid #ffd700', borderRadius: 20,
            padding: '28px 36px', textAlign: 'center', maxWidth: 380, width: '90%',
            boxShadow: '0 0 60px rgba(255,215,0,0.3)', animation: 'bb-chain-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: 3, color: '#ffd700', textAlign: 'center' }}>
                {'\u2B50'} LUCKY QUESTION!
              </div>
              {chainTimeLeft > 0 && !luckyWinnerId && (
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem',
                  color: chainTimeLeft <= 5 ? C.danger : '#ffd700',
                  background: `${chainTimeLeft <= 5 ? C.danger : '#ffd700'}22`,
                  padding: '4px 14px', borderRadius: 10, minWidth: 36, textAlign: 'center',
                  animation: chainTimeLeft <= 5 ? 'bb-pulse-text 0.5s ease infinite alternate' : 'none',
                }}>
                  {chainTimeLeft}s
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: C.muted, marginBottom: 4 }}>First correct answer wins +1 life!</div>
            {luckyWinnerId ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>{'\uD83C\uDFC6'}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffd700' }}>
                  {players.find((p) => p.id === luckyWinnerId)?.name || 'Someone'} wins!
                </div>
                <div style={{ fontSize: '0.85rem', color: C.muted, marginTop: 4 }}>+1 life earned!</div>
              </div>
            ) : !chainAnswered ? (
              <>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '16px 0', padding: 16, background: C.surface, borderRadius: 12 }}>
                  {chainQuestion.q}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {chainQuestion.a.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => handleLuckyAnswer(i)}
                      style={{
                        padding: 12, background: C.surface,
                        border: '1.5px solid #ffd70055', borderRadius: 12,
                        color: C.white, fontFamily: "'Nunito', sans-serif",
                        fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{'\u23F3'}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: C.muted }}>
                  Waiting for the fastest answer...
                </div>
              </div>
            )}
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
              {'\uD83D\uDE08'} SABOTAGE!
            </div>
            <div style={{ fontSize: '0.85rem', color: C.muted }}>
              {sabotageStep === 'type'
                ? <>{currentPlayer?.name} answered fast &mdash; choose a sabotage!</>
                : <>Select a target for <strong>{selectedSabotageType === 'blind' ? 'Blind' : selectedSabotageType === 'timebomb' ? 'Time Bomb' : 'Decoy'}</strong></>
              }
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {isLocalTurn ? (
                <>
                  {sabotageStep === 'type' ? (
                    <>
                      <button
                        onClick={() => { setSelectedSabotageType('blind'); setSabotageStep('target'); }}
                        style={sabotageOptionStyle}
                      >
                        <span>{'\uD83D\uDE48'}</span> <span style={{ whiteSpace: 'nowrap' }}>Blind &mdash; <span style={{ color: C.muted, fontWeight: 600 }}>Blur all answer options</span></span>
                      </button>
                      <button
                        onClick={() => { setSelectedSabotageType('timebomb'); setSabotageStep('target'); }}
                        style={sabotageOptionStyle}
                      >
                        <span>{'\u23F1\uFE0F'}</span> <span style={{ whiteSpace: 'nowrap' }}>Time Bomb &mdash; <span style={{ color: C.muted, fontWeight: 600 }}>-{({ easy: 8, medium: 5, hard: 3 })[settings.difficulty]}s from timer</span></span>
                      </button>
                      <button
                        onClick={() => { setSelectedSabotageType('decoy'); setSabotageStep('target'); }}
                        style={sabotageOptionStyle}
                      >
                        <span>{'\uD83C\uDFAD'}</span> <span style={{ whiteSpace: 'nowrap' }}>Decoy &mdash; <span style={{ color: C.muted, fontWeight: 600 }}>Add a fake answer</span></span>
                      </button>
                      <button
                        onClick={() => handleSkipSabotage()}
                        style={{ ...sabotageOptionStyle, color: C.muted, borderColor: C.muted }}
                      >
                        <span>{'\u23ED\uFE0F'}</span> Skip
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSabotageStep('type')}
                        style={{ ...sabotageOptionStyle, color: C.muted, borderColor: C.muted, fontSize: '0.8rem' }}
                      >
                        {'\u2190'} Back
                      </button>
                      {activePlayers.filter((p) => p.id !== currentPlayer?.id).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectedSabotageType && handleSabotage(selectedSabotageType, p.id)}
                          style={sabotageOptionStyle}
                        >
                          <span style={{ fontSize: '1.3rem' }}>{p.avatar}</span> {p.name}
                        </button>
                      ))}
                    </>
                  )}
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
              {'\uD83E\uDDE8'} THROW!
            </div>
            <div style={{ fontSize: '0.85rem', color: C.muted }}>
              {isLocalTurn ? 'Pick a player to throw the bomb to!' : `${currentPlayer?.name} is throwing the bomb...`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {isLocalTurn ? (
                activePlayers.filter((p) => p.id !== localPlayerId).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleCloneTarget(p.id)}
                    style={sabotageOptionStyle}
                  >
                    <span>{p.avatar} Throw to <strong>{p.name}</strong></span>
                  </button>
                ))
              ) : (
                <div style={{ fontSize: '0.9rem', color: C.muted, padding: 16 }}>
                  Waiting for {currentPlayer?.name} to choose...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banner Notification */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%',
        transform: `translateX(-50%) scale(${toastVisible ? 1 : 0.8})`,
        opacity: toastVisible ? 1 : 0,
        background: 'rgba(30, 30, 36, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1.5px solid ${C.border}`, borderRadius: 16,
        padding: '16px 28px', fontSize: '1.05rem', fontWeight: 800,
        zIndex: 1000, transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: "'Nunito', sans-serif", color: C.white,
        pointerEvents: 'none', textAlign: 'center', maxWidth: '85%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {toast}
      </div>
    </div>
  );
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
    '\uD83E\uDDE9': C.accent4,
    '\uD83D\uDCBB': C.accent3,
    '\uD83D\uDD24': C.green,
    '\uD83E\uDDE0': C.yellow,
  };
  return map[icon] || C.white;
}

function getCategoryIcon(q: Question): string {
  const text = q.q.toLowerCase();
  if (text.includes('binary') || text.includes('print') || text.includes('loop') || text.includes('bug') || text.includes('range') || text.includes('array')) return '\uD83D\uDCBB';
  if (text.includes('anagram') || text.includes('palindrome') || text.includes('analogy') || text.includes('odd one out')) return '\uD83D\uDD24';
  if (text.includes('remember') || text.includes('previous') || text.includes('first question')) return '\uD83E\uDDE0';
  if (text.includes('pattern') || text.includes('true') || text.includes('false') || text.includes('syllogism') || text.includes('all ') || text.includes('if ')) return '\uD83E\uDDE9';
  return '\uD83D\uDD22';
}

function getCategoryName(q: Question): string {
  const icon = getCategoryIcon(q);
  const map: Record<string, string> = {
    '\uD83D\uDD22': 'MATH',
    '\uD83E\uDDE9': 'LOGIC',
    '\uD83D\uDCBB': 'COMP. THINKING',
    '\uD83D\uDD24': 'WORD',
    '\uD83E\uDDE0': 'MEMORY',
  };
  return map[icon] || 'QUIZ';
}

export default GameScreen;
