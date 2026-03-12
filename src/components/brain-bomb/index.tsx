// ===== Brain Bomb — Main Game Component =====
// Multiplayer party game: pass the bomb, answer questions, survive!

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { trackGameEvent, trackButtonClick, trackGameCompletion } from '../../utils/analytics';
import { useGameState } from '../../hooks/useGameState';
import type { Player, LobbySettings, GamePhase } from './types';
import { AVATARS, PLAYER_COLORS, DIFFICULTY_CONFIG } from './types';
import { initAudioContext, playSound } from './audio';
import { generateRoomCode, GameRoom } from './webrtc';
import { screenBase, KEYFRAMES, C, lobbyCard, cardTitle, startBtn } from './styles';
import LobbyScreen from './LobbyScreen';
import GameScreen from './GameScreen';
import GameOverScreen from './GameOverScreen';

// Detect ?room= param for joining
function getRoomParam(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

// Inject keyframe animations
const styleId = 'brain-bomb-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

let playerIdCounter = 0;
function nextPlayerId(): string {
  return `local_${++playerIdCounter}_${Date.now()}`;
}

const DEFAULT_SETTINGS: LobbySettings = {
  difficulty: 'easy',
  mode: 'classic',
  enablePowerups: true,
  enableChainReaction: true,
  enableSabotage: true,
  enableSound: true,
  activeSubs: {},
};

const BrainBombGame: React.FC = () => {
  const { updateGameState } = useGameState();

  // If ?room= param exists, skip menu and go straight to join
  const [initialRoomParam] = useState(() => getRoomParam());
  const [phase, setPhase] = useState<GamePhase>(initialRoomParam ? 'lobby' : 'menu');
  const [roomCode, setRoomCode] = useState(() => initialRoomParam || '');
  const [localPlayerId] = useState(() => nextPlayerId());
  const [isHost, setIsHost] = useState(() => !initialRoomParam);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [settings, setSettings] = useState<LobbySettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<Player[]>([]);
  const [finalPlayers, setFinalPlayers] = useState<Player[]>([]);

  const roomRef = useRef<GameRoom | null>(null);
  const startTimeRef = useRef<number>(0);

  // Init audio on first interaction
  useEffect(() => {
    const handler = () => { initAudioContext(); document.removeEventListener('click', handler); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Track game state for floating buttons
  useEffect(() => {
    updateGameState('brain-bomb', phase === 'playing');
  }, [phase, updateGameState]);

  // Analytics on phase change
  useEffect(() => {
    if (phase === 'playing') {
      trackGameEvent('brain-bomb', 'start', {
        players: players.length,
        difficulty: settings.difficulty,
        mode: settings.mode,
      });
      startTimeRef.current = Date.now();
    }
  }, [phase]);

  // Setup WebRTC room when we have a roomCode and are in lobby
  useEffect(() => {
    if (phase === 'menu' || !roomCode) return;

    roomRef.current = new GameRoom(
      roomCode,
      isHost,
      (msg) => {
        // Handle incoming messages from peers
        if (msg.type === 'player-join') {
          const payload = msg.payload as { name: string; avatar: string };
          setPlayers((prev) => {
            if (prev.length >= 8) return prev;
            return [
              ...prev,
              {
                id: msg.senderId,
                name: payload.name || `Player ${prev.length + 1}`,
                avatar: payload.avatar || AVATARS[prev.length % AVATARS.length],
                color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length],
                lives: DIFFICULTY_CONFIG[settings.difficulty].lives,
                score: 0,
                eliminated: false,
                sabotages: 0,
                powerups: { shield: 1, freeze: 1, clone: 1 },
                usedPowerupThisRound: false,
                isLocal: false,
                peerId: msg.senderId,
              },
            ];
          });
        } else if (msg.type === 'lobby-settings') {
          setSettings(msg.payload as LobbySettings);
        }
      },
      () => {
        // Peer connected
      },
      () => {
        // Peer disconnected
      },
    );

    return () => {
      roomRef.current?.destroy();
    };
  }, [roomCode, isHost, phase]);

  // Broadcast settings to peers when changed
  useEffect(() => {
    if (isHost && roomRef.current) {
      roomRef.current.broadcast('lobby-settings', settings);
    }
  }, [settings, isHost]);

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
      lives: DIFFICULTY_CONFIG.easy.lives,
      score: 0,
      eliminated: false,
      sabotages: 0,
      powerups: { shield: 1, freeze: 1, clone: 1 },
      usedPowerupThisRound: false,
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
    // Clear the ?room= param from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  }, [manualCode]);

  // --- Lobby actions ---

  const handleRemovePlayer = useCallback((id: string) => {
    setPlayers((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleUpdatePlayerName = useCallback((id: string, name: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name || `Player` } : p)),
    );
  }, []);

  const handleStartGame = useCallback(() => {
    const enabledSubs = Object.values(settings.activeSubs).filter(Boolean).length;
    if (players.length < 2 || enabledSubs === 0) return;

    playSound('uiClick', settings.enableSound);
    trackButtonClick('start-game', 'brain-bomb-lobby');

    // Broadcast game start
    if (roomRef.current) {
      roomRef.current.broadcast('game-start', { settings, players });
    }

    setPhase('playing');
  }, [settings, players]);

  const handleGameOver = useCallback((finalP: Player[]) => {
    setFinalPlayers(finalP);
    setPhase('gameover');

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const winner = [...finalP].sort((a, b) => {
      if (!a.eliminated && b.eliminated) return -1;
      if (a.eliminated && !b.eliminated) return 1;
      return b.score - a.score;
    })[0];

    trackGameCompletion('brain-bomb', winner?.score || 0, duration);
    trackGameEvent('brain-bomb', 'complete', {
      winner: winner?.name,
      players: finalP.length,
      difficulty: settings.difficulty,
      mode: settings.mode,
    });
  }, [settings]);

  const handlePlayAgain = useCallback(() => {
    trackButtonClick('play-again', 'brain-bomb-gameover');
    setPhase('lobby');
    setFinalPlayers([]);
  }, []);

  const handleJoinRoom = useCallback(() => {
    const name = joinName.trim() || 'Player';
    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    if (roomRef.current) {
      roomRef.current.broadcast('player-join', { name, avatar });
    }
    setHasJoined(true);
    // Auto-scroll to bottom to hide mobile browser address bar
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 150);
  }, [joinName]);

  return (
    <div style={screenBase}>
      {/* Noise texture overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, opacity: 0.4,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }} />

      {/* Menu screen — Create or Join */}
      {phase === 'menu' && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 40 }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 8, animation: 'bb-pulse-bomb 2s ease-in-out infinite' }}>
            {'\uD83D\uDCA3'}
          </span>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(3.5rem, 12vw, 6rem)',
            letterSpacing: 4,
            lineHeight: 0.9,
            background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accent2} 50%, ${C.yellow} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(255,61,61,0.4))',
            marginBottom: 4,
          }}>
            BRAIN BOMB
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: 4,
            color: C.muted,
            textTransform: 'uppercase',
            marginBottom: 40,
          }}>
            Pass &middot; Answer &middot; Survive
          </div>

          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Create Room */}
            <button
              onClick={handleCreateRoom}
              style={{
                ...startBtn,
                fontSize: '1.1rem',
                padding: '16px 24px',
                width: '100%',
              }}
            >
              {'\uD83D\uDCA3'} CREATE ROOM
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 700, letterSpacing: 2 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            {/* Join with code */}
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
                    letterSpacing: 6, textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoinWithCode(); }}
                />
                <button
                  onClick={handleJoinWithCode}
                  disabled={manualCode.trim().length < 4}
                  style={{
                    ...startBtn,
                    fontSize: '1rem',
                    padding: '14px 24px',
                    width: '100%',
                    opacity: manualCode.trim().length >= 4 ? 1 : 0.5,
                    cursor: manualCode.trim().length >= 4 ? 'pointer' : 'not-allowed',
                  }}
                >
                  {'\uD83D\uDD17'} JOIN ROOM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest join screen (from QR or manual code) */}
      {!isHost && !hasJoined && phase === 'lobby' && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 80 }}>
          <span style={{ fontSize: '4rem' }}>{'\uD83D\uDCA3'}</span>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.5rem, 10vw, 4rem)',
            letterSpacing: 4,
            background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accent2} 50%, ${C.yellow} 100%)`,
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
                  fontSize: '1rem', fontWeight: 700, outline: 'none',
                  boxSizing: 'border-box',
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoinRoom(); }}
                autoFocus
              />
              <button
                onClick={handleJoinRoom}
                style={{
                  ...startBtn,
                  fontSize: '1.1rem',
                  padding: '14px 24px',
                }}
              >
                {'\uD83D\uDE80'} JOIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting screen after guest joins */}
      {!isHost && hasJoined && phase === 'lobby' && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 80 }}>
          <span style={{ fontSize: '4rem', animation: 'bb-pulse-bomb 2s ease-in-out infinite' }}>{'\uD83D\uDCA3'}</span>
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
          isHost={isHost}
          localPlayerId={localPlayerId}
          onUpdateSettings={setSettings}
          onRemovePlayer={handleRemovePlayer}
          onUpdatePlayerName={handleUpdatePlayerName}
          onStartGame={handleStartGame}
        />
      )}

      {phase === 'playing' && (
        <GameScreen
          players={players}
          settings={settings}
          localPlayerId={localPlayerId}
          onGameOver={handleGameOver}
        />
      )}

      {phase === 'gameover' && (
        <GameOverScreen
          players={finalPlayers}
          soundEnabled={settings.enableSound}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
};

export default BrainBombGame;
