// ===== Pathfinder Duel — Game Over Screen =====

import React, { useEffect } from 'react';
import type { PDPlayer } from './types';
import { playSound } from './audio';
import { C } from './styles';

interface GameOverScreenProps {
  players: PDPlayer[];
  soundEnabled: boolean;
  isHost: boolean;
  onPlayAgain: () => void;
}

const PODIUM_ICONS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  players, soundEnabled, isHost, onPlayAgain,
}) => {
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  useEffect(() => {
    playSound('gameOver', soundEnabled);
  }, []);

  return (
    <div style={{
      padding: 'clamp(16px, 4vw, 32px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      paddingTop: 40,
      width: '100%',
      boxSizing: 'border-box',
      animation: 'pd-pop-in 0.5s ease',
    }}>
      {/* Trophy */}
      <span style={{
        fontSize: '4rem',
        animation: 'pd-trophy-bounce 1.5s ease-in-out infinite',
      }}>
        {'\uD83C\uDFC6'}
      </span>

      {/* Title */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(2.5rem, 10vw, 4rem)',
        letterSpacing: 4,
        lineHeight: 0.9,
        background: `linear-gradient(135deg, ${C.accent2} 0%, ${C.accent} 50%, ${C.accent3} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: `drop-shadow(0 0 30px ${C.accent2}66)`,
        textAlign: 'center',
      }}>
        GAME OVER
      </div>

      {/* Podium */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        maxWidth: 360,
        marginTop: 8,
        marginBottom: 8,
      }}>
        {/* 2nd place */}
        {sorted.length > 1 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'pd-slide-up 0.5s ease 0.2s both',
          }}>
            <span style={{ fontSize: '2rem' }}>{sorted[1].avatar}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: sorted[1].color, marginBottom: 4 }}>
              {sorted[1].name}
            </span>
            <div style={{
              width: '100%',
              height: 80,
              background: `linear-gradient(to top, ${C.card}, ${C.surface})`,
              borderRadius: '12px 12px 0 0',
              border: `1px solid ${C.border}`,
              borderBottom: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}>
              <span style={{ fontSize: '1.5rem' }}>{PODIUM_ICONS[1]}</span>
              <span style={{
                fontSize: '1.2rem', fontWeight: 900,
                fontFamily: "'Bebas Neue', sans-serif",
                color: C.accent2, letterSpacing: 1,
              }}>
                {sorted[1].totalScore}
              </span>
            </div>
          </div>
        )}

        {/* 1st place */}
        {sorted.length > 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'pd-slide-up 0.5s ease 0s both',
          }}>
            <span style={{ fontSize: '2.5rem' }}>{sorted[0].avatar}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: sorted[0].color, marginBottom: 4 }}>
              {sorted[0].name}
            </span>
            <div style={{
              width: '100%',
              height: 110,
              background: `linear-gradient(to top, ${C.accent}22, ${C.card})`,
              borderRadius: '12px 12px 0 0',
              border: `1px solid ${C.accent}44`,
              borderBottom: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              boxShadow: `0 0 20px ${C.accent}22`,
            }}>
              <span style={{ fontSize: '2rem' }}>{PODIUM_ICONS[0]}</span>
              <span style={{
                fontSize: '1.5rem', fontWeight: 900,
                fontFamily: "'Bebas Neue', sans-serif",
                color: C.accent, letterSpacing: 1,
              }}>
                {sorted[0].totalScore}
              </span>
            </div>
          </div>
        )}

        {/* 3rd place */}
        {sorted.length > 2 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'pd-slide-up 0.5s ease 0.4s both',
          }}>
            <span style={{ fontSize: '1.8rem' }}>{sorted[2].avatar}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: sorted[2].color, marginBottom: 4 }}>
              {sorted[2].name}
            </span>
            <div style={{
              width: '100%',
              height: 60,
              background: `linear-gradient(to top, ${C.card}, ${C.surface})`,
              borderRadius: '12px 12px 0 0',
              border: `1px solid ${C.border}`,
              borderBottom: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}>
              <span style={{ fontSize: '1.2rem' }}>{PODIUM_ICONS[2]}</span>
              <span style={{
                fontSize: '1rem', fontWeight: 900,
                fontFamily: "'Bebas Neue', sans-serif",
                color: C.accent2, letterSpacing: 1,
              }}>
                {sorted[2].totalScore}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Full standings */}
      {sorted.length > 3 && (
        <div style={{
          width: '100%', maxWidth: 360,
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 14,
        }}>
          {sorted.slice(3).map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 0',
              borderBottom: i < sorted.length - 4 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: C.muted, width: 20 }}>
                {i + 4}
              </span>
              <span style={{ fontSize: '1.1rem' }}>{p.avatar}</span>
              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 800, color: p.color }}>
                {p.name}
              </span>
              <span style={{
                fontSize: '1rem', fontWeight: 900,
                fontFamily: "'Bebas Neue', sans-serif",
                color: C.accent2, letterSpacing: 1,
              }}>
                {p.totalScore}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Play Again */}
      {isHost && (
        <button
          onClick={onPlayAgain}
          style={{
            width: '100%', maxWidth: 360,
            padding: 16,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent3})`,
            border: 'none',
            borderRadius: 14,
            color: 'white',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.3rem',
            letterSpacing: 3,
            cursor: 'pointer',
            boxShadow: `0 6px 24px ${C.accent}44`,
            marginTop: 8,
          }}
        >
          {'\uD83D\uDD04'} PLAY AGAIN
        </button>
      )}

      {!isHost && (
        <div style={{ fontSize: '0.85rem', color: C.muted, fontWeight: 700 }}>
          Waiting for host...
        </div>
      )}
    </div>
  );
};

export default GameOverScreen;
