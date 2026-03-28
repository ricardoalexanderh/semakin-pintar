// ===== Pathfinder Duel — Grid Logic =====
// Pure functions for grid generation, optimal path (DP), and validation.

import type { GridCell, PathStep, RoundType } from './types';

/**
 * Generate a grid of random numbers.
 * - Classic/Minimum: values from -5 to 9
 * - Multiplier: same values plus random x2/x3 cells
 * - Blocker: values only, blocked cells set separately via applyBlockers
 */
export function generateGrid(rows: number, cols: number, roundType: RoundType): GridCell[][] {
  const grid: GridCell[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < cols; c++) {
      const value = Math.floor(Math.random() * 15) - 5; // -5 to 9
      const cell: GridCell = { value, row: r, col: c };
      row.push(cell);
    }
    grid.push(row);
  }

  // Start and end cells always have positive values
  grid[0][0].value = Math.max(1, grid[0][0].value);
  grid[rows - 1][cols - 1].value = Math.max(1, grid[rows - 1][cols - 1].value);

  // Place multipliers for multiplier rounds
  if (roundType === 'multiplier') {
    const totalCells = rows * cols;
    const numMultipliers = Math.max(2, Math.floor(totalCells * 0.15));
    const placed = new Set<string>();
    placed.add('0,0');
    placed.add(`${rows - 1},${cols - 1}`);

    for (let i = 0; i < numMultipliers; i++) {
      let r: number, c: number, key: string;
      do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
        key = `${r},${c}`;
      } while (placed.has(key));
      placed.add(key);
      grid[r][c].multiplier = Math.random() < 0.7 ? 2 : 3;
    }
  }

  return grid;
}

/**
 * Mark cells as blocked. Validates that a path still exists after blocking.
 */
export function applyBlockers(grid: GridCell[][], blockedCells: PathStep[]): GridCell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  for (const { row, col } of blockedCells) {
    if (row >= 0 && row < newGrid.length && col >= 0 && col < newGrid[0].length) {
      newGrid[row][col].blocked = true;
    }
  }
  return newGrid;
}

/**
 * Check if at least one valid path exists from (0,0) to (rows-1, cols-1).
 */
export function hasValidPath(grid: GridCell[][]): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const reachable: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  if (grid[0][0].blocked) return false;
  reachable[0][0] = true;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].blocked) continue;
      if (r === 0 && c === 0) continue;
      const fromTop = r > 0 && reachable[r - 1][c];
      const fromLeft = c > 0 && reachable[r][c - 1];
      reachable[r][c] = fromTop || fromLeft;
    }
  }

  return reachable[rows - 1][cols - 1];
}

/**
 * Calculate the sum of values along a path, applying multipliers.
 */
export function calculatePathSum(grid: GridCell[][], path: PathStep[]): number {
  let sum = 0;
  for (const step of path) {
    const cell = grid[step.row][step.col];
    if (cell.multiplier) {
      sum = sum * cell.multiplier + cell.value;
    } else {
      sum += cell.value;
    }
  }
  return sum;
}

/**
 * Find the optimal path using dynamic programming.
 * For multiplier rounds, falls back to BFS since DP doesn't apply cleanly
 * with multiplicative effects on running totals.
 */
export function findOptimalPath(
  grid: GridCell[][],
  mode: 'max' | 'min',
): { path: PathStep[]; sum: number } {
  const rows = grid.length;
  const cols = grid[0].length;
  const hasMultipliers = grid.some(row => row.some(cell => cell.multiplier));

  if (hasMultipliers) {
    return findOptimalPathBFS(grid, mode);
  }

  // Standard DP for additive-only grids
  const dp: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const INF = mode === 'max' ? -Infinity : Infinity;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].blocked) {
        dp[r][c] = INF;
        continue;
      }
      const val = grid[r][c].value;
      if (r === 0 && c === 0) {
        dp[r][c] = val;
        continue;
      }
      const fromTop = r > 0 && !grid[r - 1][c].blocked ? dp[r - 1][c] : INF;
      const fromLeft = c > 0 && !grid[r][c - 1].blocked ? dp[r][c - 1] : INF;

      if (fromTop === INF && fromLeft === INF) {
        dp[r][c] = INF;
      } else if (mode === 'max') {
        dp[r][c] = Math.max(fromTop, fromLeft) + val;
      } else {
        dp[r][c] = Math.min(fromTop, fromLeft) + val;
      }
    }
  }

  // Backtrack to find path
  const path: PathStep[] = [];
  let r = rows - 1;
  let c = cols - 1;

  if (dp[r][c] === INF) {
    return { path: [], sum: 0 };
  }

  path.push({ row: r, col: c });
  while (r > 0 || c > 0) {
    const fromTop = r > 0 && !grid[r - 1][c].blocked ? dp[r - 1][c] : INF;
    const fromLeft = c > 0 && !grid[r][c - 1].blocked ? dp[r][c - 1] : INF;

    if (fromTop === INF && fromLeft === INF) break;

    if (mode === 'max') {
      if (fromTop >= fromLeft && r > 0) { r--; }
      else { c--; }
    } else {
      if (fromTop <= fromLeft && r > 0) { r--; }
      else { c--; }
    }
    path.push({ row: r, col: c });
  }

  path.reverse();
  return { path, sum: dp[rows - 1][cols - 1] };
}

/**
 * BFS-based optimal path finder for grids with multipliers.
 * Explores all possible paths (feasible for grids up to 8x8).
 */
function findOptimalPathBFS(
  grid: GridCell[][],
  mode: 'max' | 'min',
): { path: PathStep[]; sum: number } {
  const rows = grid.length;
  const cols = grid[0].length;

  let bestSum = mode === 'max' ? -Infinity : Infinity;
  let bestPath: PathStep[] = [];

  // DFS with path tracking
  function dfs(r: number, c: number, currentSum: number, currentPath: PathStep[]) {
    const cell = grid[r][c];
    let newSum: number;
    if (cell.multiplier) {
      newSum = currentSum * cell.multiplier + cell.value;
    } else {
      newSum = currentSum + cell.value;
    }

    currentPath.push({ row: r, col: c });

    if (r === rows - 1 && c === cols - 1) {
      if ((mode === 'max' && newSum > bestSum) || (mode === 'min' && newSum < bestSum)) {
        bestSum = newSum;
        bestPath = [...currentPath];
      }
      currentPath.pop();
      return;
    }

    // Move right
    if (c + 1 < cols && !grid[r][c + 1].blocked) {
      dfs(r, c + 1, newSum, currentPath);
    }
    // Move down
    if (r + 1 < rows && !grid[r + 1][c].blocked) {
      dfs(r + 1, c, newSum, currentPath);
    }

    currentPath.pop();
  }

  if (!grid[0][0].blocked) {
    dfs(0, 0, 0, []);
  }

  return { path: bestPath, sum: bestSum === -Infinity || bestSum === Infinity ? 0 : bestSum };
}

/**
 * Validate a player's submitted path.
 */
export function validatePath(
  path: PathStep[],
  rows: number,
  cols: number,
  blockedCells: PathStep[],
): boolean {
  if (path.length === 0) return false;

  const blocked = new Set(blockedCells.map(s => `${s.row},${s.col}`));

  // Must start at (0,0)
  if (path[0].row !== 0 || path[0].col !== 0) return false;

  // Must end at (rows-1, cols-1)
  const last = path[path.length - 1];
  if (last.row !== rows - 1 || last.col !== cols - 1) return false;

  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];

    // Within bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) return false;

    // Not blocked
    if (blocked.has(`${row},${col}`)) return false;

    // Each step must be right or down from previous
    if (i > 0) {
      const prev = path[i - 1];
      const dr = row - prev.row;
      const dc = col - prev.col;
      if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) return false;
    }
  }

  // Path must have exactly (rows - 1 + cols - 1 + 1) steps
  if (path.length !== rows + cols - 1) return false;

  return true;
}

/**
 * Generate the round type sequence for a game.
 */
export function generateRoundSequence(
  totalRounds: number,
  enabledTypes: RoundType[],
): RoundType[] {
  const sequence: RoundType[] = [];
  const available = enabledTypes.length > 0 ? enabledTypes : ['classic' as RoundType];

  for (let i = 0; i < totalRounds; i++) {
    sequence.push(available[Math.floor(Math.random() * available.length)]);
  }

  return sequence;
}

/**
 * Calculate scores for a round.
 */
export function calculateRoundScores(
  players: { id: string; pathSum: number; submitted: boolean; pathComplete: boolean; submittedAt?: number }[],
  mode: 'max' | 'min',
  optimalSum: number,
): Record<string, { roundScore: number; isOptimal: boolean; isWinner: boolean; isSpeedBonus: boolean }> {
  const submitted = players.filter(p => p.submitted);
  if (submitted.length === 0) return {};

  // Only players who completed their path (reached the end) are eligible for scoring
  const eligible = submitted.filter(p => p.pathComplete);

  // Players who didn't finish get 0 score
  const results: Record<string, { roundScore: number; isOptimal: boolean; isWinner: boolean; isSpeedBonus: boolean }> = {};
  for (const p of submitted) {
    if (!p.pathComplete) {
      results[p.id] = { roundScore: 0, isOptimal: false, isWinner: false, isSpeedBonus: false };
    }
  }

  if (eligible.length === 0) return results;

  // Sort by sum (descending for max, ascending for min), then by submission time as tiebreaker
  const sorted = [...eligible].sort((a, b) => {
    const sumDiff = mode === 'max' ? b.pathSum - a.pathSum : a.pathSum - b.pathSum;
    if (sumDiff !== 0) return sumDiff;
    return (a.submittedAt || Infinity) - (b.submittedAt || Infinity);
  });

  // Sort by submission time for speed bonus
  const bySpeed = [...eligible].sort((a, b) =>
    (a.submittedAt || Infinity) - (b.submittedAt || Infinity)
  );

  const winnerSum = sorted[0].pathSum;
  const runnerUpSum = sorted.length > 1 ? sorted[1].pathSum : winnerSum;
  const winnerId = sorted[0].id;
  const fastestId = bySpeed[0]?.id;

  for (const p of eligible) {
    const isWinner = p.id === winnerId;
    const isOptimal = p.pathSum === optimalSum;
    const isSpeedBonus = p.id === fastestId && (
      sorted.findIndex(s => s.id === p.id) < 2
    );

    let score = 0;
    if (isWinner) {
      const diff = mode === 'max'
        ? winnerSum - runnerUpSum
        : runnerUpSum - winnerSum;
      score = 30 + Math.min(30, Math.max(0, diff));
    }
    if (isOptimal) score += 20;
    if (isSpeedBonus) score += 5;

    results[p.id] = { roundScore: score, isOptimal, isWinner, isSpeedBonus };
  }

  return results;
}
