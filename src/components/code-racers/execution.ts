// ===== Code Racers — Program Execution Engine =====
// Resolves all robot programs simultaneously, step by step.

import type { Robot, GridCell, BlockType, Direction, ExecutionFrame, ExecutionEvent } from './types';
import { getForwardCell, turnDirection, isInBounds, isWalkable, findPortalExit } from './grid';

interface RobotState {
  playerId: string;
  row: number;
  col: number;
  facing: Direction;
  crashed: boolean;
  pendingRow: number;
  pendingCol: number;
}

// Expand a program with loops unrolled and conditionals resolved
function expandProgram(program: BlockType[]): BlockType[] {
  const expanded: BlockType[] = [];
  let i = 0;
  while (i < program.length) {
    const block = program[i];
    if (block === 'loop2' || block === 'loop3') {
      const repeatCount = block === 'loop2' ? 2 : 3;
      const next = program[i + 1];
      if (next) {
        for (let r = 0; r < repeatCount; r++) {
          expanded.push(next);
        }
        i += 2;
      } else {
        i++;
      }
    } else {
      expanded.push(block);
      i++;
    }
  }
  return expanded;
}

// Check if there's a gem in front of the robot
function hasGemAhead(state: RobotState, grid: GridCell[][]): boolean {
  const fwd = getForwardCell(state.row, state.col, state.facing);
  if (!isInBounds(fwd.row, fwd.col, grid.length)) return false;
  const cell = grid[fwd.row][fwd.col];
  return cell.type === 'gem' || cell.type === 'bonusStar' || (cell.type === 'hiddenGem' && cell.revealed === true);
}

// Check if the robot is blocked ahead
function isBlockedAhead(state: RobotState, grid: GridCell[][], allStates: RobotState[]): boolean {
  const fwd = getForwardCell(state.row, state.col, state.facing);
  if (!isInBounds(fwd.row, fwd.col, grid.length)) return true;
  if (grid[fwd.row][fwd.col].type === 'wall') return true;
  // Check if another robot is in the way
  return allStates.some(s => s.playerId !== state.playerId && !s.crashed && s.row === fwd.row && s.col === fwd.col);
}

// Execute all robot programs and return animation frames
export function executePrograms(
  robots: Robot[],
  grid: GridCell[][],
): { frames: ExecutionFrame[]; finalGrid: GridCell[][]; gemsCollected: Record<string, number> } {
  const size = grid.length;
  const frames: ExecutionFrame[] = [];
  const gemsCollected: Record<string, number> = {};
  robots.forEach(r => { gemsCollected[r.playerId] = 0; });

  // Deep clone grid so we can mutate it (gem collection)
  const gridCopy: GridCell[][] = grid.map(row => row.map(cell => ({ ...cell })));

  // Expand all programs
  const expandedPrograms: Map<string, BlockType[]> = new Map();
  for (const robot of robots) {
    expandedPrograms.set(robot.playerId, expandProgram(robot.program));
  }

  // Find max program length
  let maxSteps = 0;
  for (const prog of expandedPrograms.values()) {
    maxSteps = Math.max(maxSteps, prog.length);
  }

  // Per-robot skip flags for conditional blocks
  const skipNext: Map<string, boolean> = new Map();
  robots.forEach(r => skipNext.set(r.playerId, false));

  // Initialize robot states
  const states: RobotState[] = robots.map(r => ({
    playerId: r.playerId,
    row: r.row,
    col: r.col,
    facing: r.facing,
    crashed: r.crashed,
    pendingRow: r.row,
    pendingCol: r.col,
  }));

  // Record initial frame
  frames.push({
    robots: states.map(s => ({ playerId: s.playerId, row: s.row, col: s.col, facing: s.facing, crashed: s.crashed })),
    events: [],
  });

  // Execute step by step
  for (let step = 0; step < maxSteps; step++) {
    const events: ExecutionEvent[] = [];

    // Phase 1: Calculate intended moves for each robot
    for (const state of states) {
      if (state.crashed) continue;
      const prog = expandedPrograms.get(state.playerId)!;
      if (step >= prog.length) continue;

      const block = prog[step];

      // If previous conditional failed, skip this block
      if (skipNext.get(state.playerId)) {
        skipNext.set(state.playerId, false);
        continue;
      }

      // Handle conditionals: evaluate condition, if false skip the NEXT block
      if (block === 'ifGemAhead') {
        if (!hasGemAhead(state, gridCopy)) {
          skipNext.set(state.playerId, true);
        }
        continue;
      }
      if (block === 'ifBlocked') {
        if (!isBlockedAhead(state, gridCopy, states)) {
          skipNext.set(state.playerId, true);
        }
        continue;
      }

      switch (block) {
        case 'move': {
          const fwd = getForwardCell(state.row, state.col, state.facing);
          if (isWalkable(gridCopy, fwd.row, fwd.col)) {
            state.pendingRow = fwd.row;
            state.pendingCol = fwd.col;
          } else {
            events.push({ type: 'wallBump', playerId: state.playerId, row: state.row, col: state.col });
          }
          break;
        }
        case 'turnLeft':
          state.facing = turnDirection(state.facing, 'left');
          break;
        case 'turnRight':
          state.facing = turnDirection(state.facing, 'right');
          break;
        case 'jump': {
          const over = getForwardCell(state.row, state.col, state.facing, 1);
          const land = getForwardCell(state.row, state.col, state.facing, 2);
          if (isInBounds(land.row, land.col, size) && gridCopy[land.row][land.col].type !== 'wall') {
            state.pendingRow = land.row;
            state.pendingCol = land.col;
          } else if (isInBounds(over.row, over.col, size) && isWalkable(gridCopy, over.row, over.col)) {
            state.pendingRow = over.row;
            state.pendingCol = over.col;
          } else {
            events.push({ type: 'wallBump', playerId: state.playerId, row: state.row, col: state.col });
          }
          break;
        }
        case 'boost': {
          const fwd1 = getForwardCell(state.row, state.col, state.facing, 1);
          const fwd2 = getForwardCell(state.row, state.col, state.facing, 2);
          if (isWalkable(gridCopy, fwd2.row, fwd2.col) && isWalkable(gridCopy, fwd1.row, fwd1.col)) {
            state.pendingRow = fwd2.row;
            state.pendingCol = fwd2.col;
            events.push({ type: 'boost', playerId: state.playerId, row: fwd2.row, col: fwd2.col });
          } else if (isWalkable(gridCopy, fwd1.row, fwd1.col)) {
            state.pendingRow = fwd1.row;
            state.pendingCol = fwd1.col;
          } else {
            events.push({ type: 'wallBump', playerId: state.playerId, row: state.row, col: state.col });
          }
          break;
        }
        case 'push': {
          const fwd = getForwardCell(state.row, state.col, state.facing);
          const target = states.find(s => !s.crashed && s.playerId !== state.playerId && s.row === fwd.row && s.col === fwd.col);
          if (target) {
            const pushDest = getForwardCell(target.row, target.col, state.facing);
            if (isWalkable(gridCopy, pushDest.row, pushDest.col)) {
              target.pendingRow = pushDest.row;
              target.pendingCol = pushDest.col;
              events.push({ type: 'push', playerId: state.playerId, row: fwd.row, col: fwd.col, targetPlayerId: target.playerId });
            }
          }
          break;
        }
        case 'scan': {
          // Reveal hidden gems in 3x3 area around robot
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const sr = state.row + dr;
              const sc = state.col + dc;
              if (isInBounds(sr, sc, size) && gridCopy[sr][sc].type === 'hiddenGem') {
                gridCopy[sr][sc].type = 'gem';
                gridCopy[sr][sc].revealed = true;
              }
            }
          }
          events.push({ type: 'scan', playerId: state.playerId, row: state.row, col: state.col });
          break;
        }
      }
    }

    // Phase 2: Resolve collisions (two robots targeting same cell)
    const pendingPositions = new Map<string, string[]>();
    for (const state of states) {
      if (state.crashed) continue;
      const key = `${state.pendingRow},${state.pendingCol}`;
      if (!pendingPositions.has(key)) pendingPositions.set(key, []);
      pendingPositions.get(key)!.push(state.playerId);
    }

    for (const [, playerIds] of pendingPositions) {
      if (playerIds.length > 1) {
        // Collision — all colliding robots bounce back to their original positions
        for (const pid of playerIds) {
          const state = states.find(s => s.playerId === pid)!;
          // Only bounce if they were actually trying to move
          if (state.pendingRow !== state.row || state.pendingCol !== state.col) {
            events.push({ type: 'collision', playerId: pid, row: state.pendingRow, col: state.pendingCol });
            state.pendingRow = state.row;
            state.pendingCol = state.col;
          }
        }
      }
    }

    // Phase 3: Commit moves
    for (const state of states) {
      if (state.crashed) continue;
      state.row = state.pendingRow;
      state.col = state.pendingCol;
    }

    // Phase 4: Collect gems
    for (const state of states) {
      if (state.crashed) continue;
      const cell = gridCopy[state.row][state.col];
      if (cell.type === 'gem' || cell.type === 'bonusStar' || (cell.type === 'hiddenGem' && cell.revealed)) {
        const value = cell.gemValue || 1;
        gemsCollected[state.playerId] += value;
        events.push({ type: 'gemCollected', playerId: state.playerId, row: state.row, col: state.col, value });
        gridCopy[state.row][state.col] = { ...cell, type: 'empty', gemValue: undefined };
      }
    }

    // Phase 5: Handle portals
    for (const state of states) {
      if (state.crashed) continue;
      const cell = gridCopy[state.row][state.col];
      if (cell.type === 'portal' && cell.portalPairId) {
        const exit = findPortalExit(gridCopy, cell.portalPairId, state.row, state.col);
        if (exit) {
          // Check nobody is at the exit
          const exitOccupied = states.some(s => !s.crashed && s.playerId !== state.playerId && s.row === exit.row && s.col === exit.col);
          if (!exitOccupied) {
            state.row = exit.row;
            state.col = exit.col;
            state.pendingRow = exit.row;
            state.pendingCol = exit.col;
            events.push({ type: 'portal', playerId: state.playerId, row: exit.row, col: exit.col });
          }
        }
      }
    }

    // Phase 6: Handle conveyors
    for (const state of states) {
      if (state.crashed) continue;
      const cell = gridCopy[state.row][state.col];
      if (cell.type === 'conveyor' && cell.conveyorDir) {
        const dest = getForwardCell(state.row, state.col, cell.conveyorDir);
        if (isWalkable(gridCopy, dest.row, dest.col)) {
          const destOccupied = states.some(s => !s.crashed && s.playerId !== state.playerId && s.row === dest.row && s.col === dest.col);
          if (!destOccupied) {
            state.row = dest.row;
            state.col = dest.col;
            state.pendingRow = dest.row;
            state.pendingCol = dest.col;
            events.push({ type: 'conveyor', playerId: state.playerId, row: dest.row, col: dest.col });
          }
        }
      }
    }

    // Phase 7: Handle oil slicks (slide 1 extra cell in movement direction)
    for (const state of states) {
      if (state.crashed) continue;
      const cell = gridCopy[state.row][state.col];
      if (cell.type === 'oilSlick') {
        const slideDest = getForwardCell(state.row, state.col, state.facing);
        if (isWalkable(gridCopy, slideDest.row, slideDest.col)) {
          const slideOccupied = states.some(s => !s.crashed && s.playerId !== state.playerId && s.row === slideDest.row && s.col === slideDest.col);
          if (!slideOccupied) {
            state.row = slideDest.row;
            state.col = slideDest.col;
            state.pendingRow = slideDest.row;
            state.pendingCol = slideDest.col;
            events.push({ type: 'oilSlide', playerId: state.playerId, row: slideDest.row, col: slideDest.col });
          }
        }
      }
    }

    // Record frame
    frames.push({
      robots: states.map(s => ({ playerId: s.playerId, row: s.row, col: s.col, facing: s.facing, crashed: s.crashed })),
      events,
    });
  }

  return { frames, finalGrid: gridCopy, gemsCollected };
}

// Calculate round bonuses
export function calculateBonuses(
  gemsCollected: Record<string, number>,
  robots: Robot[],
  _grid: GridCell[][],
): { playerId: string; bonus: string; points: number }[] {
  const bonuses: { playerId: string; bonus: string; points: number }[] = [];
  const playerIds = Object.keys(gemsCollected);

  // Most gems collected this round
  let maxGems = 0;
  let maxGemPlayer = '';
  for (const pid of playerIds) {
    if (gemsCollected[pid] > maxGems) {
      maxGems = gemsCollected[pid];
      maxGemPlayer = pid;
    }
  }
  if (maxGems > 0) {
    bonuses.push({ playerId: maxGemPlayer, bonus: '👑 Top Collector', points: 5 });
  }

  // Efficiency bonus: shortest program that collected gems
  let minProgramLen = Infinity;
  let efficientPlayer = '';
  for (const robot of robots) {
    if (gemsCollected[robot.playerId] > 0 && robot.program.length < minProgramLen) {
      minProgramLen = robot.program.length;
      efficientPlayer = robot.playerId;
    }
  }
  if (efficientPlayer && minProgramLen < Infinity) {
    bonuses.push({ playerId: efficientPlayer, bonus: '⚡ Efficient Coder', points: 3 });
  }

  // Collected exactly 10 points
  for (const pid of playerIds) {
    if (gemsCollected[pid] === 10) {
      bonuses.push({ playerId: pid, bonus: '🎯 Perfect 10', points: 5 });
    }
  }

  // Collected a prime number total
  const isPrime = (n: number) => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) { if (n % i === 0) return false; }
    return true;
  };
  for (const pid of playerIds) {
    if (gemsCollected[pid] > 1 && isPrime(gemsCollected[pid])) {
      bonuses.push({ playerId: pid, bonus: '🔢 Prime Score', points: 2 });
    }
  }

  return bonuses;
}
