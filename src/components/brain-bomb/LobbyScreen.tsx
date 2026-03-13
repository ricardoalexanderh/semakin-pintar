// ===== Brain Bomb — Lobby Screen =====
import React, { useState, useEffect } from 'react';
import type { Player, Difficulty, GameMode, LobbySettings } from './types';
import { DIFFICULTY_CONFIG } from './types';
import { SUB_DEFS } from './questions';
import { playSound } from './audio';
import { C, lobbyCard, cardTitle, startBtn, toggleSwitch, toggleKnob, diffBadge, modeBtn } from './styles';
import { generateQRCodeDataURL } from './webrtc';

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  settings: LobbySettings;
  isHost: boolean;
  localPlayerId: string;
  onUpdateSettings: (settings: LobbySettings) => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayerName: (id: string, name: string) => void;
  onStartGame: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode,
  players,
  settings,
  isHost,
  onUpdateSettings,
  onRemovePlayer,
  onUpdatePlayerName,
  onStartGame,
}) => {
  const [subPopup, setSubPopup] = useState<string | null>(null);

  const sound = settings.enableSound;

  const toggleSub = (subKey: string) => {
    const next = { ...settings.activeSubs, [subKey]: !settings.activeSubs[subKey] };
    onUpdateSettings({ ...settings, activeSubs: next });
    playSound('uiClick', sound);
  };

  const getActiveCount = (catKey: string) => {
    const def = SUB_DEFS[catKey];
    return def.subs.filter(([k]) => settings.activeSubs[k]).length;
  };

  const hasAnySub = (catKey: string) => getActiveCount(catKey) > 0;

  const catBorderColor = (catKey: string) => {
    const colors: Record<string, string> = { math: C.accent2, logic: C.accent4, ct: C.accent3, word: C.green, memory: C.yellow };
    return hasAnySub(catKey) ? colors[catKey] : 'rgba(255,255,255,0.1)';
  };

  const catLabelColor = (catKey: string) => {
    const colors: Record<string, string> = { math: C.accent2, logic: C.accent4, ct: C.accent3, word: C.green, memory: C.yellow };
    return hasAnySub(catKey) ? colors[catKey] : 'rgba(255,255,255,0.4)';
  };

  const subColor = (catKey: string) => {
    const colors: Record<string, string> = { math: C.accent2, logic: C.accent4, ct: C.accent3, word: C.green, memory: C.yellow };
    return colors[catKey] || C.white;
  };

  const enabledSubCount = Object.values(settings.activeSubs).filter(Boolean).length;
  const canStart = players.length >= 2 && enabledSubCount > 0;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    generateQRCodeDataURL(roomCode).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => { cancelled = true; };
  }, [roomCode]);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
        }}>
          BRAIN BOMB
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.7rem',
          letterSpacing: 4,
          color: C.muted,
          textTransform: 'uppercase',
          marginTop: 6,
        }}>
          Pass &middot; Answer &middot; Survive
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
        {/* Room Code + QR */}
        <div style={lobbyCard}>
          <h3 style={cardTitle}>{'\uD83D\uDD17'} Room Code</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Room QR Code" style={{ width: 180, height: 180, borderRadius: 12 }} />
            ) : (
              <div style={{ width: 180, height: 180, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: C.muted }}>Loading...</div>
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
          </div>
        </div>

        {/* Players */}
        <div style={lobbyCard}>
          <h3 style={cardTitle}>{'\uD83D\uDC65'} Players ({players.length}/8)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {players.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: C.surface, borderRadius: 12,
                padding: '10px 14px', border: `1px solid ${C.border}`,
                animation: 'bb-slide-in 0.3s ease',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                  background: `${p.color}22`, border: `2px solid ${p.color}44`,
                }}>
                  {p.avatar}
                </div>
                {p.isLocal ? (
                  <input
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      color: C.white, fontFamily: "'Nunito', sans-serif",
                      fontSize: '0.95rem', fontWeight: 700,
                    }}
                    value={p.name}
                    placeholder="Enter name..."
                    onChange={(e) => onUpdatePlayerName(p.id, e.target.value)}
                    onBlur={() => { if (!p.name.trim()) onUpdatePlayerName(p.id, 'Player'); }}
                  />
                ) : (
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</span>
                )}
                {isHost && players.length > 2 && (
                  <button
                    onClick={() => { onRemovePlayer(p.id); playSound('uiClick', sound); }}
                    style={{
                      background: 'none', border: 'none', color: C.muted,
                      cursor: 'pointer', fontSize: '1.1rem', padding: '2px 6px', borderRadius: 6,
                    }}
                  >
                    {'\u2715'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question Types */}
        {isHost && (
          <div style={lobbyCard}>
            <h3 style={cardTitle}>{'\uD83D\uDCDA'} Question Types</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(SUB_DEFS).map(([catKey, def]) => (
                <div
                  key={catKey}
                  onClick={() => { setSubPopup(catKey); playSound('uiClick', sound); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: '14px 10px', borderRadius: 12,
                    border: `2px solid ${catBorderColor(catKey)}`,
                    background: hasAnySub(catKey) ? `${catBorderColor(catKey)}12` : C.surface,
                    cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{def.icon}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: 0.5, color: catLabelColor(catKey) }}>
                    {def.label.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    color: hasAnySub(catKey) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                    background: hasAnySub(catKey) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                    padding: '2px 8px', borderRadius: 20,
                  }}>
                    {getActiveCount(catKey)} / {def.subs.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-category popup */}
        {subPopup && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setSubPopup(null); }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{
              background: '#1a1a22', borderRadius: 20, padding: 24,
              width: '90%', maxWidth: 360, border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)', animation: 'bb-pop-in 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>
                <span>{SUB_DEFS[subPopup].icon}</span> {SUB_DEFS[subPopup].label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {SUB_DEFS[subPopup].subs.map(([subKey, label]) => {
                  const active = !!settings.activeSubs[subKey];
                  const col = subColor(subPopup);
                  return (
                    <div
                      key={subKey}
                      onClick={() => toggleSub(subKey)}
                      style={{
                        padding: '7px 14px', borderRadius: 20,
                        border: `1.5px solid ${active ? col : 'rgba(255,255,255,0.12)'}`,
                        color: active ? col : 'rgba(255,255,255,0.4)',
                        background: active ? `${col}1f` : 'transparent',
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: '0.78rem', fontWeight: 700,
                        cursor: 'pointer', userSelect: 'none', transition: 'all 0.18s',
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setSubPopup(null)}
                style={{
                  width: '100%', padding: 12, border: 'none', borderRadius: 12,
                  background: 'rgba(255,255,255,0.1)', color: C.white,
                  fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', fontWeight: 800,
                  cursor: 'pointer', letterSpacing: 0.5,
                }}
              >
                Done {'\u2713'}
              </button>
            </div>
          </div>
        )}

        {/* Game Mode */}
        {isHost && (
          <div style={lobbyCard}>
            <h3 style={cardTitle}>{'\uD83C\uDFAE'} Game Mode</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([
                { key: 'classic' as GameMode, icon: '\uD83D\uDCA3', name: 'Classic' },
                { key: 'team' as GameMode, icon: '\uD83E\uDD1D', name: 'Team' },
                { key: 'speed' as GameMode, icon: '\u26A1', name: 'Speed Round' },
                { key: 'sudden' as GameMode, icon: '\u2620\uFE0F', name: 'Sudden Death' },
              ]).map(({ key, icon, name }) => (
                <div
                  key={key}
                  onClick={() => { onUpdateSettings({ ...settings, mode: key }); playSound('uiClick', sound); }}
                  style={modeBtn(settings.mode === key)}
                >
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 4 }}>{icon}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: 0.5 }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {isHost && (
          <div style={lobbyCard}>
            <h3 style={cardTitle}>{'\u2699\uFE0F'} Settings</h3>

            {/* Difficulty */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Difficulty</div>
                <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>
                  Lives: {DIFFICULTY_CONFIG[settings.difficulty].lives}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <div
                    key={d}
                    onClick={() => { onUpdateSettings({ ...settings, difficulty: d, timer: DIFFICULTY_CONFIG[d].timer }); playSound('uiClick', sound); }}
                    style={diffBadge(settings.difficulty === d, d)}
                  >
                    {d === 'easy' ? 'Easy' : d === 'medium' ? 'Med' : 'Hard'}
                  </div>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Timer</div>
                <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>Seconds per turn</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[10, 15, 20, 25, 30].map((t) => (
                  <div
                    key={t}
                    onClick={() => { onUpdateSettings({ ...settings, timer: t }); playSound('uiClick', sound); }}
                    style={{
                      padding: '6px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800,
                      cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                      background: settings.timer === t ? `${C.accent}22` : C.surface,
                      color: settings.timer === t ? C.accent : C.muted,
                      border: `1.5px solid ${settings.timer === t ? C.accent : C.border}`,
                    }}
                  >
                    {t}s
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            {([
              { key: 'enablePowerups' as const, label: 'Power-ups', sub: 'Shield, Freeze, Throw' },
              { key: 'enableChainReaction' as const, label: 'Chain Reaction', sub: 'All players answer on explosion' },
              { key: 'enableSabotage' as const, label: 'Sabotage Cards', sub: 'Earned for fast correct answers' },
              { key: 'enableProgressiveDifficulty' as const, label: 'Progressive Difficulty', sub: 'Questions get harder each round' },
              { key: 'enableSound' as const, label: 'Sound Effects', sub: '' },
            ]).map(({ key, label, sub }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{label}</div>
                  {sub && <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>{sub}</div>}
                </div>
                <div
                  onClick={() => {
                    const next = { ...settings, [key]: !settings[key] };
                    onUpdateSettings(next);
                    playSound(next[key] ? 'uiOn' : 'uiOff', true);
                  }}
                  style={toggleSwitch(settings[key])}
                >
                  <div style={toggleKnob(settings[key])} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Waiting message for guests */}
        {!isHost && (
          <div style={{ ...lobbyCard, textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Waiting for host to start...</div>
            <div style={{ fontSize: '0.85rem', color: C.muted }}>
              {players.length} player{players.length !== 1 ? 's' : ''} in lobby
            </div>
          </div>
        )}
      </div>

      {/* Start Button (host only) */}
      {isHost && (
        <button
          onClick={onStartGame}
          disabled={!canStart}
          style={{
            ...startBtn,
            opacity: canStart ? 1 : 0.5,
            cursor: canStart ? 'pointer' : 'not-allowed',
          }}
        >
          {'\uD83D\uDCA3'} IGNITE THE BOMB!
        </button>
      )}
      {isHost && !canStart && (
        <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 8, textAlign: 'center' }}>
          {players.length < 2 ? 'Need at least 2 players' : 'Select at least one question type'}
        </div>
      )}
    </div>
  );
};

export default LobbyScreen;
