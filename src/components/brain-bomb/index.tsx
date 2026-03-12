// ===== Brain Bomb — Main Game Component =====
// Multiplayer party game: pass the bomb, answer questions, survive!

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { trackGameEvent, trackButtonClick, trackGameCompletion } from '../../utils/analytics';
import { useGameState } from '../../hooks/useGameState';
import type { Player, LobbySettings, GamePhase } from './types';
import { AVATARS, PLAYER_COLORS, DIFFICULTY_CONFIG } from './types';
import { initAudioContext, playSound } from './audio';
import { generateRoomCode, GameRoom } from './webrtc';
import { screenBase, KEYFRAMES } from './styles';
import LobbyScreen from './LobbyScreen';
import GameScreen from './GameScreen';
import GameOverScreen from './GameOverScreen';

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

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [roomCode] = useState(() => generateRoomCode());
  const [localPlayerId] = useState(() => nextPlayerId());
  const [isHost] = useState(true); // For now, single-device is always host
  const [settings, setSettings] = useState<LobbySettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<Player[]>(() => {
    // Start with 3 default players
    const initial: Player[] = [];
    for (let i = 0; i < 3; i++) {
      initial.push({
        id: nextPlayerId(),
        name: `Player ${i + 1}`,
        avatar: AVATARS[i % AVATARS.length],
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        lives: DIFFICULTY_CONFIG.easy.lives,
        score: 0,
        eliminated: false,
        sabotages: 0,
        powerups: { shield: 1, freeze: 1, clone: 1 },
        usedPowerupThisRound: false,
        isLocal: true,
      });
    }
    return initial;
  });
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

  // Setup WebRTC room
  useEffect(() => {
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
  }, [roomCode, isHost]);

  // Broadcast settings to peers when changed
  useEffect(() => {
    if (isHost && roomRef.current) {
      roomRef.current.broadcast('lobby-settings', settings);
    }
  }, [settings, isHost]);

  const handleAddPlayer = useCallback(() => {
    setPlayers((prev) => {
      if (prev.length >= 8) return prev;
      const idx = prev.length;
      return [
        ...prev,
        {
          id: nextPlayerId(),
          name: `Player ${idx + 1}`,
          avatar: AVATARS[idx % AVATARS.length],
          color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
          lives: DIFFICULTY_CONFIG[settings.difficulty].lives,
          score: 0,
          eliminated: false,
          sabotages: 0,
          powerups: { shield: 1, freeze: 1, clone: 1 },
          usedPowerupThisRound: false,
          isLocal: true,
        },
      ];
    });
  }, [settings.difficulty]);

  const handleRemovePlayer = useCallback((id: string) => {
    setPlayers((prev) => {
      if (prev.length <= 2) return prev;
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

  return (
    <div style={screenBase}>
      {/* Noise texture overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, opacity: 0.4,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }} />

      {phase === 'lobby' && (
        <LobbyScreen
          roomCode={roomCode}
          players={players}
          settings={settings}
          isHost={isHost}
          localPlayerId={localPlayerId}
          onUpdateSettings={setSettings}
          onAddPlayer={handleAddPlayer}
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
