import React, { useState, useEffect, useCallback, useRef } from 'react';
import { trackGameEvent, trackButtonClick } from '../utils/analytics';
import { useGameState } from '../hooks/useGameState';

const BOARD_WIDTH = 6;
const BOARD_HEIGHT = 12;
const CELL_SIZE = 45;

interface NumberPuyo {
  value: number;
  id: string;
  x: number;
  y: number;
  isSpecial?: boolean;
  specialType?: 'bomb' | 'lightning';
  color?: string;
}

interface FallingPair {
  puyo1: NumberPuyo;
  puyo2: NumberPuyo;
  rotation: number;
}

interface Equation {
  id: string;
  operation: '+' | '-' | '×' | '÷';
  result: number;
  solved: boolean;
  value1?: number;
  value2?: number;
  solvedTime?: number;
}

interface MatchEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  text: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'star' | 'circle' | 'sparkle';
}

interface GameState {
  board: (NumberPuyo | null)[][];
  currentPair: FallingPair | null;
  nextPair: FallingPair | null;
  equations: Equation[];
  score: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
  matchEffects: MatchEffect[];
  particles: Particle[];
  chainCount: number;
  showInstructions: boolean;
  gameStarted: boolean;
  countdown: number;
}

const createEmptyBoard = (): (NumberPuyo | null)[][] => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

const generateRandomNumber = (min: number = 1, max: number = 9): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

const generatePuyoPair = (): FallingPair => {
  const id1 = generateUniqueId();
  const id2 = generateUniqueId();
  
  const specialChance1 = Math.random();
  const specialChance2 = Math.random();
  
  const color1 = `hsl(${Math.random() * 360}, 70%, 70%)`;
  const color2 = `hsl(${Math.random() * 360}, 70%, 70%)`;
  
  const puyo1: NumberPuyo = {
    value: specialChance1 < 0.05 ? (specialChance1 < 0.025 ? -1 : -2) : generateRandomNumber(),
    id: id1,
    x: 2,
    y: 0,
    color: color1
  };
  
  const puyo2: NumberPuyo = {
    value: specialChance2 < 0.05 ? (specialChance2 < 0.025 ? -1 : -2) : generateRandomNumber(),
    id: id2,
    x: 3,
    y: 0,
    color: color2
  };
  
  if (puyo1.value === -1) {
    puyo1.isSpecial = true;
    puyo1.specialType = 'bomb';
    puyo1.color = '#FF6B6B';
  } else if (puyo1.value === -2) {
    puyo1.isSpecial = true;
    puyo1.specialType = 'lightning';
    puyo1.color = '#4ECDC4';
  }
  
  if (puyo2.value === -1) {
    puyo2.isSpecial = true;
    puyo2.specialType = 'bomb';
    puyo2.color = '#FF6B6B';
  } else if (puyo2.value === -2) {
    puyo2.isSpecial = true;
    puyo2.specialType = 'lightning';
    puyo2.color = '#4ECDC4';
  }
  
  return { puyo1, puyo2, rotation: 0 };
};

const generateEquations = (level: number): Equation[] => {
  const equations: Equation[] = [];
  const count = Math.min(3 + Math.floor(level / 3), 5);
  
  // Valid multiplication results using single digits 1-9
  const validMultiplications = [
    1, 2, 3, 4, 5, 6, 7, 8, 9,      // 1×1 to 1×9
    4, 6, 8, 10, 12, 14, 16, 18,    // 2×2 to 2×9 (excluding 2×1=2 already counted)
    9, 12, 15, 18, 21, 24, 27,      // 3×3 to 3×9 (excluding duplicates)
    16, 20, 24, 28, 32, 36,         // 4×4 to 4×9 (excluding duplicates)
    25, 30, 35, 40, 45,             // 5×5 to 5×9 (excluding duplicates)
    36, 42, 48, 54,                 // 6×6 to 6×9 (excluding duplicates)
    49, 56, 63,                     // 7×7 to 7×9 (excluding duplicates)
    64, 72,                         // 8×8 to 8×9 (excluding duplicates)
    81                              // 9×9
  ];
  
  for (let i = 0; i < count; i++) {
    let operations: ('+' | '-' | '×' | '÷')[] = ['+'];
    
    if (level >= 3) operations = ['+', '-'];
    if (level >= 6) operations = ['+', '-', '×'];
    if (level >= 9) operations = ['+', '-', '×', '÷'];
    
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let result: number;
    
    switch (operation) {
      case '+':
        result = generateRandomNumber(2, 18);
        break;
      case '-':
        result = generateRandomNumber(1, 8);
        break;
      case '×':
        result = validMultiplications[Math.floor(Math.random() * validMultiplications.length)];
        break;
      case '÷':
        result = generateRandomNumber(1, 9);
        break;
      default:
        result = 5;
    }
    
    equations.push({
      id: generateUniqueId(),
      operation,
      result,
      solved: false
    });
  }
  
  return equations;
};

const checkEquation = (val1: number, val2: number, equation: Equation): boolean => {
  switch (equation.operation) {
    case '+':
      return val1 + val2 === equation.result;
    case '-':
      return Math.abs(val1 - val2) === equation.result;
    case '×':
      return val1 * val2 === equation.result;
    case '÷':
      return (val1 / val2 === equation.result) || (val2 / val1 === equation.result);
    default:
      return false;
  }
};

const MathDropGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { updateGameState } = useGameState();
  
  // Level-based fall speed (in milliseconds)
  const getFallSpeed = (level: number): number => {
    if (level <= 3) return 1000;      // Levels 1-3: 1000ms (slow, learning)
    if (level <= 6) return 800;       // Levels 4-6: 800ms (medium)
    if (level <= 9) return 600;       // Levels 7-9: 600ms (faster)
    if (level <= 12) return 400;      // Levels 10-12: 400ms (challenging)
    return 300;                       // Levels 13+: 300ms (expert speed)
  };
  
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPair: generatePuyoPair(),
    nextPair: generatePuyoPair(),
    equations: generateEquations(1),
    score: 0,
    level: 1,
    gameOver: false,
    paused: false,
    matchEffects: [],
    particles: [],
    chainCount: 0,
    showInstructions: false,
    gameStarted: false,
    countdown: 3
  });

  // Broadcast game state changes to hide floating buttons during gameplay
  useEffect(() => {
    const isPlaying = gameState.gameStarted && !gameState.gameOver && !gameState.paused;
    updateGameState('math-drop', isPlaying);
  }, [gameState.gameStarted, gameState.gameOver, gameState.paused, updateGameState]);

  const createParticles = (x: number, y: number, count: number, chainLevel: number): Particle[] => {
    const particles: Particle[] = [];
    const colors = ['#FFB3E6', '#B3E5FC', '#C8E6C9', '#FFF9C4', '#FFCDD2', '#E1BEE7'];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3 + chainLevel;
      const types: ('star' | 'circle' | 'sparkle')[] = ['star', 'circle', 'sparkle'];
      
      particles.push({
        id: generateUniqueId(),
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 3 + Math.random() * 4 + chainLevel,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        maxLife: 60 + chainLevel * 20,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
    
    return particles;
  };

  const updateParticles = (particles: Particle[]): Particle[] => {
    return particles
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.1,
        vx: particle.vx * 0.99,
        life: particle.life - (1 / particle.maxLife),
        size: particle.size * 0.98
      }))
      .filter(particle => particle.life > 0 && particle.size > 0.5);
  };

  const isValidPosition = (pair: FallingPair, board: (NumberPuyo | null)[][]): boolean => {
    const positions = [
      { x: pair.puyo1.x, y: pair.puyo1.y },
      { x: pair.puyo2.x, y: pair.puyo2.y }
    ];
    
    return positions.every(pos => {
      return pos.x >= 0 && pos.x < BOARD_WIDTH && 
             pos.y >= 0 && pos.y < BOARD_HEIGHT &&
             !board[pos.y][pos.x];
    });
  };

  const rotatePair = (pair: FallingPair): FallingPair => {
    const newRotation = (pair.rotation + 90) % 360;
    let newPuyo2 = { ...pair.puyo2 };
    
    if (newRotation === 0) {
      newPuyo2.x = pair.puyo1.x + 1;
      newPuyo2.y = pair.puyo1.y;
    } else if (newRotation === 90) {
      newPuyo2.x = pair.puyo1.x;
      newPuyo2.y = pair.puyo1.y + 1;
    } else if (newRotation === 180) {
      newPuyo2.x = pair.puyo1.x - 1;
      newPuyo2.y = pair.puyo1.y;
    } else if (newRotation === 270) {
      newPuyo2.x = pair.puyo1.x;
      newPuyo2.y = pair.puyo1.y - 1;
    }
    
    return { ...pair, puyo2: newPuyo2, rotation: newRotation };
  };

  const movePair = (pair: FallingPair, dx: number, dy: number): FallingPair => {
    return {
      ...pair,
      puyo1: { ...pair.puyo1, x: pair.puyo1.x + dx, y: pair.puyo1.y + dy },
      puyo2: { ...pair.puyo2, x: pair.puyo2.x + dx, y: pair.puyo2.y + dy }
    };
  };

  const placePuyos = (pair: FallingPair, board: (NumberPuyo | null)[][]): (NumberPuyo | null)[][] => {
    const newBoard = board.map(row => [...row]);
    newBoard[pair.puyo1.y][pair.puyo1.x] = pair.puyo1;
    newBoard[pair.puyo2.y][pair.puyo2.x] = pair.puyo2;
    return newBoard;
  };

  const applyGravity = (board: (NumberPuyo | null)[][]): (NumberPuyo | null)[][] => {
    const newBoard = createEmptyBoard();
    
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const columnPuyos: NumberPuyo[] = [];
      
      for (let row = 0; row < BOARD_HEIGHT; row++) {
        if (board[row][col] !== null) {
          columnPuyos.push(board[row][col]!);
        }
      }
      
      let writeRow = BOARD_HEIGHT - 1;
      for (let i = columnPuyos.length - 1; i >= 0; i--) {
        newBoard[writeRow][col] = columnPuyos[i];
        writeRow--;
      }
    }
    
    return newBoard;
  };

  const findConnectedPieces = (board: (NumberPuyo | null)[][], startRow: number, startCol: number, visited: boolean[][], criteria: (puyo: NumberPuyo) => boolean): {row: number, col: number}[] => {
    if (startRow < 0 || startRow >= BOARD_HEIGHT || startCol < 0 || startCol >= BOARD_WIDTH) {
      return [];
    }
    if (visited[startRow][startCol]) return [];
    if (!board[startRow][startCol]) return [];
    if (!criteria(board[startRow][startCol]!)) return [];
    
    visited[startRow][startCol] = true;
    const connected = [{row: startRow, col: startCol}];
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const dir of directions) {
      const newRow = startRow + dir[0];
      const newCol = startCol + dir[1];
      connected.push(...findConnectedPieces(board, newRow, newCol, visited, criteria));
    }
    
    return connected;
  };

  const findMatches = (board: (NumberPuyo | null)[][], equations: Equation[], newlyPlacedPositions: {row: number, col: number}[]): { 
    board: (NumberPuyo | null)[][]; 
    matches: {count: number, types: {equation: number, special: number, group: number}}; 
    newEquations: Equation[]; 
    effects: MatchEffect[]; 
    particles: Particle[]; 
  } => {
    const newBoard = board.map(row => [...row]);
    const newEquations = [...equations];
    const effects: MatchEffect[] = [];
    const allParticles: Particle[] = [];
    let totalMatches = 0;
    const matchTypes = {equation: 0, special: 0, group: 0};
    const piecesToRemove: {row: number, col: number}[] = [];
    const canvasWidth = BOARD_WIDTH * CELL_SIZE;
    const canvasHeight = BOARD_HEIGHT * CELL_SIZE;

    // Only check newly placed positions and their immediate neighbors for equation matches
    const checkPositions = new Set<string>();
    
    for (const pos of newlyPlacedPositions) {
      checkPositions.add(`${pos.row},${pos.col}`);
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const dir of directions) {
        const newRow = pos.row + dir[0];
        const newCol = pos.col + dir[1];
        if (newRow >= 0 && newRow < BOARD_HEIGHT && newCol >= 0 && newCol < BOARD_WIDTH) {
          checkPositions.add(`${newRow},${newCol}`);
        }
      }
    }

    // Check equation matches for relevant positions only
    for (const posStr of checkPositions) {
      const coords = posStr.split(',').map(Number);
      const row = coords[0];
      const col = coords[1];
      const puyo1 = newBoard[row][col];
      if (!puyo1 || puyo1.isSpecial) continue;
      
      if (col < BOARD_WIDTH - 1) {
        const puyo2 = newBoard[row][col + 1];
        if (puyo2 && !puyo2.isSpecial) {
          for (let i = 0; i < newEquations.length; i++) {
            if (!newEquations[i].solved && checkEquation(puyo1.value, puyo2.value, newEquations[i])) {
              let effectX = col * CELL_SIZE + CELL_SIZE;
              let effectY = row * CELL_SIZE + CELL_SIZE / 2;
              
              // Clamp effect position to stay within canvas bounds
              effectX = Math.max(60, Math.min(canvasWidth - 60, effectX));
              effectY = Math.max(15, Math.min(canvasHeight - 15, effectY));
              
              effects.push({
                id: generateUniqueId(),
                x: effectX,
                y: effectY,
                startTime: Date.now(),
                duration: 800,
                text: `${puyo1.value} ${newEquations[i].operation} ${puyo2.value} = ${newEquations[i].result}`
              });
              
              const particleCount = 12 + totalMatches * 4;
              const chainLevel = totalMatches + 1;
              const newParticles = createParticles(effectX, effectY, particleCount, chainLevel);
              allParticles.push(...newParticles);
              
              newEquations[i].solved = true;
              newEquations[i].value1 = puyo1.value;
              newEquations[i].value2 = puyo2.value;
              newEquations[i].solvedTime = Date.now();
              
              piecesToRemove.push({row, col}, {row, col: col + 1});
              totalMatches++;
              matchTypes.equation++;
              break;
            }
          }
        }
      }
      
      if (row < BOARD_HEIGHT - 1) {
        const puyo2 = newBoard[row + 1][col];
        if (puyo2 && !puyo2.isSpecial) {
          for (let i = 0; i < newEquations.length; i++) {
            if (!newEquations[i].solved && checkEquation(puyo1.value, puyo2.value, newEquations[i])) {
              let effectX = col * CELL_SIZE + CELL_SIZE / 2;
              let effectY = row * CELL_SIZE + CELL_SIZE;
              
              // Clamp effect position to stay within canvas bounds
              effectX = Math.max(60, Math.min(canvasWidth - 60, effectX));
              effectY = Math.max(15, Math.min(canvasHeight - 15, effectY));
              
              effects.push({
                id: generateUniqueId(),
                x: effectX,
                y: effectY,
                startTime: Date.now(),
                duration: 800,
                text: `${puyo1.value} ${newEquations[i].operation} ${puyo2.value} = ${newEquations[i].result}`
              });
              
              const particleCount = 12 + totalMatches * 4;
              const chainLevel = totalMatches + 1;
              const newParticles = createParticles(effectX, effectY, particleCount, chainLevel);
              allParticles.push(...newParticles);
              
              newEquations[i].solved = true;
              newEquations[i].value1 = puyo1.value;
              newEquations[i].value2 = puyo2.value;
              newEquations[i].solvedTime = Date.now();
              
              piecesToRemove.push({row, col}, {row: row + 1, col});
              totalMatches++;
              matchTypes.equation++;
              break;
            }
          }
        }
      }
    }

    // Check special piece combinations (only in newly placed positions)
    for (const posStr of checkPositions) {
      const coords = posStr.split(',').map(Number);
      const row = coords[0];
      const col = coords[1];
      const puyo1 = newBoard[row][col];
      if (!puyo1 || !puyo1.isSpecial) continue;
      
      // Check right neighbor for horizontal lightning
      if (col < BOARD_WIDTH - 1) {
        const puyo2 = newBoard[row][col + 1];
        if (puyo2 && puyo2.isSpecial && puyo1.specialType === puyo2.specialType) {
          if (puyo1.specialType === 'bomb') {
            // 3x3 area around each bomb
            for (let r = row - 1; r <= row + 1; r++) {
              for (let c = col - 1; c <= col + 2; c++) {
                if (r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH) {
                  piecesToRemove.push({row: r, col: c});
                }
              }
            }
            let effectX = (col + 0.5) * CELL_SIZE;
            let effectY = row * CELL_SIZE + CELL_SIZE / 2;
            effectX = Math.max(60, Math.min(canvasWidth - 60, effectX));
            effectY = Math.max(15, Math.min(canvasHeight - 15, effectY));
            
            effects.push({
              id: generateUniqueId(),
              x: effectX,
              y: effectY,
              startTime: Date.now(),
              duration: 1000,
              text: "💥 BOMB BLAST! 💥"
            });
          } else if (puyo1.specialType === 'lightning') {
            // Horizontal lightning - clear entire row
            for (let c = 0; c < BOARD_WIDTH; c++) {
              piecesToRemove.push({row, col: c});
            }
            let effectX = (col + 0.5) * CELL_SIZE;
            let effectY = row * CELL_SIZE + CELL_SIZE / 2;
            effectX = Math.max(60, Math.min(canvasWidth - 60, effectX));
            effectY = Math.max(15, Math.min(canvasHeight - 15, effectY));
            
            effects.push({
              id: generateUniqueId(),
              x: effectX,
              y: effectY,
              startTime: Date.now(),
              duration: 1000,
              text: "⚡ HORIZONTAL ZAP! ⚡"
            });
          }
          totalMatches++;
          matchTypes.special++;
        }
      }
      
      // Check bottom neighbor for vertical lightning
      if (row < BOARD_HEIGHT - 1) {
        const puyo2 = newBoard[row + 1][col];
        if (puyo2 && puyo2.isSpecial && puyo1.specialType === puyo2.specialType) {
          if (puyo1.specialType === 'bomb') {
            // 3x3 area around each bomb
            for (let r = row - 1; r <= row + 2; r++) {
              for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH) {
                  piecesToRemove.push({row: r, col: c});
                }
              }
            }
            let effectX = col * CELL_SIZE + CELL_SIZE / 2;
            let effectY = (row + 0.5) * CELL_SIZE;
            effectX = Math.max(60, Math.min(canvasWidth - 60, effectX));
            effectY = Math.max(15, Math.min(canvasHeight - 15, effectY));
            
            effects.push({
              id: generateUniqueId(),
              x: effectX,
              y: effectY,
              startTime: Date.now(),
              duration: 1000,
              text: "💥 BOMB BLAST! 💥"
            });
          } else if (puyo1.specialType === 'lightning') {
            // Vertical lightning - clear entire column
            for (let r = 0; r < BOARD_HEIGHT; r++) {
              piecesToRemove.push({row: r, col});
            }
            let effectX = col * CELL_SIZE + CELL_SIZE / 2;
            let effectY = (row + 0.5) * CELL_SIZE;
            effectX = Math.max(60, Math.min(canvasWidth - 60, effectX));
            effectY = Math.max(15, Math.min(canvasHeight - 15, effectY));
            
            effects.push({
              id: generateUniqueId(),
              x: effectX,
              y: effectY,
              startTime: Date.now(),
              duration: 1000,
              text: "⚡ VERTICAL ZAP! ⚡"
            });
          }
          totalMatches++;
          matchTypes.special++;
        }
      }
    }

    // Check same number/color groups - but only if they include newly placed pieces
    const visited = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));
    for (const pos of newlyPlacedPositions) {
      const row = pos.row;
      const col = pos.col;
      if (!visited[row][col] && newBoard[row][col] && !newBoard[row][col]!.isSpecial) {
        const puyo = newBoard[row][col]!;
        const connected = findConnectedPieces(newBoard, row, col, visited, (p) => p.value === puyo.value && !p.isSpecial);
        
        if (connected.length >= 4) {
          piecesToRemove.push(...connected);
          let effectX = col * CELL_SIZE;
          let effectY = row * CELL_SIZE;
          effectX = Math.max(60, Math.min(canvasWidth - 60, effectX));
          effectY = Math.max(15, Math.min(canvasHeight - 15, effectY));
          
          effects.push({
            id: generateUniqueId(),
            x: effectX,
            y: effectY,
            startTime: Date.now(),
            duration: 800,
            text: `🔢 ${connected.length}x ${puyo.value}'s! 🔢`
          });
          totalMatches++;
          matchTypes.group++;
        }
      }
    }

    const colorVisited = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));
    for (const pos of newlyPlacedPositions) {
      const row = pos.row;
      const col = pos.col;
      if (!colorVisited[row][col] && newBoard[row][col] && !newBoard[row][col]!.isSpecial) {
        const puyo = newBoard[row][col]!;
        const connected = findConnectedPieces(newBoard, row, col, colorVisited, (p) => p.color === puyo.color && !p.isSpecial);
        
        if (connected.length >= 4) {
          piecesToRemove.push(...connected);
          let effectX = col * CELL_SIZE;
          let effectY = row * CELL_SIZE;
          effectX = Math.max(60, Math.min(canvasWidth - 60, effectX));
          effectY = Math.max(15, Math.min(canvasHeight - 15, effectY));
          
          effects.push({
            id: generateUniqueId(),
            x: effectX,
            y: effectY,
            startTime: Date.now(),
            duration: 800,
            text: `🌈 ${connected.length}x COLORS! 🌈`
          });
          totalMatches++;
          matchTypes.group++;
        }
      }
    }

    const removeSet = new Set(piecesToRemove.map(p => `${p.row},${p.col}`));
    for (const posStr of removeSet) {
      const coords = posStr.split(',').map(Number);
      const row = coords[0];
      const col = coords[1];
      newBoard[row][col] = null;
    }
    
    return { board: newBoard, matches: {count: totalMatches, types: matchTypes}, newEquations, effects, particles: allParticles };
  };

  const processMatches = useCallback((board: (NumberPuyo | null)[][], equations: Equation[], score: number, newlyPlacedPositions: {row: number, col: number}[]): { 
    board: (NumberPuyo | null)[][]; 
    score: number; 
    equations: Equation[]; 
    effects: MatchEffect[]; 
    particles: Particle[]; 
    chainCount: number; 
  } => {
    let currentBoard = board;
    let currentScore = score;
    let currentEquations = equations;
    let chainCount = 0;
    const allEffects: MatchEffect[] = [];
    const allParticles: Particle[] = [];
    let currentNewlyPlaced = newlyPlacedPositions;
    
    while (true) {
      const result = findMatches(currentBoard, currentEquations, currentNewlyPlaced);
      
      if (result.matches.count === 0) break;
      
      chainCount++;
      
      // Updated scoring system with different point values for different match types
      let basePoints = 0;
      if (result.matches.count > 0) {
        // Equation solving: 200 points base
        // Special pieces: 150 points base  
        // Number/Color groups: 100 points base
        basePoints = (result.matches.types.equation * 200) + 
                     (result.matches.types.special * 150) + 
                     (result.matches.types.group * 100);
        
        // Chain bonus: exponential multiplier
        const chainMultiplier = Math.pow(1.5, chainCount - 1);
        
        // Large group bonus
        const groupBonus = result.matches.count > 5 ? result.matches.count * 20 : 0;
        
        const totalPoints = Math.floor((basePoints * chainMultiplier) + groupBonus);
        currentScore += totalPoints;
      }
      allEffects.push(...result.effects);
      allParticles.push(...result.particles);
      
      currentBoard = applyGravity(result.board);
      currentEquations = result.newEquations;
      
      currentNewlyPlaced = [];
      for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
          if (currentBoard[row][col]) {
            currentNewlyPlaced.push({row, col});
          }
        }
      }
    }
    
    return { board: currentBoard, score: currentScore, equations: currentEquations, effects: allEffects, particles: allParticles, chainCount };
  }, []);

  // Start countdown timer
  useEffect(() => {
    if (!gameState.gameStarted && gameState.countdown > 0) {
      const timer = setTimeout(() => {
        setGameState(prevState => {
          if (prevState.countdown > 1) {
            return { ...prevState, countdown: prevState.countdown - 1 };
          } else {
            // Set countdown to 0 but don't start game yet - show GO! effects first
            return { ...prevState, countdown: 0 };
          }
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (!gameState.gameStarted && gameState.countdown === 0) {
      // Show GO! effects for 1.5 seconds before starting the game
      const goTimer = setTimeout(() => {
        setGameState(prevState => ({
          ...prevState,
          gameStarted: true
        }));
        
        // Track game start
        trackGameEvent('math-drop', 'start', {
          level: 1,
          initialEquations: generateEquations(1).length
        });
      }, 1500);
      
      return () => clearTimeout(goTimer);
    }
  }, [gameState.gameStarted, gameState.countdown]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState.gameOver || gameState.paused || !gameState.currentPair || !gameState.gameStarted) return;
    
    setGameState(prevState => {
      const currentPair = prevState.currentPair;
      const board = prevState.board;
      if (!currentPair) return prevState;
      
      let newPair = currentPair;
      
      if (event.key === 'ArrowLeft') {
        newPair = movePair(currentPair, -1, 0);
      } else if (event.key === 'ArrowRight') {
        newPair = movePair(currentPair, 1, 0);
      } else if (event.key === 'ArrowDown') {
        // Soft drop - move down but don't interfere with auto-fall
        newPair = movePair(currentPair, 0, 1);
      } else if (event.key === 'ArrowUp' || event.key === ' ') {
        newPair = rotatePair(currentPair);
      } else {
        return prevState;
      }
      
      if (isValidPosition(newPair, board)) {
        return { ...prevState, currentPair: newPair };
      }
      
      return prevState;
    });
  }, [gameState.gameOver, gameState.paused, gameState.currentPair, gameState.gameStarted]);

  useEffect(() => {
    const particleLoop = setInterval(() => {
      if (gameState.gameOver || gameState.paused || !gameState.gameStarted) return;
      
      setGameState(prevState => ({
        ...prevState,
        particles: updateParticles(prevState.particles)
      }));
    }, 16);
    
    return () => clearInterval(particleLoop);
  }, [gameState.gameOver, gameState.paused, gameState.gameStarted]);

  useEffect(() => {
    const equationReplacementLoop = setInterval(() => {
      if (gameState.gameOver || gameState.paused || !gameState.gameStarted) return;
      
      setGameState(prevState => {
        const currentTime = Date.now();
        const newEquations = [...prevState.equations];
        let equationsChanged = false;
        
        for (let i = 0; i < newEquations.length; i++) {
          const eq = newEquations[i];
          if (eq.solved && eq.solvedTime && currentTime - eq.solvedTime > 2000) {
            let operations: ('+' | '-' | '×' | '÷')[] = ['+'];
            
            if (prevState.level >= 3) operations = ['+', '-'];
            if (prevState.level >= 6) operations = ['+', '-', '×'];
            if (prevState.level >= 9) operations = ['+', '-', '×', '÷'];
            
            const operation = operations[Math.floor(Math.random() * operations.length)];
            let result: number;
            
            const validMultiplications = [
              1, 2, 3, 4, 5, 6, 7, 8, 9,      // 1×1 to 1×9
              4, 6, 8, 10, 12, 14, 16, 18,    // 2×2 to 2×9 (excluding 2×1=2 already counted)
              9, 12, 15, 18, 21, 24, 27,      // 3×3 to 3×9 (excluding duplicates)
              16, 20, 24, 28, 32, 36,         // 4×4 to 4×9 (excluding duplicates)
              25, 30, 35, 40, 45,             // 5×5 to 5×9 (excluding duplicates)
              36, 42, 48, 54,                 // 6×6 to 6×9 (excluding duplicates)
              49, 56, 63,                     // 7×7 to 7×9 (excluding duplicates)
              64, 72,                         // 8×8 to 8×9 (excluding duplicates)
              81                              // 9×9
            ];
            
            if (operation === '+') {
              result = generateRandomNumber(2, 18);
            } else if (operation === '-') {
              result = generateRandomNumber(1, 8);
            } else if (operation === '×') {
              result = validMultiplications[Math.floor(Math.random() * validMultiplications.length)];
            } else {
              result = generateRandomNumber(1, 9);
            }
            
            newEquations[i] = {
              id: generateUniqueId(),
              operation,
              result,
              solved: false
            };
            equationsChanged = true;
          }
        }
        
        if (equationsChanged) {
          return { ...prevState, equations: newEquations };
        }
        
        return prevState;
      });
    }, 500);
    
    return () => clearInterval(equationReplacementLoop);
  }, [gameState.gameOver, gameState.paused, gameState.level, gameState.gameStarted]);

  useEffect(() => {
    const gravityLoop = setInterval(() => {
      if (gameState.gameOver || gameState.paused || !gameState.gameStarted) return;
      
      setGameState(prevState => {
        const newBoard = [...prevState.board.map(row => [...row])];
        let boardChanged = false;
        
        for (let row = BOARD_HEIGHT - 2; row >= 0; row--) {
          for (let col = 0; col < BOARD_WIDTH; col++) {
            if (newBoard[row][col] !== null) {
              let fallToRow = row;
              while (fallToRow + 1 < BOARD_HEIGHT && newBoard[fallToRow + 1][col] === null) {
                fallToRow++;
              }
              
              if (fallToRow !== row) {
                newBoard[fallToRow][col] = newBoard[row][col];
                newBoard[row][col] = null;
                boardChanged = true;
              }
            }
          }
        }
        
        if (boardChanged) {
          return { ...prevState, board: newBoard };
        }
        
        return prevState;
      });
    }, 200);
    
    return () => clearInterval(gravityLoop);
  }, [gameState.gameOver, gameState.paused, gameState.gameStarted]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameState.gameOver || gameState.paused || !gameState.currentPair || !gameState.gameStarted) return;
      
      setGameState(prevState => {
        const currentPair = prevState.currentPair;
        const nextPair = prevState.nextPair;
        const board = prevState.board;
        if (!currentPair) return prevState;
        
        const newPair = movePair(currentPair, 0, 1);
        
        if (isValidPosition(newPair, board)) {
          return { ...prevState, currentPair: newPair };
        } else {
          const newBoard = placePuyos(currentPair, board);
          
          setTimeout(() => {
            setGameState(prevState => {
              const settledBoard = prevState.board;
              const newlyPlacedPositions = [
                {row: currentPair.puyo1.y, col: currentPair.puyo1.x},
                {row: currentPair.puyo2.y, col: currentPair.puyo2.x}
              ];
              const result = processMatches(settledBoard, prevState.equations, prevState.score, newlyPlacedPositions);
              
              if (result.board[0].some(cell => cell !== null)) {
                // Track game over event
                trackGameEvent('math-drop', 'complete', {
                  score: result.score,
                  level: Math.floor(result.score / 1500) + 1,
                  reason: 'top-row-filled'
                });
                return { ...prevState, gameOver: true };
              }
              
              return {
                ...prevState,
                board: result.board,
                equations: result.equations,
                score: result.score,
                level: Math.floor(result.score / 1500) + 1,
                matchEffects: [...prevState.matchEffects, ...result.effects],
                particles: [...prevState.particles, ...result.particles],
                chainCount: result.chainCount
              };
            });
          }, 300);
          
          return {
            ...prevState,
            board: newBoard,
            currentPair: nextPair,
            nextPair: generatePuyoPair()
          };
        }
      });
    }, getFallSpeed(gameState.level));
    
    return () => clearInterval(gameLoop);
  }, [gameState.gameOver, gameState.paused, gameState.level, gameState.gameStarted]);

  useEffect(() => {
    const cleanupEffects = setInterval(() => {
      setGameState(prevState => ({
        ...prevState,
        matchEffects: prevState.matchEffects.filter(effect => 
          Date.now() - effect.startTime < effect.duration
        )
      }));
    }, 100);
    
    return () => clearInterval(cleanupEffects);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    const alpha = particle.life;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(particle.x, particle.y);
    
    if (particle.type === 'star') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const x = Math.cos(angle) * particle.size;
        const y = Math.sin(angle) * particle.size;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        const innerAngle = ((i + 0.5) * Math.PI * 2) / 5;
        const innerX = Math.cos(innerAngle) * particle.size * 0.5;
        const innerY = Math.sin(innerAngle) * particle.size * 0.5;
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
    } else if (particle.type === 'circle') {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.type === 'sparkle') {
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-particle.size, 0);
      ctx.lineTo(particle.size, 0);
      ctx.moveTo(0, -particle.size);
      ctx.lineTo(0, particle.size);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawPuyo = (ctx: CanvasRenderingContext2D, x: number, y: number, puyo: NumberPuyo) => {
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    const radius = CELL_SIZE * 0.4;
    
    const mainGradient = ctx.createRadialGradient(
      centerX - radius * 0.2, centerY - radius * 0.3, 0,
      centerX, centerY, radius
    );
    mainGradient.addColorStop(0, puyo.color || '#FFB3E6');
    mainGradient.addColorStop(0.7, puyo.color || '#FFB3E6');
    mainGradient.addColorStop(1, '#AA4499');
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    const shineGradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.4, 0,
      centerX - radius * 0.1, centerY - radius * 0.2, radius * 0.8
    );
    shineGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
    shineGradient.addColorStop(0.3, 'rgba(255,255,255,0.4)');
    shineGradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = shineGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.4, centerY - radius * 0.5, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 0.5, 0, Math.PI * 2);
    ctx.stroke();
    
    const shadowGradient = ctx.createRadialGradient(
      centerX, centerY + radius * 0.6, 0,
      centerX, centerY + radius * 0.6, radius * 0.4
    );
    shadowGradient.addColorStop(0, 'rgba(0,0,0,0.15)');
    shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (puyo.isSpecial) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      
      if (puyo.specialType === 'bomb') {
        ctx.strokeText('💣', centerX, centerY);
        ctx.fillText('💣', centerX, centerY);
      } else if (puyo.specialType === 'lightning') {
        ctx.strokeText('⚡', centerX, centerY);
        ctx.fillText('⚡', centerX, centerY);
      }
    } else {
      ctx.fillStyle = '#2D1B69';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeText(puyo.value.toString(), centerX, centerY);
      ctx.fillText(puyo.value.toString(), centerX, centerY);
    }
  };

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw countdown overlay if game hasn't started
    if (!gameState.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const time = Date.now() * 0.002;
      
      // Draw "GET READY!" text higher up with effects - only show during countdown, not during GO!
      if (gameState.countdown > 0) {
        const readyY = centerY - 150;
        const pulse = Math.sin(time * 4) * 0.1 + 1; // Pulsing scale effect
        
        ctx.save();
        ctx.translate(centerX, readyY);
        ctx.scale(pulse, pulse);
        
        // Add glow background for text
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GET READY!', 0, 0);
        
        // Add outline
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 4;
        ctx.strokeText('GET READY!', 0, 0);
        
        // Add inner text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('GET READY!', 0, 0);
        
        ctx.restore();
      }
      
      // Draw main countdown number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 96px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      
      const countdownText = gameState.countdown > 0 ? gameState.countdown.toString() : 'GO!';
      ctx.strokeText(countdownText, centerX, centerY);
      ctx.fillText(countdownText, centerX, centerY);
      
      // Add perfect circle of sparkles around countdown
      if (gameState.countdown > 0) {
        const numSparkles = 12;
        
        // Calculate safe radius to keep sparkles within canvas bounds
        const maxRadius = Math.min(
          centerX - 20,  // Leave 20px margin from left edge
          canvas.width - centerX - 20,  // Leave 20px margin from right edge
          centerY - 100,  // Leave more space for "GET READY!" text above
          canvas.height - centerY - 20  // Leave 20px margin from bottom
        );
        const baseRadius = Math.min(100, maxRadius - 15); // Reserve space for star size and pulsing
        
        for (let i = 0; i < numSparkles; i++) {
          // Fixed angle increment for perfect circle
          const angle = (i / numSparkles) * Math.PI * 2 + time;
          const radius = baseRadius + Math.sin(time * 2 + i * 0.5) * 10; // Smaller pulsing to stay in bounds
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Different colors for each sparkle with rotation
          const hue = (i * 30 + time * 50) % 360;
          ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
          
          // Draw star-shaped sparkles
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + time);
          
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const starAngle = (j * Math.PI * 2) / 5;
            const starRadius = 6 + Math.sin(time * 3 + i) * 2; // Smaller stars to fit better
            const starX = Math.cos(starAngle) * starRadius;
            const starY = Math.sin(starAngle) * starRadius;
            
            if (j === 0) {
              ctx.moveTo(starX, starY);
            } else {
              ctx.lineTo(starX, starY);
            }
            
            // Inner points
            const innerAngle = ((j + 0.5) * Math.PI * 2) / 5;
            const innerX = Math.cos(innerAngle) * starRadius * 0.4;
            const innerY = Math.sin(innerAngle) * starRadius * 0.4;
            ctx.lineTo(innerX, innerY);
          }
          ctx.closePath();
          ctx.fill();
          
          // Add glow effect
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
          
          ctx.restore();
        }
        
        // Add outer ring of smaller dots (also constrained)
        const outerRadius = Math.min(baseRadius + 40, maxRadius - 5);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + time * 0.5;
          const x = centerX + Math.cos(angle) * outerRadius;
          const y = centerY + Math.sin(angle) * outerRadius;
          
          ctx.fillStyle = `hsl(${(i * 45 + time * 30) % 360}, 70%, 60%)`;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Special "GO!" burst effects - show when countdown is 0 but game hasn't started yet
      if (gameState.countdown === 0) {
        const burstTime = Date.now() * 0.01;
        
        // Firework-style sparkles instead of particles
        const numFireworks = 12;
        
        for (let i = 0; i < numFireworks; i++) {
          const baseAngle = (i / numFireworks) * Math.PI * 2;
          const distance = 80 + Math.sin(burstTime + i) * 60;
          
          // Main firework center
          const fireworkX = centerX + Math.cos(baseAngle) * distance;
          const fireworkY = centerY + Math.sin(baseAngle) * distance;
          
          // Check bounds for main firework
          if (fireworkX >= 20 && fireworkX <= canvas.width - 20 && fireworkY >= 20 && fireworkY <= canvas.height - 20) {
            // Create multiple sparkles radiating from each firework center
            const sparksPerFirework = 8;
            
            for (let j = 0; j < sparksPerFirework; j++) {
              const sparkAngle = (j / sparksPerFirework) * Math.PI * 2 + burstTime * 2;
              const sparkDistance = 15 + Math.sin(burstTime * 3 + i + j) * 10;
              const sparkX = fireworkX + Math.cos(sparkAngle) * sparkDistance;
              const sparkY = fireworkY + Math.sin(sparkAngle) * sparkDistance;
              
              // Individual sparkle
              const sparkSize = 3 + Math.sin(burstTime * 4 + i + j) * 2;
              const sparkHue = (i * 30 + j * 15 + burstTime * 180) % 360;
              
              ctx.fillStyle = `hsl(${sparkHue}, 85%, 70%)`;
              ctx.shadowColor = ctx.fillStyle;
              ctx.shadowBlur = 8;
              
              // Draw cross-shaped sparkle
              ctx.save();
              ctx.translate(sparkX, sparkY);
              ctx.rotate(burstTime + i + j);
              
              ctx.fillRect(-sparkSize, -sparkSize/3, sparkSize*2, sparkSize*2/3);
              ctx.fillRect(-sparkSize/3, -sparkSize, sparkSize*2/3, sparkSize*2);
              
              ctx.restore();
              ctx.shadowBlur = 0;
            }
            
            // Central glow for each firework
            ctx.fillStyle = `hsl(${(i * 30 + burstTime * 100) % 360}, 90%, 80%)`;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(fireworkX, fireworkY, 4 + Math.sin(burstTime * 2 + i) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
        
        // Add shooting stars effect
        const numStars = 6;
        for (let i = 0; i < numStars; i++) {
          const starAngle = (i / numStars) * Math.PI * 2 + burstTime * 0.5;
          const starDistance = 40 + (burstTime * 30 + i * 20) % 120;
          const starX = centerX + Math.cos(starAngle) * starDistance;
          const starY = centerY + Math.sin(starAngle) * starDistance;
          
          if (starX >= 10 && starX <= canvas.width - 10 && starY >= 10 && starY <= canvas.height - 10) {
            // Trail effect
            const trailLength = 20;
            for (let t = 0; t < trailLength; t++) {
              const trailAlpha = (trailLength - t) / trailLength;
              const trailX = starX - Math.cos(starAngle) * t * 2;
              const trailY = starY - Math.sin(starAngle) * t * 2;
              
              ctx.fillStyle = `hsl(${(i * 60 + burstTime * 150) % 360}, 90%, ${70 * trailAlpha}%)`;
              ctx.globalAlpha = trailAlpha * 0.8;
              ctx.beginPath();
              ctx.arc(trailX, trailY, (trailLength - t) / 5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
            
            // Main star
            ctx.fillStyle = `hsl(${(i * 60 + burstTime * 150) % 360}, 100%, 85%)`;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 12;
            
            ctx.save();
            ctx.translate(starX, starY);
            ctx.rotate(burstTime * 3 + i);
            
            // 5-pointed star
            ctx.beginPath();
            for (let p = 0; p < 5; p++) {
              const angle = (p * Math.PI * 2) / 5;
              const radius = 6;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              if (p === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              
              // Inner point
              const innerAngle = ((p + 0.5) * Math.PI * 2) / 5;
              const innerX = Math.cos(innerAngle) * radius * 0.4;
              const innerY = Math.sin(innerAngle) * radius * 0.4;
              ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
            ctx.shadowBlur = 0;
          }
        }
        
        // Central explosion with expanding rings
        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = 20 + ring * 15 + Math.sin(burstTime * 2 + ring) * 10;
          const ringAlpha = 0.6 - ring * 0.2;
          
          ctx.strokeStyle = `hsl(${(burstTime * 200 + ring * 60) % 360}, 90%, 70%)`;
          ctx.lineWidth = 3 - ring;
          ctx.globalAlpha = ringAlpha;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 10;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }
      
      return;
    }
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let row = 0; row <= BOARD_HEIGHT; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH * CELL_SIZE, row * CELL_SIZE);
      ctx.stroke();
    }
    for (let col = 0; col <= BOARD_WIDTH; col++) {
      ctx.beginPath();
      ctx.moveTo(col * CELL_SIZE, 0);
      ctx.lineTo(col * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const puyo = gameState.board[row][col];
        if (puyo) {
          drawPuyo(ctx, col * CELL_SIZE, row * CELL_SIZE, puyo);
        }
      }
    }
    
    if (gameState.currentPair) {
      drawPuyo(ctx, gameState.currentPair.puyo1.x * CELL_SIZE, gameState.currentPair.puyo1.y * CELL_SIZE, gameState.currentPair.puyo1);
      drawPuyo(ctx, gameState.currentPair.puyo2.x * CELL_SIZE, gameState.currentPair.puyo2.y * CELL_SIZE, gameState.currentPair.puyo2);
    }
    
    gameState.matchEffects.forEach(effect => {
      const elapsed = Date.now() - effect.startTime;
      const progress = elapsed / effect.duration;
      
      if (progress < 1) {
        const alpha = 1 - progress;
        const scale = 1 + progress * 0.5;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(effect.x, effect.y);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = '#FFE0B2';
        ctx.shadowColor = '#FF9800';
        ctx.shadowBlur = 10;
        ctx.fillRect(-60, -15, 120, 30);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#5D4037';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(effect.text, 0, 0);
        
        ctx.restore();
      }
    });
    
    gameState.particles.forEach(particle => {
      drawParticle(ctx, particle);
    });
  }, [gameState]);

  useEffect(() => {
    drawGame();
  }, [drawGame]);

  const resetGame = () => {
    // Track game restart
    trackGameEvent('math-drop', 'restart', {
      score: gameState.score,
      level: gameState.level
    });
    
    setGameState({
      board: createEmptyBoard(),
      currentPair: generatePuyoPair(),
      nextPair: generatePuyoPair(),
      equations: generateEquations(1),
      score: 0,
      level: 1,
      gameOver: false,
      paused: false,
      matchEffects: [],
      particles: [],
      chainCount: 0,
      showInstructions: false,
      gameStarted: false,
      countdown: 3
    });
  };

  const togglePause = () => {
    if (!gameState.gameStarted) return; // Don't allow pause during countdown
    
    const newPaused = !gameState.paused;
    // Track pause/resume events
    trackGameEvent('math-drop', newPaused ? 'pause' : 'resume', {
      score: gameState.score,
      level: gameState.level
    });
    
    setGameState(prev => ({ ...prev, paused: newPaused }));
  };

  const toggleInstructions = () => {
    trackButtonClick('toggle-instructions', 'math-drop');
    setGameState(prev => ({ ...prev, showInstructions: !prev.showInstructions }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-pink-300">
          <div className="text-center mb-6">
            <div className="relative inline-block mb-6">
              <h1 className="text-4xl md:text-6xl font-black relative">
                <span className="absolute inset-0 blur-sm">
                  🌈 <span className="bg-gradient-to-r from-pink-300 via-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">Math Drop</span> 🌈
                </span>
                <span className="relative">
                  🌈 <span className="bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Math Drop</span> 🌈
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-200 via-purple-200 via-blue-200 to-cyan-200 rounded-lg blur opacity-50 -z-10"></div>
              </h1>
            </div>
            <div>
              <p className="text-purple-500 text-lg font-medium bg-white/90 rounded-full px-4 py-2 inline-block shadow-sm border border-purple-200">
                Match colors, numbers, and solve equations!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
            <div className="flex flex-col items-center order-1">
              <canvas
                ref={canvasRef}
                width={BOARD_WIDTH * CELL_SIZE}
                height={BOARD_HEIGHT * CELL_SIZE}
                className="border-4 border-pink-300 rounded-2xl bg-gradient-to-b from-blue-50 to-purple-50"
              />
              
              <div className="mt-2 text-center text-sm text-purple-600">
                <p>🎮 Use arrow keys to move • ↑ or Space to rotate</p>
                {gameState.chainCount > 1 && (
                  <div className="mt-2 text-lg font-bold text-pink-500 animate-bounce">
                    🌟 {gameState.chainCount}x SUPER COMBO! 🌟
                  </div>
                )}
                {gameState.gameOver && (
                  <div className="mt-2 p-3 bg-pink-100 rounded-2xl border-2 border-pink-300">
                    <p className="text-pink-600 font-bold">Game Over!</p>
                    <button 
                      onClick={() => {
                        trackButtonClick('play-again', 'math-drop');
                        resetGame();
                      }}
                      className="mt-2 px-6 py-2 bg-pink-400 text-white rounded-full hover:bg-pink-500 transition-colors font-bold"
                    >
                      🎯 Play Again
                    </button>
                  </div>
                )}
                {gameState.paused && gameState.gameStarted && (
                  <div className="mt-2 p-3 bg-yellow-100 rounded-2xl border-2 border-yellow-300">
                    <p className="text-yellow-600 font-bold">⏸️ Game Paused</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[250px] lg:min-w-[280px] order-2 lg:order-3">
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-4 border-2 border-pink-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-500">🏆 Score: {gameState.score.toLocaleString()}</div>
                  <div className="text-lg text-purple-500">⭐ Level: {gameState.level}</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-4 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-500 mb-3 text-center">🔮 Next Pieces</h3>
                <div className="flex justify-center gap-3">
                  {gameState.nextPair && (
                    <>
                      <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden flex items-center justify-center text-white font-bold text-lg" 
                           style={{backgroundColor: gameState.nextPair.puyo1.color}}>
                        {gameState.nextPair.puyo1.isSpecial ? 
                          (gameState.nextPair.puyo1.specialType === 'bomb' ? '💣' : '⚡') : 
                          gameState.nextPair.puyo1.value
                        }
                      </div>
                      <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden flex items-center justify-center text-white font-bold text-lg"
                           style={{backgroundColor: gameState.nextPair.puyo2.color}}>
                        {gameState.nextPair.puyo2.isSpecial ? 
                          (gameState.nextPair.puyo2.specialType === 'bomb' ? '💣' : '⚡') : 
                          gameState.nextPair.puyo2.value
                        }
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 border-2 border-yellow-200">
                <h3 className="text-lg font-bold text-orange-500 mb-3 text-center">🎯 Math Challenges</h3>
                <div className="space-y-2">
                  {gameState.equations.map(equation => (
                    <div 
                      key={equation.id}
                      className={`p-3 rounded-xl text-center font-bold transition-all border-2 ${
                        equation.solved 
                          ? 'bg-green-100 text-green-600 border-green-300' 
                          : 'bg-white text-purple-600 shadow-sm border-purple-200'
                      }`}
                    >
                      {equation.solved ? (
                        <div>
                          {equation.value1} {equation.operation} {equation.value2} = {equation.result}
                          <span className="ml-2">🎉</span>
                        </div>
                      ) : (
                        <div>_ {equation.operation} _ = {equation.result}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    trackButtonClick(gameState.paused ? 'resume' : 'pause', 'math-drop');
                    togglePause();
                  }}
                  disabled={!gameState.gameStarted}
                  className={`w-full px-4 py-3 text-white rounded-full transition-all font-bold shadow-lg ${
                    !gameState.gameStarted 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : gameState.paused 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500' 
                        : 'bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500'
                  }`}
                >
                  {!gameState.gameStarted ? '⏳ Starting...' : gameState.paused ? '▶️ Resume Fun' : '⏸️ Take a Break'}
                </button>
                <button 
                  onClick={() => {
                    trackButtonClick('new-game', 'math-drop');
                    resetGame();
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-full hover:from-blue-500 hover:to-cyan-500 transition-all font-bold shadow-lg"
                >
                  🎮 New Adventure
                </button>
                <button 
                  onClick={toggleInstructions}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-400 to-lime-400 text-white rounded-full hover:from-green-500 hover:to-lime-500 transition-all font-bold shadow-lg"
                >
                  {gameState.showInstructions ? '📚 Hide Help' : '📚 Show Help'}
                </button>
              </div>

              {gameState.showInstructions && (
                <div className="bg-gradient-to-r from-green-100 to-lime-100 rounded-2xl p-4 text-sm border-2 border-green-200">
                  <h4 className="font-bold text-green-600 mb-2">📚 How to Play:</h4>
                  <ul className="text-green-600 space-y-1">
                    <li>🎯 Place numbers next to each other to solve math!</li>
                    <li>💰 Equations = 200 pts, Groups = 100 pts, Special = 150 pts!</li>
                    <li>⚡ Chain reactions give bonus points!</li>
                    <li>🔄 Solved equations get replaced automatically!</li>
                    <li>💣 Connect 2 bomb pieces to clear 5x5 area!</li>
                    <li>⚡ Connect 2 lightning pieces to clear row+column!</li>
                    <li>🔢 4+ same numbers connected = clear!</li>
                    <li>🌈 4+ same colors connected = clear!</li>
                    <li>⬆️ Don't let the stack reach the top!</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathDropGame;