// ===== Pathfinder Duel — Reveal Screen =====
// Shows all paths overlaid, optimal path, and round scores.

import React, { useEffect } from 'react';
import type { PDPlayer, PDSettings, RoundState } from './types';
import { playSound } from './audio';
import { C, gridCell } from './styles';

interface RevealScreenProps {
  players: PDPlayer[];
  roundState: RoundState;
  settings: PDSettings;
  isHost: boolean;
  onNextRound: () => void;
}

const RevealScreen: React.FC<RevealScreenProps> = ({
  players, roundState, settings, isHost, onNextRound,
}) => {
  const rows = roundState.grid.length;
  const cols = roundState.grid[0].length;

  // Play reveal sound
  useEffect(() => {
    playSound('reveal', settings.enableSound);

    // Auto-advance after 10 seconds
    const timer = setTimeout(() => {
      if (isHost) onNextRound();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Play winner sound after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      playSound('roundWin', settings.enableSound);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sort players by round score, then by submission time as tiebreaker
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreDiff = b.roundScore - a.roundScore;
    if (scoreDiff !== 0) return scoreDiff;
    return (a.submittedAt || Infinity) - (b.submittedAt || Infinity);
  });

  // Build cell overlay map: which players' paths cross each cell
  const cellPaths = new Map<string, { color: string; name: string }[]>();
  for (const player of players) {
    if (!player.submitted || player.path.length === 0) continue;
    for (const step of player.path) {
      const key = `${step.row},${step.col}`;
      if (!cellPaths.has(key)) cellPaths.set(key, []);
      cellPaths.get(key)!.push({ color: player.color, name: player.name });
    }
  }

  // Optimal path set
  const optimalSet = new Set(
    roundState.optimalPath.map(s => `${s.row},${s.col}`)
  );

  const isFinalRound = roundState.roundNumber >= roundState.totalRounds;

  return (
    <div style={{
      padding: 'clamp(8px, 2vw, 16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      boxSizing: 'border-box',
      maxWidth: 500,
      animation: 'pd-pop-in 0.4s ease',
    }}>
      {/* Header */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(1.5rem, 6vw, 2.2rem)',
        letterSpacing: 3,
        color: C.accent2,
      }}>
        ROUND {roundState.roundNumber} RESULTS
      </div>

      {/* Grid with overlaid paths */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 'clamp(2px, 0.8vw, 4px)',
        width: '100%',
        maxWidth: `min(90vw, ${cols * 55}px)`,
      }}>
        {roundState.grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const pathPlayers = cellPaths.get(key) || [];
            const isOptimal = optimalSet.has(key);
            const isBlocked = cell.blocked || false;
            const isStart = r === 0 && c === 0;
            const isEnd = r === rows - 1 && c === cols - 1;
            const hasPath = pathPlayers.length > 0;

            return (
              <div
                key={key}
                style={{
                  ...gridCell(false, isStart, isEnd, isBlocked, C.accent),
                  position: 'relative',
                  minHeight: 'clamp(28px, 8vw, 46px)',
                  ...(isOptimal && !isBlocked ? {
                    border: `2px dashed ${C.accent2}`,
                    boxShadow: `0 0 8px ${C.accent2}44`,
                  } : {}),
                }}
              >
                {isBlocked ? (
                  <span style={{ fontSize: 'clamp(0.7rem, 2.5vw, 1rem)' }}>{'\u2716'}</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 'clamp(0.6rem, 2.5vw, 0.85rem)' }}>{cell.value}</span>
                    {cell.multiplier && (
                      <span style={{
                        fontSize: 'clamp(0.4rem, 1.2vw, 0.5rem)',
                        color: cell.multiplier === 3 ? C.accent2 : C.accent4,
                        fontWeight: 900,
                      }}>
                        {'\u00D7'}{cell.multiplier}
                      </span>
                    )}
                  </div>
                )}

                {/* Path overlay dots */}
                {hasPath && !isBlocked && (
                  <div style={{
                    position: 'absolute',
                    bottom: 1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 1,
                  }}>
                    {pathPlayers.map((pp, i) => (
                      <div key={i} style={{
                        width: 'clamp(4px, 1.2vw, 6px)',
                        height: 'clamp(4px, 1.2vw, 6px)',
                        borderRadius: '50%',
                        background: pp.color,
                        boxShadow: `0 0 4px ${pp.color}88`,
                      }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {players.filter(p => p.submitted).map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.7rem', fontWeight: 700,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: p.color, boxShadow: `0 0 4px ${p.color}88`,
            }} />
            <span style={{ color: p.color }}>{p.name}</span>
            <span style={{ color: C.muted }}>({p.pathSum})</span>
          </div>
        ))}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.7rem', fontWeight: 700,
        }}>
          <div style={{
            width: 12, height: 2,
            border: `1px dashed ${C.accent2}`,
          }} />
          <span style={{ color: C.accent2 }}>Optimal ({roundState.optimalSum})</span>
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{
        width: '100%', background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 16,
      }}>
        <div style={{
          fontSize: '0.65rem', fontFamily: "'Space Mono', monospace",
          letterSpacing: 3, color: C.muted, textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Round Scores
        </div>
        {sortedPlayers.map((p, i) => {
          const isOptimal = roundState.optimalPath.length > 0 &&
            p.path.length === roundState.optimalPath.length &&
            p.path.every((s, j) =>
              s.row === roundState.optimalPath[j].row && s.col === roundState.optimalPath[j].col
            );

          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: i < sortedPlayers.length - 1 ? `1px solid ${C.border}` : 'none',
              animation: `pd-slide-up 0.3s ease ${i * 0.1}s both`,
            }}>
              <span style={{
                fontSize: '1.1rem', fontWeight: 900,
                color: i === 0 ? C.accent2 : C.muted,
                width: 20, textAlign: 'center',
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '1.2rem' }}>{p.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: p.color }}>
                  {p.name}
                  {i === 0 && p.pathComplete && <span style={{ marginLeft: 6, color: C.accent2 }}>{'\uD83C\uDFC6'}</span>}
                  {isOptimal && <span style={{ marginLeft: 4, color: C.accent2, fontSize: '0.7rem' }}>{'\u2728'} Optimal!</span>}
                </div>
                <div style={{ fontSize: '0.65rem', color: C.muted }}>
                  {p.pathComplete ? (
                    <>
                      Path sum: {p.pathSum}
                      {p.submittedAt && roundState.startedAt && (
                        <span style={{ marginLeft: 8, color: C.muted }}>
                          {'\u23F1'} {((p.submittedAt - roundState.startedAt) / 1000).toFixed(1)}s
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: '#ef4444' }}>Did not finish</span>
                  )}
                </div>
              </div>
              <div style={{
                fontSize: '1.1rem', fontWeight: 900,
                fontFamily: "'Bebas Neue', sans-serif",
                color: p.roundScore > 0 ? C.accent : C.muted,
                letterSpacing: 1,
              }}>
                +{p.roundScore}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total scores */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {[...players].sort((a, b) => b.totalScore - a.totalScore).map(p => (
          <div key={p.id} style={{
            padding: '4px 10px', borderRadius: 8,
            background: C.card, border: `1px solid ${C.border}`,
            fontSize: '0.7rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ color: p.color }}>{p.avatar} {p.name}</span>
            <span style={{ color: C.accent2, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>
              {p.totalScore}
            </span>
          </div>
        ))}
      </div>

      {/* Next Round / Game Over button */}
      {isHost && (
        <button
          onClick={onNextRound}
          style={{
            padding: '14px 32px',
            borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent3})`,
            border: 'none',
            color: 'white',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.3rem',
            letterSpacing: 3,
            cursor: 'pointer',
            boxShadow: `0 6px 24px ${C.accent}44`,
          }}
        >
          {isFinalRound ? '\uD83C\uDFC6 FINAL RESULTS' : '\u27A1\uFE0F NEXT ROUND'}
        </button>
      )}

      {!isHost && (
        <div style={{ fontSize: '0.8rem', color: C.muted, fontWeight: 700 }}>
          {isFinalRound ? 'Waiting for final results...' : 'Waiting for host to continue...'}
        </div>
      )}
    </div>
  );
};

export default RevealScreen;
