// ===== Code Racers — Game Over Screen =====

import type { CRPlayer } from './types';
import { ROBOT_AVATARS, PLAYER_COLORS } from './types';
import { playSound } from './audio';
import { C, screenBase, lobbyCard, cardTitle, startBtn, NOISE_BG } from './styles';

interface GameOverScreenProps {
  players: CRPlayer[];
  soundEnabled: boolean;
  onPlayAgain: () => void;
}

export default function GameOverScreen({ players, soundEnabled, onPlayAgain }: GameOverScreenProps) {
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];
  const winnerIdx = players.findIndex(p => p.id === winner.id);

  return (
    <div style={screenBase}>
      <div style={NOISE_BG} />
      <div style={{ padding: '40px 16px', width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 1 }}>

        {/* Winner display */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '4rem',
            animation: 'cr-trophy-bounce 1.5s ease-in-out infinite',
          }}>
            🏆
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2rem',
            letterSpacing: 6,
            color: C.yellow,
            margin: '8px 0 4px',
          }}>
            WINNER
          </h1>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {ROBOT_AVATARS[winnerIdx % ROBOT_AVATARS.length]} {winner.name}
          </div>
          <div style={{ fontSize: '1.2rem', color: C.accent, fontWeight: 800, marginTop: 4 }}>
            {winner.totalScore} points
          </div>
        </div>

        {/* Standings */}
        <div style={lobbyCard}>
          <div style={cardTitle}>FINAL STANDINGS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map((p, rank) => {
              const origIdx = players.findIndex(pl => pl.id === p.id);
              const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
              return (
                <div key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: rank === 0 ? `${C.yellow}15` : C.surface,
                  borderRadius: 12,
                  border: `1.5px solid ${rank === 0 ? C.yellow + '44' : C.border}`,
                }}>
                  <span style={{ fontSize: rank < 3 ? '1.3rem' : '0.85rem', width: 30, textAlign: 'center' }}>
                    {medal}
                  </span>
                  <span style={{ fontSize: '1.3rem' }}>
                    {ROBOT_AVATARS[origIdx % ROBOT_AVATARS.length]}
                  </span>
                  <span style={{
                    flex: 1,
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: PLAYER_COLORS[origIdx % PLAYER_COLORS.length],
                  }}>
                    {p.name}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: C.accent }}>
                      {p.totalScore}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: C.muted }}>
                      {p.gemsCollected} gems
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Again */}
        <button
          onClick={() => {
            playSound('uiClick', soundEnabled);
            onPlayAgain();
          }}
          style={startBtn}
        >
          🔄 PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
