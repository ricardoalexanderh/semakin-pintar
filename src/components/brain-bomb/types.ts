// ===== Brain Bomb — Type Definitions =====

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'sudden';
export type GamePhase = 'menu' | 'lobby' | 'countdown' | 'playing' | 'chainReaction' | 'gameover';
export type PeerRole = 'host' | 'guest';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  lives: number;
  score: number;
  eliminated: boolean;
  sabotages: number;
  powerups: Powerups;
  usedPowerupThisRound: boolean;
  isLocal: boolean;
  peerId?: string;
  shieldActive?: boolean;
  timePenalty?: number;
  blindNextRound?: boolean;
  decoyNextRound?: boolean;
  savedTime?: number;
}

export interface Powerups {
  shield: number;
  freeze: number;
  clone: number;
}

export interface Question {
  q: string;
  a: string[];
  correct: number;
  diff: Difficulty;
  memory?: boolean;
}

export interface SubCategoryDef {
  icon: string;
  label: string;
  color: string;
  subs: [string, string][];
}

export interface LobbySettings {
  difficulty: Difficulty;
  mode: GameMode;
  timer: number;
  enablePowerups: boolean;
  enableChainReaction: boolean;
  enableSabotage: boolean;
  enableSound: boolean;
  enableProgressiveDifficulty: boolean;
  activeSubs: Record<string, boolean>;
}

export interface GameState {
  players: Player[];
  currentPlayerIdx: number;
  timeLeft: number;
  maxTime: number;
  currentQuestion: Question | null;
  answered: boolean;
  round: number;
  phase: GamePhase;
  settings: LobbySettings;
  bombHolderName: string;
}

// WebRTC message types
export type PeerMessageType =
  | 'player-join'
  | 'player-update'
  | 'game-start'
  | 'game-state'
  | 'answer-submitted'
  | 'powerup-used'
  | 'chain-answer'
  | 'sabotage-applied'
  | 'clone-target'
  | 'toast'
  | 'lobby-settings'
  | 'game-over'
  | 'return-lobby';

export interface PeerMessage {
  type: PeerMessageType;
  payload: unknown;
  senderId: string;
  timestamp: number;
}

// Difficulty config
export const DIFFICULTY_CONFIG: Record<Difficulty, { timer: number; lives: number }> = {
  easy:   { timer: 20, lives: 4 },
  medium: { timer: 15, lives: 3 },
  hard:   { timer: 10, lives: 2 },
};

export const AVATARS = [
  '\uD83D\uDC3C', '\uD83E\uDD8A', '\uD83D\uDC2F', '\uD83E\uDD81',
  '\uD83D\uDC38', '\uD83D\uDC19', '\uD83E\uDD8B', '\uD83E\uDD84',
];

export const PLAYER_COLORS = [
  '#ff3d3d', '#ff9500', '#ffea00', '#00e676',
  '#00e5ff', '#a259ff', '#ff6b9d', '#64ffda',
];
