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
  const allEliminated = sorted.every((p) => p.eliminated);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, justifyContent: 'center', minHeight: '80vh' }}>
      {/* Winner display */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '4rem', display: 'block', marginBottom: 8, animation: 'bb-trophy-bounce 1s ease-in-out infinite' }}>
          {allEliminated ? '\uD83D\uDCA5' : '\uD83C\uDFC6'}
        </span>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem', letterSpacing: 4, color: C.muted,
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          {allEliminated ? 'No Winner' : 'Winner'}
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '3.5rem', letterSpacing: 4,
          background: `linear-gradient(135deg, ${C.yellow}, ${C.accent2})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {allEliminated ? 'DRAW' : winner?.name.toUpperCase()}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={lobbyCard}>
        <h3 style={cardTitle}>{'\uD83D\uDCCA'} Final Standings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 14px', background: C.surface,
              borderRadius: 12, border: `1px solid ${C.border}`,
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.2rem', color: i === 0 ? C.yellow : C.muted,
                width: 24,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '1.3rem' }}>{p.avatar}</span>
              <span style={{ flex: 1, fontWeight: 800, color: p.color }}>{p.name}</span>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', paddingLeft: 36 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: C.muted }}>
                  {'\u2B50'} Score: {p.score}
                </span>
                {p.eliminated ? (
                  <span style={{ fontSize: '0.7rem', color: C.danger }}>{'\uD83D\uDC80'} Eliminated</span>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: C.green }}>{'\uD83C\uDFC6'} Survived</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Play Again */}
      <button
        onClick={onPlayAgain}
        style={startBtn}
      >
        {'\uD83D\uDD04'} PLAY AGAIN
      </button>
    </div>
  );
};

export default GameOverScreen;
