// ===== Code Racers — Main Game Component =====
// Multiplayer robot programming race: program your robot, execute simultaneously!

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { trackGameEvent, trackButtonClick, trackGameCompletion } from '../../utils/analytics';
import { useGameState } from '../../hooks/useGameState';
import type { CRPlayer, CRSettings, GamePhase, RoundState, BlockType, CRPeerMessage } from './types';
import { ROBOT_AVATARS, PLAYER_COLORS, DIFFICULTY_CONFIG, MAX_PLAYERS } from './types';
import { initAudioContext, resumeAudioContext, playSound } from './audio';
import { generateRoomCode, GameRoom } from './webrtc';
import { generateGrid, createRobots } from './grid';
import { executePrograms, calculateBonuses } from './execution';
import { screenBase, KEYFRAMES, C, lobbyCard, cardTitle, startBtn, NOISE_BG, overlayBase } from './styles';
import LobbyScreen from './LobbyScreen';
import GameScreen from './GameScreen';
import GameOverScreen from './GameOverScreen';

function getRoomParam(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

const styleId = 'code-racers-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

let playerIdCounter = 0;
function nextPlayerId(): string {
  return `cr_${++playerIdCounter}_${Date.now()}`;
}

const DEFAULT_SETTINGS: CRSettings = {
  difficulty: 'easy',
  totalRounds: DIFFICULTY_CONFIG.easy.rounds,
  planningTime: DIFFICULTY_CONFIG.easy.planningTime,
  enableSound: true,
  gridSize: DIFFICULTY_CONFIG.easy.gridSize,
  instructionSlots: DIFFICULTY_CONFIG.easy.instructionSlots,
};

function createDefaultRoundState(settings: CRSettings, players: CRPlayer[], roundNumber: number): RoundState {
  const config = DIFFICULTY_CONFIG[settings.difficulty];
  const grid = generateGrid(settings.gridSize, config, roundNumber, players.length);
  const robots = createRobots(players, settings.gridSize);
  return {
    roundNumber,
    totalRounds: settings.totalRounds,
    grid,
    robots,
    phase: 'planning',
    timeLeft: settings.planningTime,
    executionStep: 0,
    totalSteps: 0,
    executionFrames: [],
    roundBonuses: [],
    gemsCollectedThisRound: {},
  };
}

const CodeRacersGame: React.FC = () => {
  const { updateGameState } = useGameState();
  const [initialRoomParam] = useState(() => getRoomParam());
  const [phase, setPhase] = useState<GamePhase>(initialRoomParam ? 'lobby' : 'menu');
  const [roomCode, setRoomCode] = useState(() => initialRoomParam || '');
  const [localPlayerId] = useState(() => nextPlayerId());
  const [isHost, setIsHost] = useState(() => !initialRoomParam);
  const [hasJoined, setHasJoined] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [settings, setSettings] = useState<CRSettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<CRPlayer[]>([]);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [countdown, setCountdown] = useState(3);

  const roomRef = useRef<GameRoom | null>(null);
  const startTimeRef = useRef<number>(0);
  const phaseRef = useRef<GamePhase>(phase);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const programsReceivedRef = useRef<Map<string, BlockType[]>>(new Map());

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Audio init
  useEffect(() => {
    let initialized = false;
    const handler = () => {
      if (!initialized) { initAudioContext(); initialized = true; }
      resumeAudioContext();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  // Track game state
  useEffect(() => {
    updateGameState('code-racers', phase !== 'menu');
  }, [phase, updateGameState]);

  // Analytics
  useEffect(() => {
    if (phase === 'planning') {
      trackGameEvent('code-racers', 'start', {
        players: players.length,
        difficulty: settings.difficulty,
      });
      startTimeRef.current = Date.now();
    }
  }, [phase]);

  // Setup WebRTC
  useEffect(() => {
    if (phase === 'menu' || !roomCode) return;
    setRoomReady(false);

    roomRef.current = new GameRoom(
      roomCode,
      isHost,
      (msg: CRPeerMessage) => {
        if (msg.type === 'player-join') {
          const payload = msg.payload as { name: string; playerId: string };
          const playerId = payload.playerId || msg.senderId;
          setPlayers(prev => {
            if (prev.length >= MAX_PLAYERS) return prev;
            if (prev.some(p => p.id === playerId || p.peerId === msg.senderId)) return prev;
            return [...prev, {
              id: playerId,
              name: payload.name || `Player ${prev.length + 1}`,
              avatar: ROBOT_AVATARS[prev.length % ROBOT_AVATARS.length],
              color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length],
              totalScore: 0,
              roundScore: 0,
              gemsCollected: 0,
              bonusSlots: 0,
              programSubmitted: false,
              isLocal: false,
              peerId: msg.senderId,
            }];
          });
        } else if (msg.type === 'lobby-settings') {
          setSettings(msg.payload as CRSettings);
        } else if (msg.type === 'game-start') {
          const payload = msg.payload as { settings: CRSettings; players: CRPlayer[]; roundState: RoundState };
          setSettings(payload.settings);
          setPlayers(payload.players);
          setRoundState(payload.roundState);
          setPhase('countdown');
        } else if (msg.type === 'program-submitted') {
          const payload = msg.payload as { playerId: string; program: BlockType[] };
          programsReceivedRef.current.set(payload.playerId, payload.program);
          setPlayers(prev => prev.map(p =>
            p.id === payload.playerId ? { ...p, programSubmitted: true } : p
          ));
        } else if (msg.type === 'game-state') {
          const payload = msg.payload as { players: CRPlayer[]; roundState: RoundState; phase: GamePhase };
          setPlayers(payload.players);
          setRoundState(payload.roundState);
          setPhase(payload.phase);
        } else if (msg.type === 'return-lobby') {
          setPhase('lobby');
          setRoundState(null);
          programsReceivedRef.current.clear();
        } else if (msg.type === 'player-update') {
          setPlayers(msg.payload as CRPlayer[]);
        }
      },
      (peerId) => {
        console.log('[Code Racers] Peer connected:', peerId);
      },
      (peerId) => {
        console.log('[Code Racers] Peer disconnected:', peerId);
        if (!isHost) {
          setPhase('menu');
          setRoomCode('');
          setHasJoined(false);
          alert('Host has left the game.');
        }
      },
      () => { setRoomReady(true); },
      (_errorType, message) => {
        alert(message);
        setPhase('menu');
        setRoomCode('');
        setHasJoined(false);
      },
    );

    return () => {
      roomRef.current?.destroy();
      setRoomReady(false);
    };
  }, [roomCode, isHost]);

  // Broadcast settings
  useEffect(() => {
    if (isHost && roomRef.current && phase === 'lobby') {
      roomRef.current.broadcast('lobby-settings', settings);
    }
  }, [settings, isHost, phase]);

  // Auto-scroll
  useEffect(() => {
    if (phase === 'menu' || phase === 'countdown' || phase === 'planning') {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 150);
    }
  }, [phase]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    playSound('countdown', settings.enableSound);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('planning');
          return 0;
        }
        playSound('countdown', settings.enableSound);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, settings.enableSound]);

  // Planning timer (host-managed)
  useEffect(() => {
    if (phase !== 'planning' || !isHost || !roundState) return;
    timerRef.current = setInterval(() => {
      setRoundState(prev => {
        if (!prev) return prev;
        const newTime = prev.timeLeft - 1;
        if (newTime <= 0) {
          // Time's up — execute with whatever programs are submitted
          if (timerRef.current) clearInterval(timerRef.current);
          executeRound();
          return { ...prev, timeLeft: 0 };
        }
        // Broadcast time update
        if (roomRef.current && newTime % 2 === 0) {
          roomRef.current.broadcast('game-state', {
            players,
            roundState: { ...prev, timeLeft: newTime },
            phase: 'planning',
          });
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isHost, roundState?.roundNumber]);

  // Check if all programs submitted
  useEffect(() => {
    if (phase !== 'planning' || !isHost) return;
    const activePlayers = players.filter(p => p.isLocal || p.peerId);
    const allSubmitted = activePlayers.length > 0 && activePlayers.every(p => p.programSubmitted);
    if (allSubmitted && players.length > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => executeRound(), 500);
    }
  }, [players, phase, isHost]);

  const executeRound = useCallback(() => {
    if (!roundState || !isHost) return;

    // Build robot programs from submitted data
    const robots = roundState.robots.map(r => {
      const prog = programsReceivedRef.current.get(r.playerId) || [];
      return { ...r, program: prog };
    });

    // Execute
    const { frames, finalGrid, gemsCollected } = executePrograms(robots, roundState.grid);
    const bonuses = calculateBonuses(gemsCollected, robots, finalGrid);

    // Update player scores
    const updatedPlayers = players.map(p => {
      const gemPoints = gemsCollected[p.id] || 0;
      const bonusPoints = bonuses.filter(b => b.playerId === p.id).reduce((sum, b) => sum + b.points, 0);
      const roundScore = gemPoints + bonusPoints;
      return {
        ...p,
        totalScore: p.totalScore + roundScore,
        roundScore,
        gemsCollected: p.gemsCollected + gemPoints,
        programSubmitted: false,
        // Check for recharge pad bonus
        bonusSlots: p.bonusSlots + (
          frames[frames.length - 1]?.robots.some(rb => {
            if (rb.playerId !== p.id) return false;
            return finalGrid[rb.row]?.[rb.col]?.type === 'rechargePad';
          }) ? 1 : 0
        ),
      };
    });

    const newRoundState: RoundState = {
      ...roundState,
      phase: 'executing',
      executionFrames: frames,
      roundBonuses: bonuses,
      gemsCollectedThisRound: gemsCollected,
      robots,
    };

    setPlayers(updatedPlayers);
    setRoundState(newRoundState);
    setPhase('executing');
    programsReceivedRef.current.clear();

    // Broadcast to all peers
    if (roomRef.current) {
      roomRef.current.broadcast('game-state', {
        players: updatedPlayers,
        roundState: newRoundState,
        phase: 'executing',
      });
    }

    // After execution animation, show summary
    const animDuration = frames.length * 600 + 500;
    const currentRoundNumber = newRoundState.roundNumber;
    setTimeout(() => {
      const summaryState = { ...newRoundState, phase: 'summary' as const };
      setRoundState(summaryState);

      if (roomRef.current) {
        roomRef.current.broadcast('game-state', {
          players: updatedPlayers,
          roundState: summaryState,
          phase: 'executing',
        });
      }

      // After summary, start next round or end game
      setTimeout(() => {
        if (currentRoundNumber >= settings.totalRounds) {
          // Game over
          const winnerScore = [...updatedPlayers].sort((a, b) => b.totalScore - a.totalScore)[0]?.totalScore || 0;
          trackGameCompletion('code-racers', winnerScore, Date.now() - startTimeRef.current, settings.difficulty);
          playSound('victory', settings.enableSound);
          setPhase('gameover');
          if (roomRef.current) {
            roomRef.current.broadcast('game-state', {
              players: updatedPlayers,
              roundState: summaryState,
              phase: 'gameover',
            });
          }
        } else {
          // Next round
          const nextRound = createDefaultRoundState(settings, updatedPlayers, roundState.roundNumber + 1);
          setRoundState(nextRound);
          setPhase('planning');
          playSound('roundStart', settings.enableSound);
          if (roomRef.current) {
            roomRef.current.broadcast('game-state', {
              players: updatedPlayers,
              roundState: nextRound,
              phase: 'planning',
            });
          }
        }
      }, 3500);
    }, animDuration);
  }, [roundState, isHost, players, settings]);

  // --- Handlers ---

  const handleCreateRoom = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setPlayers([{
      id: localPlayerId,
      name: 'Host',
      avatar: ROBOT_AVATARS[0],
      color: PLAYER_COLORS[0],
      totalScore: 0,
      roundScore: 0,
      gemsCollected: 0,
      bonusSlots: 0,
      programSubmitted: false,
      isLocal: true,
    }]);
    setPhase('lobby');
    playSound('uiClick', settings.enableSound);
    trackButtonClick('code-racers', 'create-room');
  }, [localPlayerId, settings.enableSound]);

  const handleJoinRoom = useCallback(() => {
    const code = manualCode.trim().toUpperCase();
    if (code.length < 4) return;
    setRoomCode(code);
    setIsHost(false);
    setPhase('lobby');
    playSound('uiClick', settings.enableSound);
    trackButtonClick('code-racers', 'join-room');
  }, [manualCode, settings.enableSound]);

  // Guest sends join message once room is ready
  useEffect(() => {
    if (!isHost && roomReady && phase === 'lobby' && !hasJoined) {
      const name = joinName.trim() || `Player ${Date.now() % 100}`;
      roomRef.current?.broadcast('player-join', {
        name,
        playerId: localPlayerId,
      });
      setPlayers([{
        id: localPlayerId,
        name,
        avatar: ROBOT_AVATARS[0],
        color: PLAYER_COLORS[0],
        totalScore: 0,
        roundScore: 0,
        gemsCollected: 0,
        bonusSlots: 0,
        programSubmitted: false,
        isLocal: true,
      }]);
      setHasJoined(true);
    }
  }, [roomReady, isHost, phase, hasJoined, joinName, localPlayerId]);

  const handleUpdateSettings = useCallback((newSettings: CRSettings) => {
    setSettings(newSettings);
  }, []);

  const handleUpdatePlayerName = useCallback((id: string, name: string) => {
    setPlayers(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, name } : p);
      if (isHost && roomRef.current) {
        roomRef.current.broadcast('player-update', updated);
      }
      return updated;
    });
  }, [isHost]);

  const handleStartGame = useCallback(() => {
    const round = createDefaultRoundState(settings, players, 1);
    setRoundState(round);
    programsReceivedRef.current.clear();

    if (roomRef.current) {
      roomRef.current.broadcast('game-start', {
        settings,
        players,
        roundState: round,
      });
    }

    setPhase('countdown');
    trackButtonClick('code-racers', 'start-game');
  }, [settings, players]);

  const handleSubmitProgram = useCallback((program: BlockType[]) => {
    // Mark local player as submitted
    setPlayers(prev => prev.map(p =>
      p.id === localPlayerId ? { ...p, programSubmitted: true } : p
    ));

    if (isHost) {
      programsReceivedRef.current.set(localPlayerId, program);
    }

    // Broadcast to peers
    if (roomRef.current) {
      roomRef.current.broadcast('program-submitted', {
        playerId: localPlayerId,
        program,
      });
    }
  }, [localPlayerId, isHost]);

  const handlePlayAgain = useCallback(() => {
    setPlayers(prev => prev.map(p => ({
      ...p,
      totalScore: 0,
      roundScore: 0,
      gemsCollected: 0,
      bonusSlots: 0,
      programSubmitted: false,
    })));
    setRoundState(null);
    programsReceivedRef.current.clear();
    setPhase('lobby');

    if (roomRef.current) {
      roomRef.current.broadcast('return-lobby', {});
    }
  }, []);

  // --- Render ---

  // Menu screen
  if (phase === 'menu') {
    return (
      <div style={screenBase}>
        <div style={NOISE_BG} />
        <div style={{ padding: '40px 16px', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '4rem', animation: 'cr-pulse 2s ease-in-out infinite' }}>🤖</div>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(2rem, 8vw, 3rem)',
              letterSpacing: 8,
              background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '8px 0',
            }}>
              CODE RACERS
            </h1>
            <p style={{ fontSize: '0.8rem', color: C.muted, maxWidth: 300, lineHeight: 1.5 }}>
              Program your robot. Race for gems. Outsmart your opponents.
            </p>
          </div>

          <button
            onClick={handleCreateRoom}
            style={startBtn}
          >
            🚀 CREATE ROOM
          </button>

          <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: C.muted, letterSpacing: 2, marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>
              OR JOIN A ROOM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                placeholder="Your name"
                maxLength={12}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: C.card,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 12,
                  color: C.white,
                  fontSize: '0.85rem',
                  fontFamily: "'Nunito', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={6}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    background: C.card,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 12,
                    color: C.accent,
                    fontSize: '0.95rem',
                    fontFamily: "'Space Mono', monospace",
                    letterSpacing: 4,
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={manualCode.trim().length < 4}
                  style={{
                    padding: '12px 24px',
                    background: manualCode.trim().length >= 4 ? C.accent : C.surface,
                    border: `1.5px solid ${manualCode.trim().length >= 4 ? C.accent : C.border}`,
                    borderRadius: 12,
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: manualCode.trim().length >= 4 ? 'pointer' : 'not-allowed',
                    fontFamily: "'Nunito', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>

          {/* How to play */}
          <div style={lobbyCard}>
            <div style={cardTitle}>HOW TO PLAY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['🎯', 'Drag instruction blocks to program your robot'],
                ['⏱️', 'Everyone programs simultaneously within the time limit'],
                ['▶️', 'All robots execute their programs at once'],
                ['💎', 'Collect gems to score points — highest score wins!'],
                ['🧠', 'Use loops, conditions, and strategy to outcode opponents'],
              ].map(([icon, text], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.75rem', color: C.muted, lineHeight: 1.4 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby screen
  if (phase === 'lobby') {
    return (
      <LobbyScreen
        roomCode={roomCode}
        players={players}
        settings={settings}
        isHost={isHost}
        localPlayerId={localPlayerId}
        onUpdateSettings={handleUpdateSettings}
        onUpdatePlayerName={handleUpdatePlayerName}
        onStartGame={handleStartGame}
      />
    );
  }

  // Countdown overlay
  if (phase === 'countdown') {
    return (
      <div style={{ ...overlayBase, background: `${C.bg}ee` }}>
        <div style={{
          fontSize: '6rem',
          fontFamily: "'Bebas Neue', sans-serif",
          color: C.accent,
          animation: 'cr-countdown-pulse 1s ease-in-out',
        }}>
          {countdown || '🚀'}
        </div>
        <div style={{
          fontSize: '1rem',
          color: C.muted,
          fontFamily: "'Space Mono', monospace",
          letterSpacing: 3,
        }}>
          {countdown ? 'GET READY' : 'GO!'}
        </div>
      </div>
    );
  }

  // Game screen (planning, executing — summary is driven by roundState.phase inside GameScreen)
  if ((phase === 'planning' || phase === 'executing') && roundState) {
    return (
      <GameScreen
        players={players}
        roundState={roundState}
        settings={settings}
        localPlayerId={localPlayerId}
        isHost={isHost}
        onSubmitProgram={handleSubmitProgram}
      />
    );
  }

  // Game over
  if (phase === 'gameover') {
    return (
      <GameOverScreen
        players={players}
        soundEnabled={settings.enableSound}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return null;
};

export default CodeRacersGame;
