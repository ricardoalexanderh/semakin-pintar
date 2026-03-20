// ===== Pathfinder Duel — Lobby Screen =====
// Room setup, QR code, settings, player management.
// Layout follows Brain Bomb's card-based vertical structure.

import React, { useState, useEffect } from 'react';
import type { PDPlayer, PDSettings, Difficulty, RoundType } from './types';
import { DIFFICULTY_CONFIG } from './types';
import { generateQRCodeDataURL } from './webrtc';
import { playSound } from './audio';
import { C, lobbyCard, cardTitle, startBtn, toggleSwitch, toggleKnob, diffBadge } from './styles';

interface LobbyScreenProps {
  roomCode: string;
  players: PDPlayer[];
  settings: PDSettings;
  localPlayerId: string;
  onUpdateSettings: (settings: PDSettings) => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayerName: (id: string, name: string) => void;
  onStartGame: () => void;
}

const ROUND_TYPE_INFO: Record<RoundType, { label: string; icon: string; desc: string; color: string }> = {
  classic: { label: 'Classic', icon: '\u2B06', desc: 'Highest sum wins', color: C.accent },
  minimum: { label: 'Minimum', icon: '\u2B07', desc: 'Lowest sum wins', color: C.accent3 },
  multiplier: { label: 'Multiplier', icon: '\u2728', desc: 'x2/x3 bonus cells', color: C.accent4 },
};

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode, players, settings, localPlayerId,
  onUpdateSettings, onRemovePlayer, onUpdatePlayerName, onStartGame,
}) => {
  const [qrCode, setQrCode] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateQRCodeDataURL(roomCode).then(setQrCode);
  }, [roomCode]);

  const handleShare = async () => {
    const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pathfinder Duel',
          text: `Join my Pathfinder Duel game! Room: ${roomCode}`,
          url: joinUrl,
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDifficulty = (diff: Difficulty) => {
    playSound('uiClick', settings.enableSound);
    onUpdateSettings({ ...settings, difficulty: diff });
  };

  const toggleRoundType = (type: RoundType) => {
    playSound('uiClick', settings.enableSound);
    const current = settings.roundTypes;
    if (current.includes(type)) {
      if (current.length <= 1) return;
      onUpdateSettings({ ...settings, roundTypes: current.filter(t => t !== type) });
    } else {
      onUpdateSettings({ ...settings, roundTypes: [...current, type] });
    }
  };

  const canStart = players.length >= 2;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Logo section */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{
          fontSize: '4rem', display: 'block', marginBottom: 8,
          animation: 'pd-pulse-text 2s ease-in-out infinite alternate',
        }}>
          {'\uD83D\uDDFA\uFE0F'}
        </span>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(3rem, 10vw, 5rem)',
          letterSpacing: 4,
          lineHeight: 0.9,
          background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accent3} 50%, ${C.accent2} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 40px rgba(34,197,94,0.4))',
        }}>
          PATHFINDER DUEL
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.7rem',
          letterSpacing: 4,
          color: C.muted,
          textTransform: 'uppercase',
          marginTop: 6,
        }}>
          Trace &middot; Optimize &middot; Compete
        </div>
      </div>

      {/* Main content container */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>

        {/* Room Code + QR Card */}
        <div style={lobbyCard}>
          <h3 style={cardTitle}>{'\uD83D\uDD17'} Room Code</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {qrCode && (
              <img src={qrCode} alt="Room QR Code" style={{ width: 180, height: 180, borderRadius: 12 }} />
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '2.5rem',
                letterSpacing: 6,
                color: C.accent,
                lineHeight: 1,
              }}>
                {roomCode}
              </div>
              <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 4 }}>
                Scan QR or enter code to join
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, width: '100%' }}>
              <button
                onClick={handleShare}
                style={{
                  flex: 1, padding: '10px 16px',
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, color: C.white,
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {'\uD83D\uDCE4'} Share Link
              </button>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1, padding: '10px 16px',
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, color: C.white,
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {copied ? '\u2705 Copied!' : '\uD83D\uDCCB Copy Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Players Card */}
        <div style={lobbyCard}>
          <h3 style={cardTitle}>{'\uD83D\uDC65'} Players ({players.length}/6)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: C.surface, borderRadius: 12,
                padding: '10px 14px', border: `1px solid ${C.border}`,
                animation: 'pd-slide-up 0.3s ease',
              }}>
                {/* Avatar circle */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                  background: `${p.color}22`, border: `2px solid ${p.color}44`,
                }}>
                  {p.avatar}
                </div>

                {/* Name */}
                {editingName === p.id ? (
                  <input
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onBlur={() => {
                      if (editNameValue.trim()) onUpdatePlayerName(p.id, editNameValue.trim());
                      setEditingName(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editNameValue.trim()) onUpdatePlayerName(p.id, editNameValue.trim());
                        setEditingName(null);
                      }
                    }}
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      color: C.white, fontSize: '0.95rem', fontWeight: 700,
                      fontFamily: "'Nunito', sans-serif", padding: 0,
                      borderBottom: `1.5px solid ${C.accent}`,
                    }}
                    autoFocus
                    maxLength={20}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1, fontWeight: 700, fontSize: '0.95rem',
                      cursor: (p.id === localPlayerId || p.isLocal) ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (p.id === localPlayerId || p.isLocal) {
                        setEditingName(p.id);
                        setEditNameValue(p.name);
                      }
                    }}
                  >
                    {p.name}
                    {(p.id === localPlayerId || p.isLocal) && (
                      <span style={{ fontSize: '0.6rem', color: C.muted, marginLeft: 6 }}>(you)</span>
                    )}
                  </span>
                )}

                {/* Remove button */}
                {p.id !== localPlayerId && !p.isLocal && players.length > 1 && (
                  <button
                    onClick={() => onRemovePlayer(p.id)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(239,68,68,0.15)', border: `1px solid ${C.danger}44`,
                      color: C.danger, fontSize: '0.65rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, flexShrink: 0,
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    {'\u2715'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Round Types Card */}
        <div style={lobbyCard}>
          <h3 style={cardTitle}>{'\uD83C\uDFAF'} Round Types</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(Object.keys(ROUND_TYPE_INFO) as RoundType[]).map(type => {
              const info = ROUND_TYPE_INFO[type];
              const active = settings.roundTypes.includes(type);
              return (
                <div
                  key={type}
                  onClick={() => toggleRoundType(type)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: '14px 10px', borderRadius: 12,
                    border: `2px solid ${active ? info.color : C.border}`,
                    background: active ? `${info.color}12` : C.surface,
                    cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{info.icon}</span>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 800, letterSpacing: 0.5,
                    color: active ? info.color : C.muted,
                  }}>
                    {info.label.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 600, color: C.muted, textAlign: 'center',
                  }}>
                    {info.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings Card */}
        <div style={lobbyCard}>
          <h3 style={cardTitle}>{'\u2699\uFE0F'} Settings</h3>

          {/* Grid Size */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Grid Size</div>
              <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>
                Timer: {DIFFICULTY_CONFIG[settings.difficulty].timer}s
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
                <div
                  key={diff}
                  onClick={() => handleDifficulty(diff)}
                  style={diffBadge(settings.difficulty === diff, diff)}
                >
                  {diff === 'easy' ? '4×4' : diff === 'medium' ? '6×6' : '8×8'}
                </div>
              ))}
            </div>
          </div>

          {/* Rounds */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Rounds</div>
              <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>Number of rounds</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[5, 8, 10].map(n => (
                <div
                  key={n}
                  onClick={() => {
                    playSound('uiClick', settings.enableSound);
                    onUpdateSettings({ ...settings, totalRounds: n });
                  }}
                  style={{
                    padding: '6px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800,
                    cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                    background: settings.totalRounds === n ? `${C.accent}22` : C.surface,
                    color: settings.totalRounds === n ? C.accent : C.muted,
                    border: `1.5px solid ${settings.totalRounds === n ? C.accent : C.border}`,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Sound */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Sound Effects</div>
            </div>
            <div
              style={toggleSwitch(settings.enableSound)}
              onClick={() => {
                playSound(settings.enableSound ? 'uiOff' : 'uiOn', true);
                onUpdateSettings({ ...settings, enableSound: !settings.enableSound });
              }}
            >
              <div style={toggleKnob(settings.enableSound)} />
            </div>
          </div>

          {/* Blockers */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0',
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{'\uD83E\uDDF1'} Blockers</div>
              <div style={{ fontSize: '0.65rem', color: C.muted }}>Last place blocks 2 cells</div>
            </div>
            <div
              style={toggleSwitch(settings.enableBlockers)}
              onClick={() => {
                playSound('uiClick', settings.enableSound);
                onUpdateSettings({ ...settings, enableBlockers: !settings.enableBlockers });
              }}
            >
              <div style={toggleKnob(settings.enableBlockers)} />
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStartGame}
        disabled={!canStart}
        style={{
          ...startBtn,
          opacity: canStart ? 1 : 0.5,
          cursor: canStart ? 'pointer' : 'not-allowed',
        }}
      >
        {canStart ? '\uD83D\uDE80 START GAME' : `\u23F3 Waiting for players (${players.length}/2)`}
      </button>
      {!canStart && (
        <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 8, textAlign: 'center' }}>
          Need at least 2 players to start
        </div>
      )}
    </div>
  );
};

export default LobbyScreen;
