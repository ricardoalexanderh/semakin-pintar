// ===== Code Racers — Lobby Screen =====

import { useState, useEffect, useRef } from 'react';
import type { CRPlayer, CRSettings, Difficulty } from './types';
import { DIFFICULTY_CONFIG, ROBOT_AVATARS, PLAYER_COLORS, MIN_PLAYERS } from './types';
import { generateQRCodeDataURL } from './webrtc';
import { playSound } from './audio';
import { C, screenBase, lobbyCard, cardTitle, startBtn, toggleSwitch, toggleKnob, diffBadge, NOISE_BG, KEYFRAMES } from './styles';

interface LobbyScreenProps {
  roomCode: string;
  players: CRPlayer[];
  settings: CRSettings;
  isHost: boolean;
  localPlayerId: string;
  onUpdateSettings: (settings: CRSettings) => void;
  onUpdatePlayerName: (id: string, name: string) => void;
  onStartGame: () => void;
}

export default function LobbyScreen({
  roomCode,
  players,
  settings,
  isHost,
  localPlayerId,
  onUpdateSettings,
  onUpdatePlayerName,
  onStartGame,
}: LobbyScreenProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const stylesRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!stylesRef.current) {
      const el = document.createElement('style');
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
      stylesRef.current = el;
    }
    return () => {
      if (stylesRef.current) {
        stylesRef.current.remove();
        stylesRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    generateQRCodeDataURL(roomCode).then(url => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => { cancelled = true; };
  }, [roomCode]);

  const canStart = players.length >= MIN_PLAYERS;

  const handleShare = async () => {
    const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    const text = `Join my Code Racers game!\nRoom: ${roomCode}\n${joinUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Code Racers', text, url: joinUrl });
        setShareMsg('Shared!');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(joinUrl);
          setShareMsg('Link copied!');
        }
      }
    } else {
      await navigator.clipboard.writeText(joinUrl);
      setShareMsg('Link copied!');
    }
    setTimeout(() => setShareMsg(''), 2000);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode);
    setShareMsg('Code copied!');
    setTimeout(() => setShareMsg(''), 2000);
  };

  const updateDifficulty = (d: Difficulty) => {
    const config = DIFFICULTY_CONFIG[d];
    playSound('uiClick', settings.enableSound);
    onUpdateSettings({
      ...settings,
      difficulty: d,
      gridSize: config.gridSize,
      instructionSlots: config.instructionSlots,
      planningTime: config.planningTime,
      totalRounds: config.rounds,
    });
  };

  return (
    <div style={screenBase}>
      <div style={NOISE_BG} />
      <div style={{ padding: '20px 16px', width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>🤖</div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(1.8rem, 6vw, 2.4rem)',
            letterSpacing: 6,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}>
            CODE RACERS
          </h1>
          <p style={{ fontSize: '0.7rem', color: C.muted, fontFamily: "'Space Mono', monospace", letterSpacing: 2 }}>
            PROGRAM YOUR ROBOT
          </p>
        </div>

        {/* Room Code + QR */}
        <div style={lobbyCard}>
          <div style={cardTitle}>ROOM CODE</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" style={{ width: 120, height: 120, borderRadius: 12 }} />
            ) : (
              <div style={{ width: 120, height: 120, background: C.surface, borderRadius: 12 }} />
            )}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '1.8rem',
                letterSpacing: 8,
                color: C.accent,
                fontWeight: 700,
              }}>
                {roomCode}
              </div>
              {isHost && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={handleShare}
                    style={{ flex: 1, padding: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.white, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📤 Share
                  </button>
                  <button
                    onClick={handleCopy}
                    style={{ flex: 1, padding: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.white, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📋 Copy
                  </button>
                </div>
              )}
              {shareMsg && (
                <div style={{ fontSize: '0.7rem', color: C.green, marginTop: 6 }}>{shareMsg}</div>
              )}
            </div>
          </div>
        </div>

        {/* Players */}
        <div style={lobbyCard}>
          <div style={cardTitle}>PLAYERS ({players.length}/5)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: C.surface,
                borderRadius: 12,
                border: `1.5px solid ${PLAYER_COLORS[i % PLAYER_COLORS.length]}33`,
              }}>
                <span style={{ fontSize: '1.5rem' }}>{ROBOT_AVATARS[i % ROBOT_AVATARS.length]}</span>
                {p.id === localPlayerId ? (
                  <input
                    value={p.name}
                    onChange={e => onUpdatePlayerName(p.id, e.target.value)}
                    maxLength={12}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '4px 8px',
                      color: C.white,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontFamily: "'Nunito', sans-serif",
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700 }}>{p.name}</span>
                )}
                <span style={{
                  fontSize: '0.6rem',
                  color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                  fontWeight: 800,
                  fontFamily: "'Space Mono', monospace",
                }}>
                  {i === 0 ? 'HOST' : `P${i + 1}`}
                </span>
              </div>
            ))}
            {players.length < 5 && (
              <div style={{
                padding: '10px',
                textAlign: 'center',
                color: C.muted,
                fontSize: '0.75rem',
                border: `1.5px dashed ${C.border}`,
                borderRadius: 12,
              }}>
                Waiting for players...
              </div>
            )}
          </div>
        </div>

        {/* Settings (host only) */}
        {isHost && (
          <div style={lobbyCard}>
            <div style={cardTitle}>SETTINGS</div>

            {/* Difficulty */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', color: C.muted, marginBottom: 8, fontWeight: 700 }}>Difficulty</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => updateDifficulty(d)}
                    style={diffBadge(settings.difficulty === d, d)}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Size & Rounds display */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', color: C.muted, marginBottom: 4 }}>Grid Size</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.accent }}>
                  {settings.gridSize}×{settings.gridSize}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', color: C.muted, marginBottom: 4 }}>Rounds</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.accent }}>
                  {settings.totalRounds}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', color: C.muted, marginBottom: 4 }}>Slots</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.accent }}>
                  {settings.instructionSlots}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', color: C.muted, marginBottom: 4 }}>Timer</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.accent }}>
                  {settings.planningTime}s
                </div>
              </div>
            </div>

            {/* Sound toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>🔊 Sound</span>
              <div
                onClick={() => {
                  playSound('uiClick', settings.enableSound);
                  onUpdateSettings({ ...settings, enableSound: !settings.enableSound });
                }}
                style={toggleSwitch(settings.enableSound)}
              >
                <div style={toggleKnob(settings.enableSound)} />
              </div>
            </div>
          </div>
        )}

        {/* Waiting message (guest) */}
        {!isHost && (
          <div style={{ textAlign: 'center', color: C.muted, fontSize: '0.85rem', padding: 16, fontStyle: 'italic' }}>
            Waiting for host to start the game...
          </div>
        )}

        {/* Start / Status */}
        {isHost && (
          <>
            <button
              onClick={() => { if (canStart) { playSound('roundStart', settings.enableSound); onStartGame(); } }}
              disabled={!canStart}
              style={{
                ...startBtn,
                opacity: canStart ? 1 : 0.5,
                cursor: canStart ? 'pointer' : 'not-allowed',
              }}
            >
              🚀 LAUNCH RACE
            </button>
            {!canStart && (
              <div style={{ fontSize: '0.7rem', color: C.danger, textAlign: 'center' }}>
                Need at least {MIN_PLAYERS} players to start
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
