// ===== Brain Bomb — Game Over Screen =====
import React from 'react';
import type { Player } from './types';
import { playSound } from './audio';
import { C, lobbyCard, cardTitle, startBtn } from './styles';

interface GameOverScreenProps {
  players: Player[];
  soundEnabled: boolean;
  onPlayAgain: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  players,
  soundEnabled,
  onPlayAgain,
}) => {
  // Play win sound on mount
  React.useEffect(() => {
    playSound('win', soundEnabled);
  }, [soundEnabled]);

  const sorted = [...players].sort((a, b) => {
    if (!a.eliminated && b.eliminated) return -1;
    if (a.eliminated && !b.eliminated) return 1;
    return b.score - a.score;
  });

  const winner = sorted[0];

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 2vh, 16px)', justifyContent: 'center', height: 'calc(100dvh - 4rem)', boxSizing: 'border-box', overflow: 'auto' }}>
      {/* Winner display */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', display: 'block', marginBottom: 4, animation: 'bb-trophy-bounce 1s ease-in-out infinite' }}>
          {'\uD83C\uDFC6'}
        </span>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.6rem', letterSpacing: 4, color: C.muted,
          textTransform: 'uppercase', marginBottom: 2,
        }}>
          Winner
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(2rem, 8vw, 3.5rem)', letterSpacing: 4,
          background: `linear-gradient(135deg, ${C.yellow}, ${C.accent2})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {winner?.name.toUpperCase()}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ ...lobbyCard, flex: '1 1 auto', minHeight: 0, overflow: 'auto', width: '100%', maxWidth: 500 }}>
        <h3 style={cardTitle}>{'\uD83D\uDCCA'} Final Standings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 12px)',
              padding: 'clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 14px)', background: C.surface,
              borderRadius: 10, border: `1px solid ${C.border}`,
            }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.1rem', color: i === 0 ? C.yellow : C.muted,
                width: 20, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{p.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: p.color, fontSize: 'clamp(0.8rem, 3vw, 1rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: C.muted }}>
                  Score: {p.score}
                </div>
              </div>
              {p.eliminated ? (
                <span style={{ fontSize: '0.65rem', color: C.danger, flexShrink: 0, textAlign: 'right' }}>{'\uD83D\uDC80'} Out</span>
              ) : (
                <span style={{ fontSize: '0.65rem', color: C.green, flexShrink: 0, textAlign: 'right' }}>{'\uD83C\uDFC6'} Won</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Play Again */}
      <button
        onClick={onPlayAgain}
        style={{ ...startBtn, flexShrink: 0, width: '100%', maxWidth: 500 }}
      >
        {'\uD83D\uDD04'} PLAY AGAIN
      </button>
    </div>
  );
};

export default GameOverScreen;
