// ===== Pathfinder Duel — Main Game Component =====
// Multiplayer optimization game: trace paths, find the best route, outsmart your opponents!

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { trackGameEvent, trackButtonClick, trackGameCompletion } from '../../utils/analytics';
import { useGameState } from '../../hooks/useGameState';
import type { PDPlayer, PDSettings, GamePhase, RoundType, RoundState, PathStep, PDPeerMessage } from './types';
import { AVATARS, PLAYER_COLORS, DIFFICULTY_CONFIG } from './types';
import { initAudioContext, resumeAudioContext, playSound } from './audio';
import { generateRoomCode, GameRoom } from './webrtc';
import { generateGrid, generateRoundSequence, findOptimalPath, calculateRoundScores, applyBlockers, hasValidPath } from './grid';
import { screenBase, KEYFRAMES, C, lobbyCard, cardTitle, startBtn } from './styles';
import LobbyScreen from './LobbyScreen';
import GameScreen from './GameScreen';
import RevealScreen from './RevealScreen';
import GameOverScreen from './GameOverScreen';

function getRoomParam(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

// Inject keyframe animations
const styleId = 'pathfinder-duel-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

let playerIdCounter = 0;
function nextPlayerId(): string {
  return `pd_${++playerIdCounter}_${Date.now()}`;
}

const DEFAULT_SETTINGS: PDSettings = {
  difficulty: 'easy',
  totalRounds: 5,
  enableSound: true,
  roundTypes: ['classic'],
};

const PathfinderDuelGame: React.FC = () => {
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
  const [settings, setSettings] = useState<PDSettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<PDPlayer[]>([]);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [roundSequence, setRoundSequence] = useState<RoundType[]>([]);
  const [countdown, setCountdown] = useState(3);

  const roomRef = useRef<GameRoom | null>(null);
  const startTimeRef = useRef<number>(0);
  const phaseRef = useRef<GamePhase>(phase);
  const playersRef = useRef<PDPlayer[]>(players);
  const roundStateRef = useRef<RoundState | null>(roundState);
  const settingsRef = useRef<PDSettings>(settings);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { roundStateRef.current = roundState; }, [roundState]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Init audio
  useEffect(() => {
    let initialized = false;
    const handler = () => {
      if (!initialized) { initAudioContext(); initialized = true; }
      resumeAudioContext();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  // Track game state for floating buttons
  useEffect(() => {
    updateGameState('pathfinder-duel', phase !== 'menu');
  }, [phase, updateGameState]);

  // Analytics
  useEffect(() => {
    if (phase === 'playing') {
      trackGameEvent('pathfinder-duel', 'start', {
        players: players.length,
        difficulty: settings.difficulty,
      });
      startTimeRef.current = Date.now();
    }
  }, [phase]);

  // Periodic state sync to guests (every second during playing phase)
  // This ensures guests receive updated timeLeft from the host's timer
  useEffect(() => {
    if (!isHost || phase !== 'playing') return;

    const interval = setInterval(() => {
      if (roomRef.current && roundStateRef.current) {
        roomRef.current.broadcast('game-state', {
          roundState: roundStateRef.current,
          players: playersRef.current,
          phase: 'playing',
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, phase, roundState?.roundNumber]);

  // Setup WebRTC room
  useEffect(() => {
    if (phase === 'menu' || !roomCode) return;
    setRoomReady(false);

    roomRef.current = new GameRoom(
      roomCode,
      isHost,
      (msg: PDPeerMessage) => {
        if (msg.type === 'player-join') {
          const payload = msg.payload as { name: string; avatar: string; playerId: string };
          const playerId = payload.playerId || msg.senderId;
          setPlayers((prev) => {
            if (prev.length >= 6) return prev;
            if (prev.some((p) => p.id === playerId || p.peerId === msg.senderId)) return prev;
            return [
              ...prev,
              {
                id: playerId,
                name: payload.name || `Player ${prev.length + 1}`,
                avatar: payload.avatar || AVATARS[prev.length % AVATARS.length],
                color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length],
                totalScore: 0,
                roundScore: 0,
                path: [],
                submitted: false,
                pathSum: 0,
                isLocal: false,
                peerId: msg.senderId,
              },
            ];
          });
        } else if (msg.type === 'lobby-settings') {
          setSettings(msg.payload as PDSettings);
        } else if (msg.type === 'game-start') {
          const payload = msg.payload as { settings: PDSettings; players: PDPlayer[]; roundSequence: RoundType[] };
          setSettings(payload.settings);
          setPlayers(payload.players);
          setRoundSequence(payload.roundSequence);
          setPhase('countdown');
        } else if (msg.type === 'game-state') {
          const payload = msg.payload as { roundState: RoundState; players: PDPlayer[]; phase: GamePhase };
          setRoundState(payload.roundState);
          setPlayers(payload.players);
          if (payload.phase) setPhase(payload.phase);
        } else if (msg.type === 'path-submitted') {
          // Host receives a guest's path submission
          const payload = msg.payload as { playerId: string; path: PathStep[]; pathSum: number; submittedAt: number };
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === payload.playerId
                ? { ...p, path: payload.path, pathSum: payload.pathSum, submitted: true, submittedAt: payload.submittedAt }
                : p
            )
          );
        } else if (msg.type === 'blocker-placed') {
          const payload = msg.payload as { blockedCells: PathStep[] };
          setRoundState((prev) => {
            if (!prev) return prev;
            const newGrid = applyBlockers(prev.grid, payload.blockedCells);
            return { ...prev, grid: newGrid, blockedCells: payload.blockedCells, phase: 'drawing' };
          });
        } else if (msg.type === 'next-round') {
          // Host triggers next round — guests receive updated state via game-state
        } else if (msg.type === 'return-lobby') {
          setPhase('lobby');
          setRoundState(null);
          setPlayers((prev) => prev.map(p => ({
            ...p, totalScore: 0, roundScore: 0, path: [], submitted: false, pathSum: 0, isWinner: false,
          })));
        }
      },
      (peerId) => {
        console.log('[Pathfinder Duel] Peer connected:', peerId);
      },
      (peerId) => {
        console.log('[Pathfinder Duel] Peer disconnected:', peerId);
        if (!isHost) {
          setPhase('menu');
          setRoomCode('');
          setHasJoined(false);
          setRoundState(null);
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

  // Broadcast settings to peers
  useEffect(() => {
    if (isHost && roomRef.current && phase === 'lobby') {
      roomRef.current.broadcast('lobby-settings', settings);
    }
  }, [settings, isHost, phase]);

  // Countdown timer: 3 → 2 → 1 → playing
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    playSound('countdown', settings.enableSound);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Start first round
          if (isHost) {
            startNewRound(1);
          }
          setPhase('playing');
          return 0;
        }
        playSound('countdown', settings.enableSound);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Check if all players submitted (host only)
  useEffect(() => {
    if (!isHost || phase !== 'playing' || !roundState) return;
    const allSubmitted = players.every(p => p.submitted);
    if (allSubmitted && players.length > 0 && !roundState.allSubmitted) {
      handleAllSubmitted();
    }
  }, [players, phase, roundState, isHost]);

  const startNewRound = useCallback((roundNumber: number) => {
    const seq = roundSequence.length > 0 ? roundSequence : generateRoundSequence(settings.totalRounds, settings.roundTypes);
    if (roundSequence.length === 0) setRoundSequence(seq);

    const roundType = seq[(roundNumber - 1) % seq.length];
    const gridSize = DIFFICULTY_CONFIG[settings.difficulty].gridSize;
    const timer = DIFFICULTY_CONFIG[settings.difficulty].timer;
    const grid = generateGrid(gridSize, gridSize, roundType);

    const mode = roundType === 'minimum' ? 'min' : 'max';
    const { path: optimalPath, sum: optimalSum } = findOptimalPath(grid, mode as 'max' | 'min');

    const newRoundState: RoundState = {
      roundNumber,
      totalRounds: settings.totalRounds,
      roundType,
      grid,
      timeLeft: timer,
      maxTime: timer,
      allSubmitted: false,
      optimalPath,
      optimalSum,
      blockedCells: [],
      phase: roundType === 'blocker' && roundNumber > 1 ? 'placing-blockers' : 'drawing',
    };

    // Reset player round state
    const resetPlayers = players.map(p => ({
      ...p, path: [], submitted: false, pathSum: 0, roundScore: 0, submittedAt: undefined,
    }));

    setRoundState(newRoundState);
    setPlayers(resetPlayers);

    // Broadcast to guests
    if (roomRef.current) {
      roomRef.current.broadcast('game-state', {
        roundState: newRoundState,
        players: resetPlayers,
        phase: 'playing',
      });
    }
  }, [settings, players, roundSequence]);

  const handleAllSubmitted = useCallback(() => {
    if (!roundState) return;

    const mode = roundState.roundType === 'minimum' ? 'min' : 'max';
    const scores = calculateRoundScores(
      players.map(p => ({ id: p.id, pathSum: p.pathSum, submitted: p.submitted, submittedAt: p.submittedAt })),
      mode as 'max' | 'min',
      roundState.optimalSum,
    );

    const updatedPlayers = players.map(p => {
      const result = scores[p.id];
      return result
        ? { ...p, roundScore: result.roundScore, totalScore: p.totalScore + result.roundScore, isWinner: result.isWinner }
        : p;
    });

    const updatedRound = { ...roundState, allSubmitted: true };

    setPlayers(updatedPlayers);
    setRoundState(updatedRound);
    setPhase('reveal');

    playSound('reveal', settings.enableSound);

    if (roomRef.current) {
      roomRef.current.broadcast('game-state', {
        roundState: updatedRound,
        players: updatedPlayers,
        phase: 'reveal',
      });
    }
  }, [roundState, players, settings]);

  const handlePathSubmit = useCallback((path: PathStep[], pathSum: number) => {
    const now = Date.now();
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === localPlayerId
          ? { ...p, path, pathSum, submitted: true, submittedAt: now }
          : p
      )
    );

    if (roomRef.current) {
      roomRef.current.broadcast('path-submitted', {
        playerId: localPlayerId,
        path,
        pathSum,
        submittedAt: now,
      });
    }

    playSound('submit', settings.enableSound);
  }, [localPlayerId, settings]);

  const handleBlockerPlaced = useCallback((blockedCells: PathStep[]) => {
    if (!roundState) return;

    const newGrid = applyBlockers(roundState.grid, blockedCells);

    // Re-calculate optimal path with blockers
    if (!hasValidPath(newGrid)) {
      // Invalid blockers — skip them
      setRoundState(prev => prev ? { ...prev, phase: 'drawing' } : prev);
      return;
    }

    const mode = roundState.roundType === 'minimum' ? 'min' : 'max';
    const { path: optimalPath, sum: optimalSum } = findOptimalPath(newGrid, mode as 'max' | 'min');

    const updatedRound = {
      ...roundState,
      grid: newGrid,
      blockedCells,
      optimalPath,
      optimalSum,
      phase: 'drawing' as const,
    };

    setRoundState(updatedRound);

    if (roomRef.current) {
      roomRef.current.broadcast('blocker-placed', { blockedCells });
      roomRef.current.broadcast('game-state', {
        roundState: updatedRound,
        players,
        phase: 'playing',
      });
    }
  }, [roundState, players]);

  const handleNextRound = useCallback(() => {
    if (!roundState) return;

    if (roundState.roundNumber >= roundState.totalRounds) {
      // Game over
      setPhase('gameover');
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const winner = [...players].sort((a, b) => b.totalScore - a.totalScore)[0];
      trackGameCompletion('pathfinder-duel', winner?.totalScore || 0, duration);
      trackGameEvent('pathfinder-duel', 'complete', {
        winner: winner?.name,
        players: players.length,
        difficulty: settings.difficulty,
      });

      if (roomRef.current) {
        roomRef.current.broadcast('game-state', {
          roundState,
          players,
          phase: 'gameover',
        });
      }
      return;
    }

    startNewRound(roundState.roundNumber + 1);
    setPhase('playing');
  }, [roundState, players, settings, startNewRound]);

  const handleTimeUp = useCallback(() => {
    // Auto-submit current path for local player
    const localPlayer = players.find(p => p.id === localPlayerId);
    if (localPlayer && !localPlayer.submitted) {
      handlePathSubmit(localPlayer.path, localPlayer.pathSum);
    }
  }, [players, localPlayerId, handlePathSubmit]);

  // --- Menu actions ---
  const handleCreateRoom = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setPlayers([{
      id: localPlayerId,
      name: 'Player 1',
      avatar: AVATARS[0],
      color: PLAYER_COLORS[0],
      totalScore: 0,
      roundScore: 0,
      path: [],
      submitted: false,
      pathSum: 0,
      isLocal: true,
    }]);
    setPhase('lobby');
    playSound('uiClick', true);
  }, [localPlayerId]);

  const handleJoinWithCode = useCallback(() => {
    const code = manualCode.trim().toUpperCase();
    if (code.length < 4) return;
    setRoomCode(code);
    setIsHost(false);
    setPlayers([]);
    setPhase('lobby');
    playSound('uiClick', true);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  }, [manualCode]);

  const handleRemovePlayer = useCallback((id: string) => {
    setPlayers((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleUpdatePlayerName = useCallback((id: string, name: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p)),
    );
  }, []);

  const handleStartGame = useCallback(() => {
    if (players.length < 2) return;

    playSound('uiClick', settings.enableSound);
    trackButtonClick('start-game', 'pathfinder-duel-lobby');

    const seq = generateRoundSequence(settings.totalRounds, settings.roundTypes);
    setRoundSequence(seq);

    if (roomRef.current) {
      roomRef.current.broadcast('game-start', { settings, players, roundSequence: seq });
    }

    setPhase('countdown');
  }, [settings, players]);

  const handlePlayAgain = useCallback(() => {
    trackButtonClick('play-again', 'pathfinder-duel-gameover');
    if (roomRef.current) {
      roomRef.current.broadcast('return-lobby', {});
    }
    setPhase('lobby');
    setRoundState(null);
    setRoundSequence([]);
    setPlayers((prev) => prev.map(p => ({
      ...p, totalScore: 0, roundScore: 0, path: [], submitted: false, pathSum: 0, isWinner: false,
    })));
  }, []);

  const handleJoinRoom = useCallback(() => {
    const name = joinName.trim() || 'Player';
    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    if (roomRef.current) {
      roomRef.current.broadcast('player-join', { name, avatar, playerId: localPlayerId });
    }
    setHasJoined(true);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 150);
  }, [joinName, localPlayerId]);

  return (
    <div style={screenBase}>
      {/* Noise overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, opacity: 0.3,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }} />

      {/* Menu screen */}
      {phase === 'menu' && (
        <div style={{ padding: 'clamp(12px, 4vw, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 40, width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 8 }}>
            {'\uD83D\uDDFA\uFE0F'}
          </span>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.8rem, 10vw, 5rem)',
            letterSpacing: 4,
            lineHeight: 0.9,
            background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accent3} 50%, ${C.accent2} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(34,197,94,0.4))',
            marginBottom: 4,
            textAlign: 'center',
          }}>
            PATHFINDER DUEL
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: 4,
            color: C.muted,
            textTransform: 'uppercase',
            marginBottom: 40,
          }}>
            Trace &middot; Optimize &middot; Compete
          </div>

          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              onClick={handleCreateRoom}
              style={{ ...startBtn, fontSize: '1.1rem', padding: '16px 24px', width: '100%' }}
            >
              {'\uD83D\uDDFA\uFE0F'} CREATE ROOM
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 700, letterSpacing: 2 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            <div style={lobbyCard}>
              <h3 style={cardTitle}>{'\uD83D\uDD17'} Join with Code</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ABCDEF"
                  maxLength={6}
                  style={{
                    width: '100%', padding: '12px 16px', background: C.surface,
                    border: `2px solid ${C.border}`, borderRadius: 12,
                    color: C.white, fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.5rem', fontWeight: 700, outline: 'none',
                    letterSpacing: 6, textAlign: 'center', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoinWithCode(); }}
                />
                <button
                  onClick={handleJoinWithCode}
                  disabled={manualCode.trim().length < 4}
                  style={{
                    ...startBtn, fontSize: '1rem', padding: '14px 24px', width: '100%',
                    opacity: manualCode.trim().length >= 4 ? 1 : 0.5,
                    cursor: manualCode.trim().length >= 4 ? 'pointer' : 'not-allowed',
                  }}
                >
                  {'\uD83E\uDDE0'} JOIN ROOM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest join screen */}
      {!isHost && !hasJoined && phase === 'lobby' && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 80 }}>
          <span style={{ fontSize: '4rem' }}>{'\uD83D\uDDFA\uFE0F'}</span>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.5rem, 10vw, 4rem)',
            letterSpacing: 4,
            background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accent3} 50%, ${C.accent2} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            JOIN GAME
          </div>
          <div style={{ ...lobbyCard, width: '100%', maxWidth: 360 }}>
            <h3 style={cardTitle}>{'\uD83D\uDD17'} Room: {roomCode}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                style={{
                  width: '100%', padding: '14px 16px', background: C.surface,
                  border: `2px solid ${C.border}`, borderRadius: 12,
                  color: C.white, fontFamily: "'Nunito', sans-serif",
                  fontSize: '1rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && roomReady) handleJoinRoom(); }}
                autoFocus
              />
              <button
                onClick={handleJoinRoom}
                disabled={!roomReady}
                style={{
                  ...startBtn, fontSize: '1.1rem', padding: '14px 24px',
                  opacity: roomReady ? 1 : 0.5,
                  cursor: roomReady ? 'pointer' : 'not-allowed',
                }}
              >
                {roomReady ? '\uD83E\uDDE0' : '\u23F3'} {roomReady ? 'JOIN' : 'CONNECTING...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest waiting screen */}
      {!isHost && hasJoined && phase === 'lobby' && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 80 }}>
          <span style={{ fontSize: '4rem', animation: 'pd-pulse-text 2s ease-in-out infinite alternate' }}>{'\uD83D\uDDFA\uFE0F'}</span>
          <div style={{ ...lobbyCard, textAlign: 'center', maxWidth: 360 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>You're in!</div>
            <div style={{ fontSize: '0.85rem', color: C.muted }}>
              Waiting for host to start the game...
            </div>
          </div>
        </div>
      )}

      {/* Host lobby */}
      {phase === 'lobby' && isHost && (
        <LobbyScreen
          roomCode={roomCode}
          players={players}
          settings={settings}
          localPlayerId={localPlayerId}
          onUpdateSettings={setSettings}
          onRemovePlayer={handleRemovePlayer}
          onUpdatePlayerName={handleUpdatePlayerName}
          onStartGame={handleStartGame}
        />
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', gap: 24, padding: 24,
        }}>
          <div key={countdown} style={{
            fontSize: 'clamp(8rem, 30vw, 14rem)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontWeight: 900,
            lineHeight: 1,
            background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accent3} 50%, ${C.accent2} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 60px rgba(34,197,94,0.5))',
            animation: 'pd-countdown-pop 0.4s ease',
          }}>
            {countdown}
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '1rem', letterSpacing: 4, color: C.muted, textTransform: 'uppercase',
          }}>
            Get Ready...
          </div>
        </div>
      )}

      {/* Playing */}
      {phase === 'playing' && roundState && (
        <GameScreen
          players={players}
          settings={settings}
          roundState={roundState}
          localPlayerId={localPlayerId}
          isHost={isHost}
          onPathSubmit={handlePathSubmit}
          onBlockerPlaced={handleBlockerPlaced}
          onTimeUp={handleTimeUp}
          onUpdateRoundState={setRoundState}
        />
      )}

      {/* Reveal */}
      {phase === 'reveal' && roundState && (
        <RevealScreen
          players={players}
          roundState={roundState}
          settings={settings}
          isHost={isHost}
          onNextRound={handleNextRound}
        />
      )}

      {/* Game Over */}
      {phase === 'gameover' && (
        <GameOverScreen
          players={players}
          soundEnabled={settings.enableSound}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
};

export default PathfinderDuelGame;
