// ===== Code Racers — Grid Generation =====

import type { GridCell, CellType, Direction, Robot, Difficulty, DIFFICULTY_CONFIG } from './types';

type DiffConfig = (typeof DIFFICULTY_CONFIG)[Difficulty];

// Seeded random for reproducible grids (host shares seed)
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateGrid(
  size: number,
  config: DiffConfig,
  round: number,
  playerCount: number,
): GridCell[][] {
  const seed = round * 9973 + size * 31 + playerCount * 7;
  const rng = mulberry32(seed);

  const grid: GridCell[][] = [];
  for (let r = 0; r < size; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < size; c++) {
      row.push({ row: r, col: c, type: 'empty' });
    }
    grid.push(row);
  }

  // Place walls (~12-18% of cells, avoiding spawn positions and center)
  const spawnPositions = getSpawnPositions(size, playerCount);
  const spawnSet = new Set(spawnPositions.map(p => `${p.row},${p.col}`));
  const wallCount = Math.floor(size * size * (0.12 + rng() * 0.06));

  let wallsPlaced = 0;
  const attempts = wallCount * 5;
  for (let i = 0; i < attempts && wallsPlaced < wallCount; i++) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    const key = `${r},${c}`;
    if (spawnSet.has(key)) continue;
    if (grid[r][c].type !== 'empty') continue;
    // Don't wall the center area too much
    const centerDist = Math.abs(r - size / 2) + Math.abs(c - size / 2);
    if (centerDist < 2 && rng() < 0.7) continue;
    grid[r][c].type = 'wall';
    wallsPlaced++;
  }

  // Place gems (visible + hidden)
  const totalGems = Math.floor(size * size * 0.15) + round;
  const hiddenCount = Math.floor(totalGems * config.hiddenGemPercent);
  const visibleCount = totalGems - hiddenCount;

  placeItems(grid, 'gem', visibleCount, spawnSet, rng, size);
  placeItems(grid, 'hiddenGem', hiddenCount, spawnSet, rng, size);

  // Assign gem values
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].type === 'gem' || grid[r][c].type === 'hiddenGem') {
        const v = rng();
        grid[r][c].gemValue = v < 0.45 ? 1 : v < 0.75 ? 2 : v < 0.92 ? 3 : 5;
      }
    }
  }

  // Place bonus star (1 per round, in a somewhat central but risky position)
  const centerR = Math.floor(size / 2);
  const centerC = Math.floor(size / 2);
  if (grid[centerR][centerC].type === 'empty') {
    grid[centerR][centerC].type = 'bonusStar';
    grid[centerR][centerC].gemValue = 10;
  }

  // Place recharge pad (1-2 per round)
  placeItems(grid, 'rechargePad', 1 + (round > 4 ? 1 : 0), spawnSet, rng, size);

  // Place conveyors (medium+)
  if (config.hasConveyors) {
    const conveyorCount = 2 + Math.floor(rng() * 3);
    const dirs: Direction[] = ['up', 'down', 'left', 'right'];
    for (let i = 0; i < conveyorCount; i++) {
      const pos = findEmptyCell(grid, spawnSet, rng, size);
      if (pos) {
        grid[pos.row][pos.col].type = 'conveyor';
        grid[pos.row][pos.col].conveyorDir = dirs[Math.floor(rng() * 4)];
      }
    }
  }

  // Place portals (medium+, always in pairs)
  if (config.hasPortals) {
    const portalPairCount = 1;
    for (let p = 0; p < portalPairCount; p++) {
      const a = findEmptyCell(grid, spawnSet, rng, size);
      const b = findEmptyCell(grid, spawnSet, rng, size);
      if (a && b && (a.row !== b.row || a.col !== b.col)) {
        const pairId = `portal_${p}`;
        grid[a.row][a.col].type = 'portal';
        grid[a.row][a.col].portalPairId = pairId;
        grid[b.row][b.col].type = 'portal';
        grid[b.row][b.col].portalPairId = pairId;
      }
    }
  }

  // Place oil slicks (hard only)
  if (config.hasOilSlicks) {
    placeItems(grid, 'oilSlick', 2 + Math.floor(rng() * 2), spawnSet, rng, size);
  }

  return grid;
}

function placeItems(
  grid: GridCell[][],
  type: CellType,
  count: number,
  spawnSet: Set<string>,
  rng: () => number,
  size: number,
) {
  let placed = 0;
  const maxAttempts = count * 10;
  for (let i = 0; i < maxAttempts && placed < count; i++) {
    const pos = findEmptyCell(grid, spawnSet, rng, size);
    if (pos) {
      grid[pos.row][pos.col].type = type;
      if (type === 'hiddenGem') {
        grid[pos.row][pos.col].revealed = false;
      }
      placed++;
    }
  }
}

function findEmptyCell(
  grid: GridCell[][],
  spawnSet: Set<string>,
  rng: () => number,
  size: number,
): { row: number; col: number } | null {
  for (let i = 0; i < 50; i++) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    if (grid[r][c].type === 'empty' && !spawnSet.has(`${r},${c}`)) {
      return { row: r, col: c };
    }
  }
  return null;
}

export function getSpawnPositions(size: number, playerCount: number): { row: number; col: number; facing: Direction }[] {
  // Place robots in corners and edges, evenly spaced
  const positions: { row: number; col: number; facing: Direction }[] = [
    { row: 0, col: 0, facing: 'right' },
    { row: size - 1, col: size - 1, facing: 'left' },
    { row: 0, col: size - 1, facing: 'down' },
    { row: size - 1, col: 0, facing: 'up' },
    { row: Math.floor(size / 2), col: 0, facing: 'right' },
  ];
  return positions.slice(0, playerCount);
}

export function createRobots(players: { id: string }[], size: number): Robot[] {
  const spawns = getSpawnPositions(size, players.length);
  return players.map((p, i) => ({
    playerId: p.id,
    row: spawns[i].row,
    col: spawns[i].col,
    facing: spawns[i].facing,
    program: [],
    crashed: false,
  }));
}

export function findPortalExit(grid: GridCell[][], portalPairId: string, entryRow: number, entryCol: number): { row: number; col: number } | null {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.type === 'portal' && cell.portalPairId === portalPairId && (cell.row !== entryRow || cell.col !== entryCol)) {
        return { row: cell.row, col: cell.col };
      }
    }
  }
  return null;
}

export function getForwardCell(row: number, col: number, facing: Direction, steps = 1): { row: number; col: number } {
  switch (facing) {
    case 'up': return { row: row - steps, col };
    case 'down': return { row: row + steps, col };
    case 'left': return { row, col: col - steps };
    case 'right': return { row, col: col + steps };
  }
}

export function turnDirection(facing: Direction, turn: 'left' | 'right'): Direction {
  const dirs: Direction[] = ['up', 'right', 'down', 'left'];
  const idx = dirs.indexOf(facing);
  if (turn === 'right') return dirs[(idx + 1) % 4];
  return dirs[(idx + 3) % 4];
}

export function isInBounds(row: number, col: number, size: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

export function isWalkable(grid: GridCell[][], row: number, col: number): boolean {
  if (!isInBounds(row, col, grid.length)) return false;
  return grid[row][col].type !== 'wall';
}
