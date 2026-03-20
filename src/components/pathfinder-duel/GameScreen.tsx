// ===== Pathfinder Duel — Game Screen =====
// Grid display, path drawing, timer, blocker placement.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDPlayer, PDSettings, RoundState, PathStep } from './types';
import { calculatePathSum } from './grid';
import { playSound } from './audio';
import { C, gridCell, timerBar, timerFill } from './styles';

interface GameScreenProps {
  players: PDPlayer[];
  settings: PDSettings;
  roundState: RoundState;
  localPlayerId: string;
  isHost: boolean;
  onPathSubmit: (path: PathStep[], pathSum: number) => void;
  onBlockerPlaced: (blockedCells: PathStep[]) => void;
  onUpdateRoundState: (rs: RoundState) => void;
}

const ROUND_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  classic: { label: 'CLASSIC', icon: '\u2B06', color: C.accent },
  minimum: { label: 'MINIMUM', icon: '\u2B07', color: C.accent3 },
  multiplier: { label: 'MULTIPLIER', icon: '\u2728', color: C.accent4 },
};

const GameScreen: React.FC<GameScreenProps> = ({
  players, settings, roundState, localPlayerId, isHost,
  onPathSubmit, onBlockerPlaced, onUpdateRoundState,
}) => {
  const [localPath, setLocalPath] = useState<PathStep[]>([]);
  const [localBlockers, setLocalBlockers] = useState<PathStep[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStateRef = useRef(roundState);

  useEffect(() => { roundStateRef.current = roundState; }, [roundState]);

  // Reset local state on new round
  useEffect(() => {
    setLocalPath([]);
    setLocalBlockers([]);
    setSubmitted(false);
  }, [roundState.roundNumber]);

  // Timer (host only)
  useEffect(() => {
    if (!isHost || roundState.phase !== 'drawing') return;

    timerRef.current = setInterval(() => {
      onUpdateRoundState({
        ...roundStateRef.current!,
        timeLeft: Math.max(0, roundStateRef.current!.timeLeft - 1),
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHost, roundState.phase, roundState.roundNumber]);

  // Time up check
  useEffect(() => {
    if (roundState.timeLeft <= 0 && roundState.phase === 'drawing' && !submitted) {
      handleSubmit();
    }
  }, [roundState.timeLeft]);

  // Timer sounds
  useEffect(() => {
    if (roundState.phase !== 'drawing') return;
    if (roundState.timeLeft <= 5 && roundState.timeLeft > 0) {
      playSound('timerDanger', settings.enableSound);
    } else if (roundState.timeLeft > 5 && roundState.timeLeft <= roundState.maxTime && roundState.timeLeft % 5 === 0) {
      playSound('timerTick', settings.enableSound);
    }
  }, [roundState.timeLeft, roundState.phase]);

  const localPlayer = players.find(p => p.id === localPlayerId);
  const rows = roundState.grid.length;
  const cols = roundState.grid[0].length;

  const isOnPath = useCallback((r: number, c: number) => {
    return localPath.some(s => s.row === r && s.col === c);
  }, [localPath]);

  const canMoveTo = useCallback((r: number, c: number): boolean => {
    if (roundState.grid[r][c].blocked) return false;
    if (localPath.length === 0) return r === 0 && c === 0;
    const last = localPath[localPath.length - 1];
    return (
      (r === last.row && c === last.col + 1) ||
      (r === last.row + 1 && c === last.col)
    );
  }, [localPath, roundState.grid]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (submitted) return;

    // Blocker placement mode
    if (roundState.phase === 'placing-blockers') {
      if (!localPlayer?.isBlockerPlacer) return;
      if (r === 0 && c === 0) return; // Can't block start
      if (r === rows - 1 && c === cols - 1) return; // Can't block end

      const existing = localBlockers.find(b => b.row === r && b.col === c);

      if (existing) {
        setLocalBlockers(prev => prev.filter(b => !(b.row === r && b.col === c)));
        playSound('undo', settings.enableSound);
      } else if (localBlockers.length < 2) {
        setLocalBlockers(prev => [...prev, { row: r, col: c }]);
        playSound('blockerPlace', settings.enableSound);
      }
      return;
    }

    // Path drawing mode
    if (roundState.phase !== 'drawing') return;

    // Undo: clicking the last cell removes it
    if (localPath.length > 0) {
      const last = localPath[localPath.length - 1];
      if (last.row === r && last.col === c) {
        setLocalPath(prev => prev.slice(0, -1));
        playSound('undo', settings.enableSound);
        return;
      }
    }

    if (!canMoveTo(r, c)) return;
    if (isOnPath(r, c)) return;

    const newPath = [...localPath, { row: r, col: c }];
    setLocalPath(newPath);
    playSound('cellTap', settings.enableSound);

    // Check if path is complete
    if (r === rows - 1 && c === cols - 1) {
      playSound('pathComplete', settings.enableSound);
    }
  }, [submitted, roundState.phase, localPath, canMoveTo, isOnPath, localBlockers, localPlayer, rows, cols, settings]);

  const handleSubmit = useCallback(() => {
    if (submitted) return;

    // Calculate sum of current path
    const pathSum = calculatePathSum(roundState.grid, localPath);
    setSubmitted(true);
    onPathSubmit(localPath, pathSum);
  }, [submitted, localPath, roundState.grid, onPathSubmit]);

  const handleConfirmBlockers = useCallback(() => {
    if (localBlockers.length === 0) return;
    onBlockerPlaced(localBlockers);
  }, [localBlockers, onBlockerPlaced]);

  const handleClear = useCallback(() => {
    setLocalPath([]);
    playSound('undo', settings.enableSound);
  }, [settings]);

  const pathSum = calculatePathSum(roundState.grid, localPath);
  const pathComplete = localPath.length > 0 &&
    localPath[localPath.length - 1].row === rows - 1 &&
    localPath[localPath.length - 1].col === cols - 1;
  const isPlacingBlockers = roundState.phase === 'placing-blockers';
  const roundInfo = ROUND_TYPE_LABELS[roundState.roundType];
  const timeLeft = roundState.timeLeft;
  const timeFraction = roundState.maxTime > 0 ? timeLeft / roundState.maxTime : 1;
  const isDanger = timeLeft <= 5;

  return (
    <div style={{
      padding: 'clamp(8px, 2vw, 16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      boxSizing: 'border-box',
      maxWidth: 500,
    }}>
      {/* Round info header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 8,
          background: `${roundInfo.color}1a`, border: `1px solid ${roundInfo.color}44`,
        }}>
          <span>{roundInfo.icon}</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: roundInfo.color, letterSpacing: 1 }}>
            {roundInfo.label}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.muted }}>
          Round {roundState.roundNumber}/{roundState.totalRounds}
        </div>
        <div style={{
          fontSize: '1.2rem', fontWeight: 900,
          fontFamily: "'Bebas Neue', sans-serif",
          color: isDanger ? C.danger : C.white,
          letterSpacing: 2,
          animation: isDanger ? 'pd-pulse-text 0.5s ease-in-out infinite alternate' : 'none',
        }}>
          {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      {!isPlacingBlockers && (
        <div style={timerBar(timeFraction, isDanger)}>
          <div style={timerFill(timeFraction, isDanger)} />
        </div>
      )}

      {/* Blocker placement instructions */}
      {isPlacingBlockers && (
        <div style={{
          padding: '8px 16px', borderRadius: 10,
          background: `${C.accent2}1a`, border: `1px solid ${C.accent2}44`,
          fontSize: '0.8rem', fontWeight: 700, color: C.accent2, textAlign: 'center',
        }}>
          {localPlayer?.isBlockerPlacer
            ? `Tap 2 cells to block (${localBlockers.length}/2)`
            : 'Last place is placing blockers...'
          }
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 'clamp(2px, 0.8vw, 4px)',
        width: '100%',
        maxWidth: `min(90vw, ${cols * 60}px)`,
        touchAction: 'none',
        userSelect: 'none' as const,
        WebkitUserSelect: 'none',
      }}>
        {roundState.grid.map((row, r) =>
          row.map((cell, c) => {
            const onPath = isOnPath(r, c);
            const isStart = r === 0 && c === 0;
            const isEnd = r === rows - 1 && c === cols - 1;
            const isBlocked = cell.blocked || false;
            const isBlockerSelected = localBlockers.some(b => b.row === r && b.col === c);
            const movable = !submitted && !isBlocked && canMoveTo(r, c) && !onPath;

            return (
              <div
                key={`${r}-${c}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleCellClick(r, c);
                }}
                style={{
                  ...gridCell(onPath, isStart, isEnd, isBlocked, localPlayer?.color || C.accent, cell.multiplier),
                  ...(isBlockerSelected ? {
                    background: `${C.danger}33`,
                    border: `2px solid ${C.danger}`,
                    boxShadow: `0 0 10px ${C.danger}44`,
                  } : {}),
                  ...(movable && !isPlacingBlockers ? {
                    cursor: 'pointer',
                    opacity: 0.8,
                  } : {}),
                  animation: onPath ? 'pd-cell-pop 0.2s ease' : 'none',
                  minHeight: 'clamp(32px, 10vw, 52px)',
                }}
              >
                {isBlocked ? (
                  <span style={{ fontSize: 'clamp(0.8rem, 3vw, 1.2rem)' }}>{'\u2716'}</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <span>{cell.value}</span>
                    {cell.multiplier && (
                      <span style={{
                        fontSize: 'clamp(0.45rem, 1.5vw, 0.55rem)',
                        color: cell.multiplier === 3 ? C.accent2 : C.accent4,
                        fontWeight: 900,
                      }}>
                        {'\u00D7'}{cell.multiplier}
                      </span>
                    )}
                  </div>
                )}
                {/* Start/End markers */}
                {isStart && !isBlocked && (
                  <div style={{
                    position: 'absolute', top: 1, left: 3,
                    fontSize: 'clamp(0.4rem, 1.2vw, 0.5rem)',
                    color: C.accent, fontWeight: 900,
                  }}>
                    S
                  </div>
                )}
                {isEnd && !isBlocked && (
                  <div style={{
                    position: 'absolute', top: 1, right: 3,
                    fontSize: 'clamp(0.4rem, 1.2vw, 0.5rem)',
                    color: C.accent2, fontWeight: 900,
                  }}>
                    E
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Score + Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: C.muted, fontWeight: 700 }}>Sum:</span>
          <span style={{
            fontSize: '1.4rem', fontWeight: 900,
            fontFamily: "'Bebas Neue', sans-serif",
            color: pathSum >= 0 ? C.accent : C.danger,
            letterSpacing: 1,
          }}>
            {pathSum}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!isPlacingBlockers && !submitted && (
            <>
              <button
                onClick={handleClear}
                disabled={localPath.length === 0}
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  background: C.surface, border: `1px solid ${C.border}`,
                  color: localPath.length > 0 ? C.white : C.muted,
                  fontSize: '0.75rem', fontWeight: 700, cursor: localPath.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: localPath.length > 0 ? 1 : 0.5,
                }}
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                disabled={!pathComplete}
                style={{
                  padding: '8px 18px', borderRadius: 10,
                  background: pathComplete ? `linear-gradient(135deg, ${C.accent}, ${C.accent3})` : C.surface,
                  border: pathComplete ? 'none' : `1px solid ${C.border}`,
                  color: pathComplete ? 'white' : C.muted,
                  fontSize: '0.8rem', fontWeight: 800, cursor: pathComplete ? 'pointer' : 'not-allowed',
                  boxShadow: pathComplete ? `0 4px 16px ${C.accent}44` : 'none',
                }}
              >
                {'\u2705'} Submit
              </button>
            </>
          )}

          {isPlacingBlockers && localPlayer?.isBlockerPlacer && (
            <button
              onClick={handleConfirmBlockers}
              disabled={localBlockers.length === 0}
              style={{
                padding: '8px 18px', borderRadius: 10,
                background: localBlockers.length > 0 ? `linear-gradient(135deg, ${C.accent2}, ${C.danger})` : C.surface,
                border: localBlockers.length > 0 ? 'none' : `1px solid ${C.border}`,
                color: localBlockers.length > 0 ? 'white' : C.muted,
                fontSize: '0.8rem', fontWeight: 800,
                cursor: localBlockers.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              {'\uD83E\uDDF1'} Confirm Blockers
            </button>
          )}
        </div>
      </div>

      {/* Submitted overlay */}
      {submitted && (
        <div style={{
          padding: '12px 24px', borderRadius: 14,
          background: `${C.accent}15`, border: `1px solid ${C.accent}44`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: C.accent, marginBottom: 4 }}>
            {'\u2705'} Path Submitted!
          </div>
          <div style={{ fontSize: '0.75rem', color: C.muted }}>
            Waiting for other players... ({players.filter(p => p.submitted).length}/{players.length})
          </div>
        </div>
      )}

      {/* Player status bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {players.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 8,
            background: C.card, border: `1px solid ${C.border}`,
            fontSize: '0.65rem', fontWeight: 700,
          }}>
            <span>{p.avatar}</span>
            <span style={{ color: p.color }}>{p.name}</span>
            {p.submitted && <span style={{ color: C.accent }}>{'\u2713'}</span>}
          </div>
        ))}
      </div>

      {/* Round type hint */}
      <div style={{ fontSize: '0.7rem', color: C.muted, textAlign: 'center' }}>
        {isPlacingBlockers && 'Last place picks 2 cells to block as a catch-up!'}
        {!isPlacingBlockers && roundState.roundType === 'minimum' && 'Lowest sum wins this round!'}
        {!isPlacingBlockers && roundState.roundType === 'multiplier' && 'Multiplier cells multiply your running total!'}
        {!isPlacingBlockers && roundState.roundType === 'classic' && 'Trace the highest-sum path!'}
      </div>
    </div>
  );
};

export default GameScreen;
