// ===== Code Racers — Type Definitions =====

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GamePhase = 'menu' | 'lobby' | 'countdown' | 'planning' | 'executing' | 'roundSummary' | 'gameover';
export type PeerRole = 'host' | 'guest';
export type Direction = 'up' | 'down' | 'left' | 'right';

export type BlockType =
  | 'move'
  | 'turnLeft'
  | 'turnRight'
  | 'loop2'
  | 'loop3'
  | 'ifGemAhead'
  | 'ifBlocked'
  | 'jump'
  | 'push'
  | 'scan'
  | 'boost';

export interface InstructionBlock {
  id: string;
  type: BlockType;
}

export type CellType =
  | 'empty'
  | 'wall'
  | 'gem'
  | 'hiddenGem'
  | 'portal'
  | 'conveyor'
  | 'oilSlick'
  | 'bonusStar'
  | 'rechargePad';

export interface GridCell {
  row: number;
  col: number;
  type: CellType;
  gemValue?: number;
  conveyorDir?: Direction;
  portalPairId?: string;
  revealed?: boolean;
}

export interface Robot {
  playerId: string;
  row: number;
  col: number;
  facing: Direction;
  program: BlockType[];
  crashed: boolean;
}

export interface CRPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  totalScore: number;
  roundScore: number;
  gemsCollected: number;
  bonusSlots: number;
  programSubmitted: boolean;
  isLocal: boolean;
  peerId?: string;
}

export interface RoundBonus {
  playerId: string;
  bonus: string;
  points: number;
}

export interface ExecutionFrame {
  robots: { playerId: string; row: number; col: number; facing: Direction; crashed: boolean }[];
  events: ExecutionEvent[];
}

export interface ExecutionEvent {
  type: 'gemCollected' | 'collision' | 'push' | 'scan' | 'portal' | 'conveyor' | 'oilSlide' | 'wallBump' | 'boost';
  playerId: string;
  row: number;
  col: number;
  value?: number;
  targetPlayerId?: string;
}

export interface RoundState {
  roundNumber: number;
  totalRounds: number;
  grid: GridCell[][];
  robots: Robot[];
  phase: 'planning' | 'executing' | 'summary';
  timeLeft: number;
  executionStep: number;
  totalSteps: number;
  executionFrames: ExecutionFrame[];
  roundBonuses: RoundBonus[];
  gemsCollectedThisRound: Record<string, number>;
}

export interface CRSettings {
  difficulty: Difficulty;
  totalRounds: number;
  planningTime: number;
  enableSound: boolean;
  gridSize: number;
  instructionSlots: number;
}

export interface GameState {
  players: CRPlayer[];
  roundState: RoundState;
  phase: GamePhase;
  settings: CRSettings;
}

// WebRTC message types
export type CRMessageType =
  | 'player-join'
  | 'player-update'
  | 'lobby-settings'
  | 'game-start'
  | 'game-state'
  | 'program-submitted'
  | 'all-ready'
  | 'execution-step'
  | 'round-end'
  | 'next-round'
  | 'game-over'
  | 'return-lobby'
  | 'toast';

export interface CRPeerMessage {
  type: CRMessageType;
  payload: unknown;
  senderId: string;
  timestamp: number;
}

// Difficulty configs
export const DIFFICULTY_CONFIG: Record<Difficulty, {
  gridSize: number;
  instructionSlots: number;
  planningTime: number;
  rounds: number;
  availableBlocks: BlockType[];
  hiddenGemPercent: number;
  hasConveyors: boolean;
  hasPortals: boolean;
  hasOilSlicks: boolean;
}> = {
  easy: {
    gridSize: 6,
    instructionSlots: 4,
    planningTime: 45,
    rounds: 8,
    availableBlocks: ['move', 'turnLeft', 'turnRight', 'loop2'],
    hiddenGemPercent: 0,
    hasConveyors: false,
    hasPortals: false,
    hasOilSlicks: false,
  },
  medium: {
    gridSize: 7,
    instructionSlots: 6,
    planningTime: 35,
    rounds: 10,
    availableBlocks: ['move', 'turnLeft', 'turnRight', 'loop2', 'loop3', 'ifGemAhead', 'ifBlocked', 'jump'],
    hiddenGemPercent: 0.2,
    hasConveyors: true,
    hasPortals: true,
    hasOilSlicks: false,
  },
  hard: {
    gridSize: 8,
    instructionSlots: 7,
    planningTime: 25,
    rounds: 12,
    availableBlocks: ['move', 'turnLeft', 'turnRight', 'loop2', 'loop3', 'ifGemAhead', 'ifBlocked', 'jump', 'push', 'scan', 'boost'],
    hiddenGemPercent: 0.4,
    hasConveyors: true,
    hasPortals: true,
    hasOilSlicks: true,
  },
};

// Block metadata for UI
export const BLOCK_INFO: Record<BlockType, { label: string; icon: string; color: string; category: string; description: string }> = {
  move:       { label: 'MOVE',       icon: '➡️', color: '#00e676', category: 'basic',     description: 'Move 1 step forward' },
  turnLeft:   { label: 'LEFT',       icon: '↩️', color: '#00e5ff', category: 'basic',     description: 'Turn 90° left' },
  turnRight:  { label: 'RIGHT',      icon: '↪️', color: '#00e5ff', category: 'basic',     description: 'Turn 90° right' },
  loop2:      { label: 'LOOP ×2',    icon: '🔄', color: '#a259ff', category: 'loop',      description: 'Repeat next block 2×' },
  loop3:      { label: 'LOOP ×3',    icon: '🔁', color: '#a259ff', category: 'loop',      description: 'Repeat next block 3×' },
  ifGemAhead: { label: 'IF GEM',     icon: '💎', color: '#ffea00', category: 'condition', description: 'If gem ahead, do next' },
  ifBlocked:  { label: 'IF WALL',    icon: '🧱', color: '#ffea00', category: 'condition', description: 'If blocked, do next' },
  jump:       { label: 'JUMP',       icon: '⬆️', color: '#ff9500', category: 'special',   description: 'Leap over 1 cell' },
  push:       { label: 'PUSH',       icon: '👊', color: '#ff3d3d', category: 'special',   description: 'Push adjacent robot' },
  scan:       { label: 'SCAN',       icon: '📡', color: '#00e5ff', category: 'special',   description: 'Reveal hidden gems 3×3' },
  boost:      { label: 'BOOST',      icon: '⚡', color: '#ff9500', category: 'special',   description: 'Move 2 cells forward' },
};

export const ROBOT_AVATARS = ['🤖', '🦾', '🛸', '🔧', '⚙️'];
export const PLAYER_COLORS = ['#ff3d3d', '#00e5ff', '#a259ff', '#00e676', '#ff9500'];

export const MAX_PLAYERS = 5;
export const MIN_PLAYERS = 2;
