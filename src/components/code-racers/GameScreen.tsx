// ===== Code Racers — Game Screen =====
// Renders the grid board, program builder, execution viewer, and HUD.

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CRPlayer, CRSettings, RoundState, BlockType, Direction, ExecutionFrame, ExecutionEvent } from './types';
import { BLOCK_INFO, DIFFICULTY_CONFIG, ROBOT_AVATARS, PLAYER_COLORS } from './types';
import { playSound } from './audio';
import { C, CELL_COLORS, blockStyle, programSlot } from './styles';

interface GameScreenProps {
  players: CRPlayer[];
  roundState: RoundState;
  settings: CRSettings;
  localPlayerId: string;
  isHost: boolean;
  onSubmitProgram: (program: BlockType[]) => void;
}

// Direction arrow characters
const DIR_ARROWS: Record<Direction, string> = {
  up: '▲',
  down: '▼',
  left: '◀',
  right: '▶',
};

const CONVEYOR_ARROWS: Record<Direction, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

export default function GameScreen({
  players,
  roundState,
  settings,
  localPlayerId,
  onSubmitProgram,
}: GameScreenProps) {
  const [program, setProgram] = useState<(BlockType | null)[]>(
    Array(settings.instructionSlots).fill(null)
  );
  const [draggedBlock, setDraggedBlock] = useState<BlockType | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [executionFrame, setExecutionFrame] = useState(0);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localPlayer = players.find(p => p.id === localPlayerId);
  const submitted = localPlayer?.programSubmitted || false;

  const availableBlocks = DIFFICULTY_CONFIG[settings.difficulty].availableBlocks;

  // Reset program when new round starts
  useEffect(() => {
    if (roundState.phase === 'planning') {
      setProgram(Array(settings.instructionSlots + (localPlayer?.bonusSlots || 0)).fill(null));
      setExecutionFrame(0);
    }
  }, [roundState.roundNumber, roundState.phase, settings.instructionSlots, localPlayer?.bonusSlots]);

  // Animate execution frames
  useEffect(() => {
    if (roundState.phase === 'executing' && roundState.executionFrames.length > 0) {
      setExecutionFrame(0);
      animTimerRef.current = setInterval(() => {
        setExecutionFrame(prev => {
          const next = prev + 1;
          if (next >= roundState.executionFrames.length) {
            if (animTimerRef.current) clearInterval(animTimerRef.current);
            return prev;
          }
          // Play sounds for events in this frame
          const frame = roundState.executionFrames[next];
          if (frame) {
            for (const evt of frame.events) {
              if (evt.type === 'gemCollected') playSound('gemCollect', settings.enableSound);
              else if (evt.type === 'collision') playSound('collision', settings.enableSound);
              else if (evt.type === 'push') playSound('push', settings.enableSound);
              else if (evt.type === 'portal') playSound('portal', settings.enableSound);
              else if (evt.type === 'wallBump') playSound('wallBump', settings.enableSound);
              else if (evt.type === 'boost') playSound('boost', settings.enableSound);
              else if (evt.type === 'scan') playSound('scan', settings.enableSound);
            }
          }
          return next;
        });
      }, 600);
      playSound('executionStart', settings.enableSound);
    }
    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, [roundState.phase, roundState.executionFrames, settings.enableSound]);

  const handleDragStart = useCallback((blockType: BlockType) => {
    setDraggedBlock(blockType);
  }, []);

  const handleDrop = useCallback((slotIdx: number) => {
    if (draggedBlock && !submitted) {
      setProgram(prev => {
        const next = [...prev];
        next[slotIdx] = draggedBlock;
        return next;
      });
      playSound('uiClick', settings.enableSound);
    }
    setDraggedBlock(null);
    setDragOverSlot(null);
  }, [draggedBlock, submitted, settings.enableSound]);

  const handleRemoveSlot = useCallback((slotIdx: number) => {
    if (submitted) return;
    setProgram(prev => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
    playSound('uiClick', settings.enableSound);
  }, [submitted, settings.enableSound]);

  const handleSubmit = useCallback(() => {
    const filled = program.filter((b): b is BlockType => b !== null);
    if (filled.length === 0) return;
    playSound('programSubmit', settings.enableSound);
    onSubmitProgram(filled);
  }, [program, onSubmitProgram, settings.enableSound]);

  const handleClear = useCallback(() => {
    if (submitted) return;
    setProgram(Array(settings.instructionSlots + (localPlayer?.bonusSlots || 0)).fill(null));
    playSound('uiClick', settings.enableSound);
  }, [submitted, settings.instructionSlots, localPlayer?.bonusSlots, settings.enableSound]);

  // Touch/pointer drag support
  const handleTouchBlock = useCallback((blockType: BlockType) => {
    if (submitted) return;
    // Find first empty slot and place it
    setProgram(prev => {
      const next = [...prev];
      const emptyIdx = next.findIndex(b => b === null);
      if (emptyIdx !== -1) {
        next[emptyIdx] = blockType;
        playSound('uiClick', settings.enableSound);
      }
      return next;
    });
  }, [submitted, settings.enableSound]);

  // Current frame data for rendering
  const currentFrame: ExecutionFrame | null =
    roundState.phase === 'executing' && roundState.executionFrames.length > 0
      ? roundState.executionFrames[Math.min(executionFrame, roundState.executionFrames.length - 1)]
      : null;

  const cellSize = Math.min(Math.floor((window.innerWidth - 32) / settings.gridSize), 52);

  return (
    <div style={{
      minHeight: '100dvh',
      background: C.bg,
      fontFamily: "'Nunito', sans-serif",
      color: C.white,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    }}>

      {/* HUD - Player scores & round info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        gap: 4,
        flexWrap: 'wrap',
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem',
          color: C.accent,
          fontWeight: 700,
        }}>
          R{roundState.roundNumber}/{roundState.totalRounds}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
          {players.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              background: p.id === localPlayerId ? `${PLAYER_COLORS[i]}22` : C.card,
              borderRadius: 8,
              border: `1px solid ${p.programSubmitted && roundState.phase === 'planning' ? C.green : PLAYER_COLORS[i]}44`,
              fontSize: '0.7rem',
              fontWeight: 800,
            }}>
              <span>{ROBOT_AVATARS[i % ROBOT_AVATARS.length]}</span>
              <span style={{ color: PLAYER_COLORS[i % PLAYER_COLORS.length], maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ color: C.accent, fontFamily: "'Space Mono', monospace" }}>{p.totalScore}</span>
              {p.programSubmitted && roundState.phase === 'planning' && (
                <span style={{ color: C.green, fontSize: '0.6rem' }}>✓</span>
              )}
            </div>
          ))}
        </div>
        {roundState.phase === 'planning' && (
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '1rem',
            fontWeight: 900,
            color: roundState.timeLeft <= 5 ? C.danger : C.accent,
            minWidth: 30,
            textAlign: 'right',
            animation: roundState.timeLeft <= 5 ? 'cr-pulse 0.5s ease-in-out infinite' : 'none',
          }}>
            {roundState.timeLeft}s
          </div>
        )}
        {roundState.phase === 'executing' && (
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.7rem',
            color: C.accent2,
            fontWeight: 700,
          }}>
            ▶ RUNNING
          </div>
        )}
      </div>

      {/* Grid Board */}
      <div style={{
        flex: roundState.phase === 'executing' ? 1 : 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 8px',
        overflow: 'auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${settings.gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${settings.gridSize}, ${cellSize}px)`,
          gap: 2,
          border: `2px solid ${C.border}`,
          borderRadius: 8,
          padding: 4,
          background: C.surface,
        }}>
          {roundState.grid.map((row, r) =>
            row.map((cell, c_idx) => {
              // Find robot on this cell
              let robotOnCell: { playerId: string; facing: Direction } | null = null;
              if (currentFrame) {
                const rb = currentFrame.robots.find(rb => rb.row === r && rb.col === c_idx && !rb.crashed);
                if (rb) robotOnCell = rb;
              } else {
                const rb = roundState.robots.find(rb => rb.row === r && rb.col === c_idx && !rb.crashed);
                if (rb) robotOnCell = rb;
              }

              const playerIdx = robotOnCell ? players.findIndex(p => p.id === robotOnCell!.playerId) : -1;

              // Check for events on this cell in current frame
              let hasEvent: ExecutionEvent | null = null;
              if (currentFrame) {
                hasEvent = currentFrame.events.find(e => e.row === r && e.col === c_idx) || null;
              }

              const isGem = cell.type === 'gem' || cell.type === 'bonusStar';
              const isHidden = cell.type === 'hiddenGem' && !cell.revealed;
              const showGem = isGem && !hasEvent?.type.includes('gemCollected');

              return (
                <div
                  key={`${r}-${c_idx}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: cell.type === 'wall' ? CELL_COLORS.wall :
                      cell.type === 'oilSlick' ? CELL_COLORS.oilSlick :
                        `${C.bg}`,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    fontSize: cellSize > 36 ? '1.2rem' : '0.9rem',
                    border: cell.type === 'portal' ? `2px solid ${CELL_COLORS.portal}` :
                      cell.type === 'rechargePad' ? `2px solid ${CELL_COLORS.rechargePad}` :
                        cell.type === 'conveyor' ? `1px solid ${CELL_COLORS.conveyor}` :
                          'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {/* Cell content */}
                  {cell.type === 'wall' && <span style={{ fontSize: cellSize > 36 ? '1rem' : '0.7rem' }}>🧱</span>}
                  {showGem && (
                    <span style={{ animation: hasEvent ? 'cr-gem-collect 0.4s forwards' : undefined }}>
                      {cell.type === 'bonusStar' ? '⭐' : '💎'}
                      {cell.gemValue && cell.gemValue > 1 && (
                        <span style={{
                          position: 'absolute',
                          bottom: 1,
                          right: 3,
                          fontSize: '0.5rem',
                          fontWeight: 900,
                          color: C.yellow,
                          fontFamily: "'Space Mono', monospace",
                        }}>
                          {cell.gemValue}
                        </span>
                      )}
                    </span>
                  )}
                  {isHidden && <span style={{ opacity: 0.15, fontSize: '0.6rem' }}>?</span>}
                  {cell.type === 'portal' && !robotOnCell && <span>🌀</span>}
                  {cell.type === 'conveyor' && !robotOnCell && (
                    <span style={{ color: C.muted, fontSize: '0.7rem' }}>
                      {CONVEYOR_ARROWS[cell.conveyorDir || 'right']}
                    </span>
                  )}
                  {cell.type === 'rechargePad' && !robotOnCell && <span style={{ fontSize: '0.8rem' }}>🔋</span>}
                  {cell.type === 'oilSlick' && !robotOnCell && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>🛢️</span>}

                  {/* Robot */}
                  {robotOnCell && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      animation: roundState.phase === 'executing' ? 'cr-robot-move 0.3s ease' : undefined,
                      zIndex: 10,
                    }}>
                      <span style={{
                        fontSize: cellSize > 36 ? '1.3rem' : '1rem',
                        filter: `drop-shadow(0 0 4px ${PLAYER_COLORS[playerIdx % PLAYER_COLORS.length]})`,
                      }}>
                        {ROBOT_AVATARS[playerIdx % ROBOT_AVATARS.length]}
                      </span>
                      <span style={{
                        fontSize: '0.5rem',
                        color: PLAYER_COLORS[playerIdx % PLAYER_COLORS.length],
                        lineHeight: 1,
                        marginTop: -2,
                      }}>
                        {DIR_ARROWS[robotOnCell.facing]}
                      </span>
                    </div>
                  )}

                  {/* Event effects */}
                  {hasEvent?.type === 'collision' && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: `${C.danger}33`,
                      borderRadius: 4,
                      animation: 'cr-collision 0.3s ease',
                    }} />
                  )}
                  {hasEvent?.type === 'scan' && (
                    <div style={{
                      position: 'absolute',
                      inset: -cellSize,
                      border: `2px solid ${C.accent}`,
                      borderRadius: '50%',
                      animation: 'cr-scan-ring 0.6s ease forwards',
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Round Summary Overlay */}
      {roundState.phase === 'summary' && (
        <div style={{
          padding: '12px 16px',
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
        }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.65rem',
            letterSpacing: 2,
            color: C.muted,
            marginBottom: 8,
            textTransform: 'uppercase',
          }}>
            ROUND {roundState.roundNumber} RESULTS
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {players.map((p, i) => (
              <div key={p.id} style={{
                padding: '6px 10px',
                background: C.card,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>{ROBOT_AVATARS[i % ROBOT_AVATARS.length]}</span>
                <span style={{ color: PLAYER_COLORS[i % PLAYER_COLORS.length] }}>{p.name}</span>
                <span style={{ color: C.yellow }}>+{roundState.gemsCollectedThisRound[p.id] || 0}</span>
              </div>
            ))}
          </div>
          {roundState.roundBonuses.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {roundState.roundBonuses.map((b, i) => {
                const bonusPlayer = players.find(p => p.id === b.playerId);
                return (
                  <div key={i} style={{
                    padding: '4px 8px',
                    background: `${C.accent2}1a`,
                    border: `1px solid ${C.accent2}44`,
                    borderRadius: 8,
                    fontSize: '0.65rem',
                    color: C.accent2,
                    fontWeight: 700,
                  }}>
                    {b.bonus} — {bonusPlayer?.name} (+{b.points})
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Program Builder (planning phase only) */}
      {roundState.phase === 'planning' && (
        <div style={{
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
          padding: '12px 12px 20px',
        }}>
          {/* Available blocks */}
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: 2,
            color: C.muted,
            marginBottom: 8,
            textTransform: 'uppercase',
          }}>
            INSTRUCTIONS
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {availableBlocks.map(bt => {
              const info = BLOCK_INFO[bt];
              return (
                <div
                  key={bt}
                  draggable={!submitted}
                  onDragStart={() => handleDragStart(bt)}
                  onClick={() => handleTouchBlock(bt)}
                  style={{
                    ...blockStyle(info.color, draggedBlock === bt),
                    opacity: submitted ? 0.4 : 1,
                    cursor: submitted ? 'not-allowed' : 'pointer',
                  }}
                  title={info.description}
                >
                  <span>{info.icon}</span>
                  <span style={{ fontSize: '0.65rem' }}>{info.label}</span>
                </div>
              );
            })}
          </div>

          {/* Program slots */}
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: 2,
            color: C.muted,
            marginBottom: 6,
            textTransform: 'uppercase',
          }}>
            YOUR PROGRAM ({program.filter(b => b !== null).length}/{program.length})
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {program.map((block, idx) => (
              <div
                key={idx}
                onDragOver={e => { e.preventDefault(); setDragOverSlot(idx); }}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={e => { e.preventDefault(); handleDrop(idx); }}
                onClick={() => { if (block) handleRemoveSlot(idx); }}
                style={{
                  ...programSlot(block !== null, dragOverSlot === idx),
                  width: `calc(${100 / Math.min(program.length, 7)}% - 5px)`,
                  minWidth: 54,
                  cursor: block && !submitted ? 'pointer' : 'default',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '4px',
                }}
              >
                {block ? (
                  <>
                    <span style={{ fontSize: '1rem' }}>{BLOCK_INFO[block].icon}</span>
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 800,
                      color: BLOCK_INFO[block].color,
                      fontFamily: "'Space Mono', monospace",
                    }}>
                      {BLOCK_INFO[block].label}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.6rem', color: C.muted }}>{idx + 1}</span>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleClear}
              disabled={submitted}
              style={{
                flex: 1,
                padding: '10px',
                background: C.card,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                color: C.muted,
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: submitted ? 'not-allowed' : 'pointer',
                opacity: submitted ? 0.4 : 1,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              🗑️ Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitted || program.every(b => b === null)}
              style={{
                flex: 2,
                padding: '10px',
                background: submitted
                  ? `${C.green}33`
                  : `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
                border: submitted ? `1.5px solid ${C.green}` : 'none',
                borderRadius: 10,
                color: submitted ? C.green : 'white',
                fontSize: '0.85rem',
                fontWeight: 900,
                cursor: submitted ? 'default' : 'pointer',
                opacity: (!submitted && program.every(b => b === null)) ? 0.4 : 1,
                fontFamily: "'Nunito', sans-serif",
                letterSpacing: 1,
              }}
            >
              {submitted ? '✓ LOCKED IN' : '🔒 LOCK IN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
