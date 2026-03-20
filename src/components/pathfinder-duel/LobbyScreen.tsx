// ===== Pathfinder Duel — Lobby Screen =====

import React, { useState, useEffect } from 'react';
import type { PDPlayer, PDSettings, Difficulty, RoundType } from './types';
import { DIFFICULTY_CONFIG } from './types';
import { generateQRCodeDataURL } from './webrtc';
import { playSound } from './audio';
import { C, lobbyCard, cardTitle, startBtn, playerChip, toggleSwitch, toggleKnob, diffBadge } from './styles';

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

const ROUND_TYPE_INFO: Record<RoundType, { label: string; icon: string; desc: string }> = {
  classic: { label: 'Classic', icon: '\u2B06', desc: 'Highest sum wins' },
  minimum: { label: 'Minimum', icon: '\u2B07', desc: 'Lowest sum wins' },
  blocker: { label: 'Blocker', icon: '\uD83E\uDDF1', desc: 'Winner places walls' },
  multiplier: { label: 'Multiplier', icon: '\u2728', desc: 'x2/x3 bonus cells' },
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

  const handleDifficulty = (diff: Difficulty) => {
    playSound('uiClick', settings.enableSound);
    onUpdateSettings({ ...settings, difficulty: diff });
  };

  const toggleRoundType = (type: RoundType) => {
    playSound('uiClick', settings.enableSound);
    const current = settings.roundTypes;
    if (current.includes(type)) {
      if (current.length <= 1) return; // Must have at least one
      onUpdateSettings({ ...settings, roundTypes: current.filter(t => t !== type) });
    } else {
      onUpdateSettings({ ...settings, roundTypes: [...current, type] });
    }
  };

  const canStart = players.length >= 2;

  return (
    <div style={{ padding: 'clamp(12px, 4vw, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 24, width: '100%', boxSizing: 'border-box' }}>
      {/* Title */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(2rem, 8vw, 3rem)',
        letterSpacing: 3,
        background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accent3} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: 16,
      }}>
        PATHFINDER DUEL
      </div>

      {/* Room Code + QR */}
      <div style={lobbyCard}>
        <h3 style={cardTitle}>{'\uD83D\uDD17'} Room Code</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2.5rem',
            letterSpacing: 8,
            color: C.accent,
            flex: 1,
          }}>
            {roomCode}
          </div>
          <button
            onClick={handleShare}
            style={{
              padding: '8px 16px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.white,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {copied ? '\u2705 Copied!' : '\uD83D\uDCE4 Share'}
          </button>
        </div>
        {qrCode && (
          <div style={{ textAlign: 'center' }}>
            <img src={qrCode} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 12 }} />
            <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 4 }}>Scan to join</div>
          </div>
        )}
      </div>

      {/* Players */}
      <div style={lobbyCard}>
        <h3 style={cardTitle}>{'\uD83D\uDC65'} Players ({players.length}/6)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {players.map((p) => (
            <div key={p.id} style={{ position: 'relative' }}>
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
                    background: C.surface, border: `1.5px solid ${C.accent}`,
                    borderRadius: 10, padding: '6px 10px', color: C.white,
                    fontSize: '0.8rem', fontWeight: 700, width: 100, outline: 'none',
                  }}
                  autoFocus
                />
              ) : (
                <div
                  style={playerChip(false, p.color)}
                  onClick={() => {
                    if (p.id === localPlayerId || p.isLocal) {
                      setEditingName(p.id);
                      setEditNameValue(p.name);
                    }
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{p.avatar}</span>
                  <span style={{ color: p.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  {p.id !== localPlayerId && !p.isLocal && players.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemovePlayer(p.id); }}
                      style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 18, height: 18, borderRadius: '50%',
                        background: C.danger, border: 'none', color: 'white',
                        fontSize: '0.6rem', cursor: 'pointer', lineHeight: '18px',
                        padding: 0,
                      }}
                    >
                      {'\u2715'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={lobbyCard}>
        <h3 style={cardTitle}>{'\u2699\uFE0F'} Settings</h3>

        {/* Difficulty */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, marginBottom: 8 }}>
            Grid Size
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
              <button
                key={diff}
                onClick={() => handleDifficulty(diff)}
                style={diffBadge(settings.difficulty === diff, diff)}
              >
                {diff === 'easy' ? '4\u00D74' : diff === 'medium' ? '6\u00D76' : '8\u00D78'}
                <span style={{ opacity: 0.6, marginLeft: 4 }}>
                  ({DIFFICULTY_CONFIG[diff].timer}s)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Rounds */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, marginBottom: 8 }}>
            Rounds
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[5, 8, 10].map(n => (
              <button
                key={n}
                onClick={() => {
                  playSound('uiClick', settings.enableSound);
                  onUpdateSettings({ ...settings, totalRounds: n });
                }}
                style={{
                  padding: '5px 16px', borderRadius: 99, fontSize: '0.75rem',
                  fontWeight: 800, cursor: 'pointer',
                  border: `1.5px solid ${settings.totalRounds === n ? C.accent : C.border}`,
                  color: settings.totalRounds === n ? C.accent : C.muted,
                  background: settings.totalRounds === n ? `${C.accent}1a` : C.surface,
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Round Types */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted, marginBottom: 8 }}>
            Round Types
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(ROUND_TYPE_INFO) as RoundType[]).map(type => {
              const info = ROUND_TYPE_INFO[type];
              const active = settings.roundTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleRoundType(type)}
                  style={{
                    padding: '6px 12px', borderRadius: 10, fontSize: '0.72rem',
                    fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${active ? C.accent3 : C.border}`,
                    color: active ? C.white : C.muted,
                    background: active ? `${C.accent3}1a` : C.surface,
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                  title={info.desc}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.muted }}>
            {'\uD83D\uDD0A'} Sound
          </span>
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
    </div>
  );
};

export default LobbyScreen;
