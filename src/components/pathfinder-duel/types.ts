// ===== Pathfinder Duel — Type Definitions =====

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GamePhase = 'menu' | 'lobby' | 'countdown' | 'playing' | 'reveal' | 'gameover';
export type RoundType = 'classic' | 'minimum' | 'multiplier' | 'hidden';

export interface GridCell {
  value: number;
  multiplier?: 2 | 3;
  blocked?: boolean;
  row: number;
  col: number;
}

export interface PathStep {
  row: number;
  col: number;
}

export interface PDPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  totalScore: number;
  roundScore: number;
  path: PathStep[];
  submitted: boolean;
  submittedAt?: number;
  pathSum: number;
  isLocal: boolean;
  peerId?: string;
  isWinner?: boolean;
  isBlockerPlacer?: boolean;
}

export interface RoundState {
  roundNumber: number;
  totalRounds: number;
  roundType: RoundType;
  grid: GridCell[][];
  timeLeft: number;
  maxTime: number;
  allSubmitted: boolean;
  optimalPath: PathStep[];
  optimalSum: number;
  blockedCells: PathStep[];
  phase: 'drawing' | 'placing-blockers' | 'submitted';
}

export interface PDSettings {
  difficulty: Difficulty;
  totalRounds: number;
  enableSound: boolean;
  enableBlockers: boolean;
  roundTypes: RoundType[];
}

export type PDMessageType =
  | 'player-join'
  | 'player-update'
  | 'game-start'
  | 'game-state'
  | 'path-submitted'
  | 'blocker-placed'
  | 'lobby-settings'
  | 'return-lobby'
  | 'next-round';

export interface PDPeerMessage {
  type: PDMessageType;
  payload: unknown;
  senderId: string;
  timestamp: number;
}

// Difficulty config
export const DIFFICULTY_CONFIG: Record<Difficulty, { gridSize: number; timer: number }> = {
  easy:   { gridSize: 4, timer: 30 },
  medium: { gridSize: 6, timer: 25 },
  hard:   { gridSize: 8, timer: 20 },
};

export const AVATARS = [
  '\uD83D\uDC3C', '\uD83E\uDD8A', '\uD83D\uDC2F', '\uD83E\uDD81',
  '\uD83D\uDC38', '\uD83D\uDC19', '\uD83E\uDD8B', '\uD83E\uDD84',
];

export const PLAYER_COLORS = [
  '#22c55e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#ec4899',
];
