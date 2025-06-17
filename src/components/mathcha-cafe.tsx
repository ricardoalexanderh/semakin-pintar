import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Clock, LogOut } from 'lucide-react';
import * as Tone from 'tone';
import confetti from 'canvas-confetti';
import { trackGameEvent, trackSettingsChange } from '../utils/analytics';
import { useGameState } from '../hooks/useGameState';


// Testing Configuration (for development only)
// To test specific levels/scores: Set ENABLE_TESTING to true and modify values below
const TEST_CONFIG = {
  START_LEVEL: 4,        // Change to start at specific level (1-4)
  START_SCORE: 100,       // Change to start with specific score (mastery)
  ENABLE_TESTING: false  // Set to true to use test values, false for normal gameplay
};

// Game Constants
const BASE_MENU_ITEMS = [
  { id: 1, name: 'Cake', price: 3, icon: '🍰' },
  { id: 2, name: 'Cheesecake', price: 4, icon: '🍰' },
  { id: 3, name: 'Latte', price: 2, icon: '🍵' },
  { id: 4, name: 'Cold Brew', price: 3, icon: '🥤' },
  { id: 5, name: 'Cookies', price: 2, icon: '🍪' },
  { id: 6, name: 'Premium Latte', price: 5, icon: '🍵' },
  { id: 7, name: 'Roll Cake', price: 4, icon: '🎂' },
  { id: 8, name: 'Mochi', price: 2, icon: '🍡' },
  { id: 9, name: 'Parfait', price: 5, icon: '🍨' },
  { id: 10, name: 'Tea Set', price: 6, icon: '🫖' },
];

// Function to randomize menu prices
const randomizeMenuPrices = () => {
  return BASE_MENU_ITEMS.map(item => ({
    ...item,
    price: Math.floor(Math.random() * 8) + 2 // Random price from $2 to $9
  }));
};

const LEVEL_CONFIG = [
  { level: 1, guestTarget: 8, menuItems: 4, customers: 2, waitTime: 18, multiplier: 1 },
  { level: 2, guestTarget: 10, menuItems: 6, customers: 4, waitTime: 16, multiplier: 2 },
  { level: 3, guestTarget: 12, menuItems: 8, customers: 6, waitTime: 14, multiplier: 3 },
  { level: 4, guestTarget: 14, menuItems: 10, customers: 8, waitTime: 12, multiplier: 4 },
];

const CUSTOMER_TYPES = [
  { id: 1, name: 'Man', avatar: '/man-guest.png', color: 'bg-blue-200' },
  { id: 2, name: 'Woman', avatar: '/woman-guest.png', color: 'bg-pink-200' },
  { id: 3, name: 'Boy', avatar: '/boy-guest.png', color: 'bg-green-200' },
  { id: 4, name: 'Girl', avatar: '/girl-guest.png', color: 'bg-purple-200' },
];

const THEME = { 
  name: 'Matcha Classic', 
  playingBg: 'from-green-100 to-amber-100', 
  cardBg: 'bg-white/90 backdrop-blur-sm',
  accent: 'text-green-700',
  button: 'bg-green-600 hover:bg-green-700'
};

// Question Type Visual Themes
const QUESTION_THEMES = {
  addition: {
    name: 'Addition',
    icon: '➕',
    bgGradient: 'from-green-50 to-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-800',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    headerBg: 'bg-green-200/50',
    description: 'Calculate Total'
  },
  subtraction: {
    name: 'Subtraction', 
    icon: '➖',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    headerBg: 'bg-blue-200/50',
    description: 'Calculate Change'
  },
  budget: {
    name: 'Budget',
    icon: '💰',
    bgGradient: 'from-purple-50 to-purple-100', 
    borderColor: 'border-purple-300',
    textColor: 'text-purple-800',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
    headerBg: 'bg-purple-200/50',
    description: 'Budget Planning'
  },
  discount: {
    name: 'Discount',
    icon: '🏷️',
    bgGradient: 'from-orange-50 to-orange-100',
    borderColor: 'border-orange-300', 
    textColor: 'text-orange-800',
    buttonBg: 'bg-orange-600 hover:bg-orange-700',
    headerBg: 'bg-orange-200/50',
    description: 'Special Offer'
  }
};

// Types
type GameState = 'splash' | 'setup' | 'playing' | 'paused' | 'gameOver' | 'victory' | 'levelUp';
type QuestionType = 'addition' | 'subtraction' | 'budget' | 'discount';
interface GameSettings {
  level: number;
  soundEnabled: boolean;
  sfxEnabled: boolean;
}

interface Customer {
  id: string;
  type: typeof CUSTOMER_TYPES[0];
  tableId: number;
  order: typeof BASE_MENU_ITEMS[0][];
  question: Question;
  patience: number;
  maxPatience: number;
  emotion: 'neutral' | 'happy' | 'angry';
  isAnswered: boolean;
  hasWarned: boolean;
}

interface Question {
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number | string;
  orderTotal?: number;
  payment?: number;
  budget?: number;
  discount?: { type: 'percentage' | 'fixed'; value: number; condition?: string };
  menuItems?: typeof BASE_MENU_ITEMS;
  targetCombination?: typeof BASE_MENU_ITEMS;
}

interface GameScore {
  score: number;
  level: number;
  customersServed: number;
  accuracy: number;
  timeBonus: number;
}

// Helper function to detect iOS with small screen
const isIOSSmallScreen = (): boolean => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSmallScreen = window.innerHeight <= 667; // iPhone 6s and smaller
  return isIOS && isSmallScreen;
};

// Helper function to get consistent random emotion asset per customer
const getRandomEmotionAsset = (emotion: 'happy' | 'angry', customerId: string): string => {
  // Use customer ID to generate consistent random number
  let hash = 0;
  for (let i = 0; i < customerId.length; i++) {
    const char = customerId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const randomIndex = (Math.abs(hash) % 7) + 1;
  return `/face-${emotion}-${randomIndex}.png`;
};

// Audio Manager using Tone.js and use-sound
class AudioManager {
  private synth: Tone.Synth;
  private sfxEnabled: boolean = true;

  constructor() {
    this.synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.8 },
      volume: -10 // Base volume in dB
    }).toDestination();
  }

  setSFXEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  playHappyCustomer() {
    if (!this.sfxEnabled) return;
    try {
      this.synth.triggerAttackRelease('C4', '0.1n');
      setTimeout(() => this.synth.triggerAttackRelease('E4', '0.1n'), 100);
      setTimeout(() => this.synth.triggerAttackRelease('G4', '0.1n'), 200);
    } catch (e) {
      // Silent fail
    }
  }

  playAngryCustomer() {
    if (!this.sfxEnabled) return;
    try {
      this.synth.triggerAttackRelease('F4', '0.2n');
    } catch (e) {
      // Silent fail
    }
  }

  playGameOver() {
    if (!this.sfxEnabled) return;
    try {
      this.synth.triggerAttackRelease('D4', '0.3n');
    } catch (e) {
      // Silent fail
    }
  }

  playButtonClick() {
    if (!this.sfxEnabled) return;
    try {
      this.synth.triggerAttackRelease('G4', '0.03n');
    } catch (e) {
      // Silent fail
    }
  }

  playTimerWarning() {
    if (!this.sfxEnabled) return;
    return;
  }

  playLevelUp() {
    if (!this.sfxEnabled) return;
    try {
      this.synth.triggerAttackRelease('C5', '0.2n');
    } catch (e) {
      // Silent fail
    }
  }
}

// Game Logic Functions
const generateQuestion = (
  level: number,
  order: typeof BASE_MENU_ITEMS[0][],
  questionType: QuestionType,
  currentMenuItems: typeof BASE_MENU_ITEMS,
  gameLevel?: number,
  gameMenuItems?: typeof BASE_MENU_ITEMS
): Question => {
  const orderTotal = order.reduce((sum, item) => sum + item.price, 0);
  
  switch (questionType) {
    case 'addition':
      return {
        type: 'addition',
        question: `What's the total for this order?`,
        options: generateOptions(orderTotal),
        correctAnswer: orderTotal,
        orderTotal,
      };
      
    case 'subtraction':
      const payment = orderTotal + Math.floor(Math.random() * 10) + 1;
      const change = payment - orderTotal;
      return {
        type: 'subtraction',
        question: `Customer pays $${payment} for $${orderTotal} order. What's the change?`,
        options: generateOptions(change),
        correctAnswer: change,
        orderTotal,
        payment,
      };
      
    case 'budget':
      // Use current game state for budget questions to match menu box
      const useGameLevel = gameLevel || level;
      const useMenuItems = gameMenuItems || currentMenuItems;
      const availableItems = useMenuItems.slice(0, LEVEL_CONFIG[useGameLevel - 1].menuItems);
      
      // Determine number of items based on level
      const minItems = useGameLevel >= 4 ? 2 : 2; // Level 3: 2-3, Level 4: 2-4
      const maxItems = useGameLevel >= 4 ? 4 : 3;
      const targetItemCount = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
      
      // Randomly select target combination
      const shuffledItems = [...availableItems].sort(() => Math.random() - 0.5);
      const targetCombination = shuffledItems.slice(0, targetItemCount);
      const targetTotal = targetCombination.reduce((sum, item) => sum + item.price, 0);
      
      // Set budget based on target combination (exact or small buffer)
      const budget = targetTotal + (Math.random() > 0.7 ? 1 : 0); // 30% chance for +$1 buffer
      
      return {
        type: 'budget',
        question: `Select items you can order with $${budget}`,
        options: shuffledItems.map(item => `${item.name} - $${item.price}`),
        correctAnswer: targetCombination.map(item => item.id).sort().join(','), // Store target item IDs
        budget,
        menuItems: shuffledItems, // Store all menu items for display
        targetCombination, // Store target combination for validation
      };
      
    case 'discount':
      // TODO: Temporarily disabled percentage discounts - only using fixed amount discounts for now
      const discountType = 'fixed'; // Math.random() > 0.5 ? 'percentage' : 'fixed';
      // const discountValue = discountType === 'percentage' ? 
      //   Math.floor(Math.random() * 30) + 10 : 
      //   Math.floor(Math.random() * 5) + 1;
      const discountValue = Math.floor(Math.random() * 5) + 1; // Fixed amount only
      
      // const discountedTotal = discountType === 'percentage' ? 
      //   Math.floor(orderTotal * (100 - discountValue) / 100) :
      //   Math.max(0, orderTotal - discountValue);
      const discountedTotal = Math.max(0, orderTotal - discountValue); // Fixed amount only
        
      return {
        type: 'discount',
        question: `Apply $${discountValue} discount to $${orderTotal} order:`,
        options: generateOptions(discountedTotal),
        correctAnswer: discountedTotal,
        orderTotal,
        discount: { type: discountType, value: discountValue },
      };
      
    default:
      return generateQuestion(level, order, 'addition', currentMenuItems);
  }
};

const generateOptions = (correct: number): string[] => {
  const options = [correct];
  while (options.length < 4) {
    const wrong = correct + Math.floor(Math.random() * 10) - 5;
    if (wrong > 0 && !options.includes(wrong)) {
      options.push(wrong);
    }
  }
  return options.sort(() => Math.random() - 0.5).map(n => `$${n}`);
};

const createCustomer = (
  level: number, 
  tableId: number, 
  currentMenuItems: typeof BASE_MENU_ITEMS,
  gameLevel?: number,
  gameMenuItems?: typeof BASE_MENU_ITEMS
): Customer => {
  const levelConfig = LEVEL_CONFIG[level - 1];
  const availableItems = currentMenuItems.slice(0, levelConfig.menuItems);
  
  // Determine question type based on level first
  let questionType: QuestionType = 'addition';
  
  if (level === 1) {
    questionType = 'addition'; // Level 1: Only addition
  } else if (level === 2) {
    questionType = Math.random() > 0.6 ? 'subtraction' : 'addition'; // Level 2: 40% subtraction, 60% addition
  } else if (level === 3) {
    const rand = Math.random();
    if (rand > 0.7) questionType = 'budget';        // 30% budget
    else if (rand > 0.35) questionType = 'subtraction'; // 35% subtraction  
    else questionType = 'addition';                // 35% addition
  } else if (level >= 4) {
    const rand = Math.random();
    if (rand > 0.8) questionType = 'discount';      // 20% discount
    else if (rand > 0.6) questionType = 'budget';  // 20% budget
    else if (rand > 0.3) questionType = 'subtraction'; // 30% subtraction
    else questionType = 'addition';                // 30% addition
  }
  
  // Generate random order (addition, subtraction, budget scale with level)
  let orderSize: number;
  if (questionType === 'addition') {
    const minItems = 1 + level; // Level 1=2 items, Level 2=3 items, etc.
    orderSize = Math.floor(Math.random() * 2) + minItems; // Level-based scaling
  } else if (questionType === 'subtraction' || questionType === 'budget') {
    const maxItems = 3 + level; // Level 1=4 max, Level 2=5 max, etc.
    orderSize = Math.floor(Math.random() * maxItems) + 1; // 1 to maxItems
  } else {
    orderSize = Math.floor(Math.random() * 3) + 1; // 1-3 items for discount
  }
  
  const order = [];
  for (let i = 0; i < orderSize; i++) {
    order.push(availableItems[Math.floor(Math.random() * availableItems.length)]);
  }
  
  return {
    id: `customer-${Date.now()}-${Math.random()}`,
    type: CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)],
    tableId,
    order,
    question: generateQuestion(level, order, questionType, currentMenuItems, gameLevel, gameMenuItems),
    patience: levelConfig.waitTime,
    maxPatience: levelConfig.waitTime,
    emotion: 'neutral',
    isAnswered: false,
    hasWarned: false,
  };
};

// Default settings
const defaultSettings: GameSettings = {
  level: 1,
  soundEnabled: true,
  sfxEnabled: true,
};

// Main Component
export const MathchaCafe: React.FC = () => {
  // Test configuration state
  const [testConfig, setTestConfig] = useState({
    START_LEVEL: TEST_CONFIG.START_LEVEL,
    START_SCORE: TEST_CONFIG.START_SCORE,
    ENABLE_TESTING: TEST_CONFIG.ENABLE_TESTING
  });

  // Background music manager using single audio instance
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  
  // Splash music manager using single audio instance
  const splashMusicRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize background music once
  useEffect(() => {
    if (!backgroundMusicRef.current) {
      const audio = new Audio('/mathcha-cafe-bg-music.mp3');
      audio.loop = true;
      audio.volume = 0.3;
      audio.preload = 'auto';
      backgroundMusicRef.current = audio;
    }
    
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
    };
  }, []);

  // Initialize splash music once
  useEffect(() => {
    if (!splashMusicRef.current) {
      const audio = new Audio('/mathcha-cafe-splash-music.mp3');
      audio.loop = true;
      audio.volume = 0.5;
      audio.preload = 'auto';
      splashMusicRef.current = audio;
    }
    
    // Reset music playing state on page refresh
    splashMusicPlayingRef.current = false;
    musicPlayingRef.current = false;
    
    return () => {
      if (splashMusicRef.current) {
        splashMusicRef.current.pause();
        splashMusicRef.current = null;
      }
    };
  }, []);

  // Game State
  const [gameState, setGameState] = useState<GameState>('splash');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const { updateGameState } = useGameState();
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('mathcha-cafe-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (error) {
      console.log('Failed to load settings from localStorage:', error);
      // Clear corrupted data and return defaults
      try {
        localStorage.removeItem('mathcha-cafe-settings');
      } catch (e) {
        // Silent fail if can't clear
      }
      return defaultSettings;
    }
  });

  // Music control functions
  const playMusic = useCallback(async () => {
    if (backgroundMusicRef.current && settings.soundEnabled) {
      try {
        // Ensure audio is loaded (same pattern as splash music)
        if (backgroundMusicRef.current.readyState < 2) {
          await new Promise((resolve) => {
            backgroundMusicRef.current!.addEventListener('canplay', resolve, { once: true });
            backgroundMusicRef.current!.load();
          });
        }
        await backgroundMusicRef.current.play();
        musicPlayingRef.current = true;
      } catch (error) {
        // Silent fail for autoplay restrictions
        musicPlayingRef.current = false;
      }
    }
  }, [settings.soundEnabled]);

  const pauseMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
    }
  }, []);

  const stopMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  }, []);

  // Splash music control functions
  const playSplashMusic = useCallback(async () => {
    if (splashMusicRef.current && settings.soundEnabled) {
      try {
        // Reset the audio to beginning
        splashMusicRef.current.currentTime = 0;
        // Ensure audio is loaded
        if (splashMusicRef.current.readyState < 2) {
          await new Promise((resolve) => {
            splashMusicRef.current!.addEventListener('canplay', resolve, { once: true });
            splashMusicRef.current!.load();
          });
        }
        await splashMusicRef.current.play();
        splashMusicPlayingRef.current = true;
      } catch (error) {
        // Silent fail for autoplay restrictions
      }
    }
  }, [settings.soundEnabled]);

  const pauseSplashMusic = useCallback(() => {
    if (splashMusicRef.current) {
      splashMusicRef.current.pause();
    }
  }, []);

  const stopSplashMusic = useCallback(() => {
    if (splashMusicRef.current) {
      splashMusicRef.current.pause();
      splashMusicRef.current.currentTime = 0;
    }
  }, []);
  
  // Game Data
  const [gameScore, setGameScore] = useState<GameScore>({
    score: 0,
    level: 1,
    customersServed: 0,
    accuracy: 100,
    timeBonus: 0,
  });
  
  // Session tracking for end screens
  const [sessionStats, setSessionStats] = useState({
    highestMastery: 0,
    totalGuestsServed: 0,
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [gameTimer, setGameTimer] = useState(0);
  const lastFrameTimeRef = useRef<number>(0);
  const [waveTimer, setWaveTimer] = useState(0);
  const [initialSpawnComplete, setInitialSpawnComplete] = useState(false);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [cashierMessage, setCashierMessage] = useState('');
  const [managerMessage, setManagerMessage] = useState('');
  const [managerMessageType, setManagerMessageType] = useState<'success' | 'failure' | 'timeout'>('success');
  const [showCashierBubble, setShowCashierBubble] = useState(false);
  const [showManagerBubble, setShowManagerBubble] = useState(false);
  const [usedCashierMessages, setUsedCashierMessages] = useState<string[]>([]);
  const [usedSuccessMessages, setUsedSuccessMessages] = useState<string[]>([]);
  const [usedFailMessages, setUsedFailMessages] = useState<string[]>([]);
  const [usedTimeoutMessages, setUsedTimeoutMessages] = useState<string[]>([]);
  const [newLevel, setNewLevel] = useState(1);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [levelUpCountdown, setLevelUpCountdown] = useState(3);
  const [menuItems, setMenuItems] = useState(() => randomizeMenuPrices());
  const [selectedBudgetItems, setSelectedBudgetItems] = useState<number[]>([]);
  
  // Refs
  const gameLoopRef = useRef<number | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const settingsRef = useRef<GameSettings>(settings);
  const cashierTimerRef = useRef<number>(0);
  const managerTimerRef = useRef<number>(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const musicPlayingRef = useRef<boolean>(false);
  const splashMusicPlayingRef = useRef<boolean>(false);
  
  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new AudioManager();
    audioManagerRef.current.setSFXEnabled(settings.sfxEnabled);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Safe music control functions to prevent double playing
  const safePlayMusic = useCallback(async () => {
    if (settings.soundEnabled && (gameState === 'playing' || gameState === 'levelUp') && !musicPlayingRef.current) {
      await playMusic();      
    }
  }, [playMusic, settings.soundEnabled, gameState]);

  const safePauseMusic = useCallback(() => {
    if (musicPlayingRef.current) {
      pauseMusic();
      musicPlayingRef.current = false;
    }
  }, [pauseMusic]);

  // Safe splash music control functions
  const safePlaySplashMusic = useCallback(async () => {
    if (settings.soundEnabled && gameState === 'splash' && !splashMusicPlayingRef.current) {
      await playSplashMusic();
      splashMusicPlayingRef.current = true;
    }
  }, [playSplashMusic, settings.soundEnabled, gameState]);

  const safePauseSplashMusic = useCallback(() => {
    if (splashMusicPlayingRef.current) {
      pauseSplashMusic();
      splashMusicPlayingRef.current = false;
    }
  }, [pauseSplashMusic]);


  // Handle splash music based on game state
  useEffect(() => {
    if (gameState === 'splash') {
      // Entering splash state - stop background music
      safePauseMusic();
      
      // Reset splash music state when entering splash screen
      if (!hasUserInteracted) {
        splashMusicPlayingRef.current = false;
        setShowContinueButton(false);
      }
      
      // Only play splash music if user has interacted
      if (hasUserInteracted) {
        // Reset splash music state to allow fresh start
        splashMusicPlayingRef.current = false;
        safePlaySplashMusic();
        // Show continue button after 3 seconds of music
        const timer = setTimeout(() => {
          setShowContinueButton(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      // Leaving splash state - stop splash music
      safePauseSplashMusic();
    }
  }, [gameState, safePauseMusic, safePauseSplashMusic, hasUserInteracted, safePlaySplashMusic]);

  // Broadcast game state changes to hide floating buttons during gameplay
  useEffect(() => {
    const isPlaying = gameState === 'playing';
    updateGameState('mathcha-cafe', isPlaying);
  }, [gameState, updateGameState]);

  // Trigger confetti on victory
  useEffect(() => {
    if (gameState === 'victory') {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Side cannons
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
      
      // Final celebration
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.4 }
        });
      }, 500);
    }
  }, [gameState]);
  
  // Update settings
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    const updated = { ...settingsRef.current, ...newSettings };
    settingsRef.current = updated;
    setSettings(updated);
    
    try {
      localStorage.setItem('mathcha-cafe-settings', JSON.stringify(updated));
    } catch (error) {
      console.log('Failed to save settings to localStorage:', error);
      // Continue without saving - app will use defaults next time
    }
    
    if (audioManagerRef.current) {
      audioManagerRef.current.setSFXEnabled(updated.sfxEnabled);
    }
    
    // Handle music enable/disable
    if ('soundEnabled' in newSettings) {
      if (!newSettings.soundEnabled) {
        if (backgroundMusicRef.current) {
          stopMusic();
          musicPlayingRef.current = false;
        }
        if (splashMusicRef.current) {
          stopSplashMusic();
          splashMusicPlayingRef.current = false;
        }
      }
    }
    
    Object.entries(newSettings).forEach(([key, value]) => {
      trackSettingsChange(key, value, 'mathcha-cafe');
    });
  }, [stopMusic, stopSplashMusic]);
  
  // Game Loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    // Use performance-based timing for high refresh rate devices
    const currentTime = performance.now();
    if (lastFrameTimeRef.current === 0) {
      lastFrameTimeRef.current = currentTime;
    }
    
    const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000; // Convert to seconds
    lastFrameTimeRef.current = currentTime;
    
    // Cap delta time to prevent huge jumps and ensure consistent 60fps equivalent
    const targetDelta = 1/60; // Target 60fps timing
    const clampedDelta = Math.min(deltaTime, targetDelta * 2); // Max 2 frames worth
    
    setGameTimer(prev => prev + clampedDelta);
    setWaveTimer(prev => prev + clampedDelta);
    
    // Update bubble message timers
    cashierTimerRef.current += 1/60;
    managerTimerRef.current += 1/60;
    
    // Show random cashier messages every 5-8 seconds
    if (cashierTimerRef.current >= 5 && Math.random() < 0.03) {
      const allMessages = [
        // Original messages
        'Fresh matcha latte!', 'Try our matcha special!', 'Best matcha in town!', 
        'Matcha magic awaits!', 'Premium matcha blend!', 'Matcha lovers welcome!',
        'Authentic Japanese matcha!', 'Creamy matcha goodness!', 'Matcha made perfect!',
        'Taste the difference!', 'Pure matcha bliss!', 'Handcrafted with love!',
        // Additional matcha-themed messages
        'Fresh matcha brewing!', 'Ceremonial grade matcha!', 'Whisked to perfection!', 
        'Zen in every sip!', 'Premium Uji matcha!', 'Matcha ceremony awaits!',
        'Stone-ground excellence!', 'Emerald green delight!', 'Traditional matcha art!',
        'Mindful matcha moments!', 'Pure matcha meditation!', 'Artisan matcha craft!'
      ];
      
      // Get unused messages, reset if all used
      let availableMessages = allMessages.filter(msg => !usedCashierMessages.includes(msg));
      if (availableMessages.length === 0) {
        availableMessages = allMessages;
        setUsedCashierMessages([]);
      }
      
      const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
      setCashierMessage(selectedMessage);
      setUsedCashierMessages(prev => [...prev, selectedMessage]);
      setShowCashierBubble(true);
      setTimeout(() => setShowCashierBubble(false), 3000);
      cashierTimerRef.current = 0;
    }
    
    // Update customer patience - simplified and more stable
    if (customers.length > 0) {
      setCustomers(prev => prev.map(customer => {
        if (customer.isAnswered) return customer;
        
        const newPatience = customer.patience - clampedDelta;
      if (newPatience <= 0 && customer.emotion !== 'angry') {
        audioManagerRef.current?.playAngryCustomer();
        
        // Show timeout failure message from manager
        const allTimeoutMessages = [
          // Keep existing matcha messages
          'Quicker whisking!', 'Customer wandered!', 'Swift like tea!', 'Time flows like water!', 'Faster brewing!', 
          'Keep the rhythm!', 'Swift tea service!', 'Time\'s flowing!', 'Quick matcha mind!', 
          'Tea rush hour!', 'Efficiency in motion!', 'Mindful speed!',
          // New matcha & cafe messages
          'Whisk with urgency!', 'Matcha cools quickly!', 'Steam rises fast!',
          'Guest patience fading!', 'Cafe rush demands speed!', 'Tea time is fleeting!',
          'Swift matcha mastery!', 'Quick cafe service!', 'Powder awaits action!',
          'Peak tea hour!', 'Rapid tea artistry!', 'Urgent hospitality needed!'
        ];
        
        let availableMessages = allTimeoutMessages.filter(msg => !usedTimeoutMessages.includes(msg));
        if (availableMessages.length === 0) {
          availableMessages = allTimeoutMessages;
          setUsedTimeoutMessages([]);
        }
        
        const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
        setManagerMessage(selectedMessage);
        setManagerMessageType('timeout');
        setUsedTimeoutMessages(prev => [...prev, selectedMessage]);
        setShowManagerBubble(true);
        setTimeout(() => setShowManagerBubble(false), 2000);
        managerTimerRef.current = 0;
        
        // Reduce score for patience timeout (matches level base points)
        const levelConfig = LEVEL_CONFIG[gameScore.level - 1];
        setGameScore(prev => ({
          ...prev,
          score: prev.score - levelConfig.multiplier // Penalty matches base points
        }));
        
        // If this customer is currently selected for a question, close the modal
        if (selectedCustomer && selectedCustomer.id === customer.id) {
          setSelectedBudgetItems([]);
          setSelectedCustomer(null);
        }
        
        return { ...customer, patience: -0.1, emotion: 'angry' as const, hasWarned: true };
      }
      
      // Only play warning sound once when patience hits 3 seconds
      if (newPatience <= 3 && customer.emotion === 'neutral' && !customer.hasWarned) {
        audioManagerRef.current?.playTimerWarning();
        // Continue with normal patience update but mark as warned
        return { ...customer, patience: Math.max(0, newPatience), hasWarned: true };
      }
      
        // Allow angry customers' patience to go negative for removal timing
        const minPatience = customer.emotion === 'angry' ? -5 : 0;
        return { ...customer, patience: Math.max(minPatience, newPatience) };
      }));
    }
    
    // Spawn new wave of customers (only after initial spawn is complete)
    const levelConfig = LEVEL_CONFIG[gameScore.level - 1];
    if (initialSpawnComplete && waveTimer >= 5 && customers.length < levelConfig.customers) {
      const emptyTables = Array.from({ length: 8 }, (_, i) => i)
        .filter(tableId => !customers.some(c => c.tableId === tableId));
      
      if (emptyTables.length > 0) {
        const tableId = emptyTables[Math.floor(Math.random() * emptyTables.length)];
        const newCustomer = createCustomer(gameScore.level, tableId, menuItems, gameScore.level, menuItems);
        setCustomers(prev => {
          // Double-check limit to prevent race conditions
          if (prev.length >= levelConfig.customers) {
            return prev;
          }
          return [...prev, newCustomer];
        });
        setWaveTimer(0);
      }
    }
    
    // Remove happy and angry customers after short time, spawn new ones
    setCustomers(prev => {
      const remaining = prev.filter(customer => {
        // Remove happy customers after 2 seconds
        if (customer.emotion === 'happy' && customer.patience <= (customer.maxPatience - 2)) {
          return false;
        }
        // Remove angry customers after 3 seconds
        if (customer.emotion === 'angry' && customer.patience <= -3) {
          return false;
        }
        return true;
      });
      
      // Spawn new customers to replace removed ones (only after initial spawn is complete)
      const levelConfig = LEVEL_CONFIG[gameScore.level - 1];
      if (initialSpawnComplete && remaining.length < levelConfig.customers && Math.random() < 0.1) {
        const emptyTables = Array.from({ length: 8 }, (_, i) => i)
          .filter(tableId => !remaining.some(c => c.tableId === tableId));
        
        if (emptyTables.length > 0 && remaining.length < levelConfig.customers) {
          const tableId = emptyTables[Math.floor(Math.random() * emptyTables.length)];
          const newCustomer = createCustomer(gameScore.level, tableId, menuItems, gameScore.level, menuItems);
          // Final check to prevent exceeding limit
          if (remaining.length < levelConfig.customers) {
            return [...remaining, newCustomer];
          }
        }
      }
      
      return remaining;
    });
    
    // Check level progression based on satisfied guests
    const currentConfig = LEVEL_CONFIG[gameScore.level - 1];
    if (gameScore.customersServed >= currentConfig.guestTarget) {
      if (gameScore.level < 4) {
        const nextLevel = gameScore.level + 1;
        setNewLevel(nextLevel);
        setGameScore(prev => ({ ...prev, level: nextLevel, customersServed: 0 }));
        setGameState('levelUp');
        setLevelUpCountdown(3);
        audioManagerRef.current?.playLevelUp();
        
        // Clear any existing countdown
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }

        // Start countdown timer
        let countdownValue = 3;
        countdownIntervalRef.current = setInterval(() => {
          countdownValue--;
          setLevelUpCountdown(countdownValue);
          
          if (countdownValue <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setGameState('playing');
            spawnStaggeredCustomers(nextLevel);
            setLevelUpCountdown(3); // Reset for next time
          }
        }, 1000);
      } else {
        setGameState('victory');
        audioManagerRef.current?.playLevelUp();
        stopMusic();
        musicPlayingRef.current = false;
        trackGameEvent('mathcha-cafe', 'complete', { 
          score: gameScore.score, 
          level: gameScore.level,
          accuracy: Math.round((correctAnswers / Math.max(1, totalAnswers)) * 100)
        });
        return;
      }
    }
    
    // Check game over condition when score goes below 0
    if (gameScore.score < 0) {
      setGameState('gameOver');
      audioManagerRef.current?.playGameOver();
      stopMusic();
      musicPlayingRef.current = false;
      trackGameEvent('mathcha-cafe', 'complete', { 
        score: Math.max(0, gameScore.score), 
        level: gameScore.level,
        reason: 'negative-score'
      });
      return;
    }
    
    if (gameState === 'playing' || gameState === 'levelUp') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, gameScore, customers, waveTimer, correctAnswers, totalAnswers, stopMusic]);
  
  // Start game loop - more stable with iOS fix
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'levelUp') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      
      // iOS fix: Add interval fallback for when requestAnimationFrame pauses
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      let intervalFallback: NodeJS.Timeout | null = null;
      
      if (isIOS) {
        intervalFallback = setInterval(() => {
          // Only run if requestAnimationFrame seems to have stopped
          if (gameLoopRef.current === null && (gameState === 'playing' || gameState === 'levelUp')) {
            gameLoop();
            gameLoopRef.current = requestAnimationFrame(gameLoop);
          }
        }, 100); // Check every 100ms
      }
      
      return () => {
        if (intervalFallback) {
          clearInterval(intervalFallback);
        }
      };
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);
  
  // Handle window focus/blur to pause/resume music with iOS fixes
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Window lost focus - pause music if playing
        safePauseMusic();
        safePauseSplashMusic();
      } else {
        // Window gained focus - resume music if game is playing
        safePlayMusic();
        safePlaySplashMusic();
        
        // iOS fix: Restart game loop if it stopped
        if (isIOS && (gameState === 'playing' || gameState === 'levelUp') && !gameLoopRef.current) {
          gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
      }
    };

    const handleWindowBlur = () => {
      // On iOS, don't pause music when modal opens to avoid breaking game loop
      if (!isIOS) {
        safePauseMusic();
        safePauseSplashMusic();
      }
    };

    const handleWindowFocus = () => {
      safePlayMusic();
      safePlaySplashMusic();
      
      // iOS fix: Ensure game loop is running
      if (isIOS && (gameState === 'playing' || gameState === 'levelUp') && !gameLoopRef.current) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };

    // Add multiple event listeners for better coverage
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [safePlayMusic, safePauseMusic, safePlaySplashMusic, safePauseSplashMusic, gameState, gameLoop]);
  
  // Game Actions
  // Function to spawn customers with staggered timing
  const spawnStaggeredCustomers = (level: number) => {
    const levelConfig = LEVEL_CONFIG[level - 1];
    const maxCustomers = levelConfig.customers;
    
    // Clear existing customers and reset spawn flag
    setCustomers([]);
    setInitialSpawnComplete(false);
    
    // Spawn all customers with increasing delays
    for (let i = 0; i < maxCustomers; i++) {
      const delay = (i * 3000) + Math.random() * 2000 + 1000; // Staggered: 1-3s, 4-6s, etc.
      setTimeout(() => {
        setCustomers(prev => {
          // Check if we're still within the level limit
          const currentLevelConfig = LEVEL_CONFIG[level - 1];
          if (prev.length >= currentLevelConfig.customers) {
            return prev; // Don't exceed level limit
          }
          
          // Find empty table
          const emptyTables = Array.from({ length: 8 }, (_, tableIndex) => tableIndex)
            .filter(tableId => !prev.some(c => c.tableId === tableId));
          
          if (emptyTables.length > 0) {
            const tableId = emptyTables[Math.floor(Math.random() * emptyTables.length)];
            const newCustomer = createCustomer(level, tableId, menuItems, level, menuItems);
            return [...prev, newCustomer];
          }
          return prev;
        });
      }, delay);
    }
    
    // Mark initial spawn as complete after the last customer should arrive
    const lastCustomerDelay = ((maxCustomers - 1) * 3000) + 3000; // Last customer + buffer
    setTimeout(() => {
      setInitialSpawnComplete(true);
    }, lastCustomerDelay + 1000);
  };

  const startGame = async () => {
    // Initialize audio context for mobile (don't await to preserve user gesture)
    try {
      if (Tone.getContext().state !== 'running') {
        Tone.start(); // Remove await to preserve user gesture context
      }
    } catch (error) {
      // Silent fail
    }

    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    setGameState('playing');
    
    // Use test configuration if enabled
    const startLevel = testConfig.ENABLE_TESTING ? testConfig.START_LEVEL : 1;
    const startScore = testConfig.ENABLE_TESTING ? testConfig.START_SCORE : 0;
    
    setGameScore({ score: startScore, level: startLevel, customersServed: 0, accuracy: 100, timeBonus: 0 });
    setSessionStats({ highestMastery: startScore, totalGuestsServed: 0 });
    setCustomers([]);
    setSelectedCustomer(null);
    setGameTimer(0);
    setWaveTimer(0);
    lastFrameTimeRef.current = 0; // Reset timing reference
    setTotalAnswers(0);
    setCorrectAnswers(0);
    setInitialSpawnComplete(false);
    setLevelUpCountdown(3);
    
    // Randomize menu prices for new game
    const newMenuItems = randomizeMenuPrices();
    setMenuItems(newMenuItems);
    
    // Use staggered spawning for the starting level
    spawnStaggeredCustomers(startLevel);
    
    trackGameEvent('mathcha-cafe', 'start', { level: settings.level });
    audioManagerRef.current?.playButtonClick();
    
    // Restart music if enabled (stop and start fresh)
    if (settings.soundEnabled) {
      stopMusic(); // Stop current music
      musicPlayingRef.current = false;
      // Play music immediately to maintain user gesture for iOS
      await playMusic();
    }
  };
  
  const pauseGame = () => {
    setGameState('paused');
    audioManagerRef.current?.playButtonClick();
    safePauseMusic();
  };
  
  const resumeGame = async () => {
    setGameState('playing');
    audioManagerRef.current?.playButtonClick();
    if (settings.soundEnabled && !musicPlayingRef.current) {
      // Call playMusic directly since we know game is resuming
      await playMusic();
    }
  };
  
  const restartGame = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    setShowRestartConfirm(false);
    startGame(); // Start a new game directly
  };

  const cancelRestart = () => {
    setShowRestartConfirm(false);
  };
  
  const goToMainMenu = () => {
    setGameState('setup');
    audioManagerRef.current?.playButtonClick();
    stopMusic();
    musicPlayingRef.current = false;
  };
  
  const selectCustomer = (customer: Customer) => {
    if (customer.isAnswered || customer.emotion === 'angry') return;
    setSelectedCustomer(customer);
    audioManagerRef.current?.playButtonClick();
  };
  
  const answerQuestion = (answerIndex: number) => {
    if (!selectedCustomer) return;
    
    let isCorrect = false;
    
    if (selectedCustomer.question.type === 'budget') {
      // For budget questions, this function shouldn't be called
      // Budget questions use submitBudgetAnswer instead
      return;
    } else {
      isCorrect = selectedCustomer.question.options[answerIndex] === `$${selectedCustomer.question.correctAnswer}`;
    }
    
    setTotalAnswers(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      
      // Update customer to happy (they'll leave soon)
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, emotion: 'happy' as const, isAnswered: true, patience: c.maxPatience - 1 }
          : c
      ));
      
      // Show success message from manager
      const allSuccessMessages = [
        // Keep existing matcha messages
        'Matcha mastery!', 'Perfect tea service!', 'Zen precision!', 'Tea ceremony worthy!', 'Outstanding brew!', 
        'Brilliant matcha skills!', 'Amazing technique!', 'Fantastic flow!', 'Keep brewing!', 
        'You\'re a matcha master!', 'Impressive tea work!',
        // New matcha & cafe messages
        'Exquisite whisking!', 'Ceremonial grade service!', 'Jade powder perfection!', 
        'Tea harmony achieved!', 'Sublime matcha craft!', 'Cafe excellence!',
        'Perfect guest service!', 'Matcha meditation success!', 'Tea artistry displayed!',
        'Flawless cafe rhythm!', 'Premium matcha quality!', 'Guest delight achieved!'
      ];
      
      let availableMessages = allSuccessMessages.filter(msg => !usedSuccessMessages.includes(msg));
      if (availableMessages.length === 0) {
        availableMessages = allSuccessMessages;
        setUsedSuccessMessages([]);
      }
      
      const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
      setManagerMessage(selectedMessage);
      setManagerMessageType('success');
      setUsedSuccessMessages(prev => [...prev, selectedMessage]);
      setShowManagerBubble(true);
      setTimeout(() => setShowManagerBubble(false), 2000);
      managerTimerRef.current = 0;
      
      // Update score
      const levelConfig = LEVEL_CONFIG[gameScore.level - 1];
      const points = levelConfig.multiplier;
      // Small time bonus for quick service - balanced to not overwhelm base scoring
      const patiencePercent = selectedCustomer.patience / selectedCustomer.maxPatience;
      const timeBonus = patiencePercent > 0.8 ? 1 : 0; // 1 bonus point if >80% patience remains
      
      setGameScore(prev => {
        const newScore = prev.score + points + timeBonus;
        setSessionStats(sessionPrev => ({
          ...sessionPrev,
          highestMastery: Math.max(sessionPrev.highestMastery, newScore),
          totalGuestsServed: sessionPrev.totalGuestsServed + 1,
        }));
        return {
          ...prev,
          score: newScore,
          customersServed: prev.customersServed + 1,
          accuracy: Math.round((correctAnswers + 1) / (totalAnswers + 1) * 100),
          timeBonus: prev.timeBonus + timeBonus,
        };
      });
      
      audioManagerRef.current?.playHappyCustomer();
      
      // Remove happy customer after 2 seconds
      setTimeout(() => {
        setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      }, 2000);
      
    } else {
      // Wrong answer - make customer angry and reduce score
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, emotion: 'angry' as const, patience: -1 }
          : c
      ));
      
      // Reduce score for wrong answer (matches level base points)
      const levelConfig = LEVEL_CONFIG[gameScore.level - 1];
      setGameScore(prev => ({
        ...prev,
        score: prev.score - levelConfig.multiplier // Penalty matches base points
      }));
      
      audioManagerRef.current?.playAngryCustomer();
      
      // Show failure message from manager
      const allFailMessages = [
        // Keep existing matcha messages
        'Breathe and brew!', 'Find your zen!', 'Focus your chi!', 'Channel matcha energy!', 'Stay centered!', 
        'Keep practicing!', 'Almost perfect!', 'Mindful moment!', 
        'No rush, just flow!', 'Practice makes mastery!', 'You\'ve got the spirit!',
        // New matcha & cafe messages
        'Re-whisk with care!', 'Perfect the powder ratio!', 'Study the tea way!', 
        'Meditate on matcha!', 'Center your cafe focus!', 'Trust the brewing process!',
        'Review the tea order!', 'Mind the guest timing!', 'Practice tea precision!',
        'Refine your technique!', 'Balance like matcha foam!', 'Cafe wisdom grows!'
      ];
      
      let availableMessages = allFailMessages.filter(msg => !usedFailMessages.includes(msg));
      if (availableMessages.length === 0) {
        availableMessages = allFailMessages;
        setUsedFailMessages([]);
      }
      
      const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
      setManagerMessage(selectedMessage);
      setManagerMessageType('failure');
      setUsedFailMessages(prev => [...prev, selectedMessage]);
      setShowManagerBubble(true);
      setTimeout(() => setShowManagerBubble(false), 2000);
      managerTimerRef.current = 0;
    }
    
    setSelectedBudgetItems([]);
    setSelectedCustomer(null);
    trackGameEvent('mathcha-cafe', 'view', { 
      correct: isCorrect, 
      questionType: selectedCustomer.question.type,
      level: gameScore.level
    });
  };

  const submitBudgetAnswer = () => {
    if (!selectedCustomer || selectedCustomer.question.type !== 'budget') return;
    
    // Calculate total cost of selected items
    const selectedItems = selectedBudgetItems.map(index => 
      selectedCustomer.question.menuItems![index]
    );
    const totalCost = selectedItems.reduce((sum, item) => sum + item.price, 0);
    const budget = selectedCustomer.question.budget!;
    
    // Check for correctness: total cost must exactly match the budget
    const isCorrect = selectedBudgetItems.length > 0 && totalCost === budget;
    
    setTotalAnswers(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      
      // Update customer to happy (they'll leave soon)
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, emotion: 'happy' as const, isAnswered: true, patience: c.maxPatience - 1 }
          : c
      ));
      
      // Show success message from manager
      const allSuccessMessages = [
        // Keep existing matcha messages
        'Matcha mastery!', 'Perfect tea service!', 'Zen precision!', 'Tea ceremony worthy!', 'Outstanding brew!', 
        'Brilliant matcha skills!', 'Amazing technique!', 'Fantastic flow!', 'Keep brewing!', 
        'You\'re a matcha master!', 'Impressive tea work!',
        // New matcha & cafe messages
        'Exquisite whisking!', 'Ceremonial grade service!', 'Jade powder perfection!', 
        'Tea harmony achieved!', 'Sublime matcha craft!', 'Cafe excellence!',
        'Perfect guest service!', 'Matcha meditation success!', 'Tea artistry displayed!',
        'Flawless cafe rhythm!', 'Premium matcha quality!', 'Guest delight achieved!'
      ];
      
      let availableMessages = allSuccessMessages.filter(msg => !usedSuccessMessages.includes(msg));
      if (availableMessages.length === 0) {
        availableMessages = allSuccessMessages;
        setUsedSuccessMessages([]);
      }
      
      const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
      setManagerMessage(selectedMessage);
      setManagerMessageType('success');
      setUsedSuccessMessages(prev => [...prev, selectedMessage]);
      setShowManagerBubble(true);
      setTimeout(() => setShowManagerBubble(false), 2000);
      managerTimerRef.current = 0;
      
      // Update score
      const levelConfig = LEVEL_CONFIG[gameScore.level - 1];
      const points = levelConfig.multiplier;
      // Small time bonus for quick service - balanced to not overwhelm base scoring
      const patiencePercent = selectedCustomer.patience / selectedCustomer.maxPatience;
      const timeBonus = patiencePercent > 0.8 ? 1 : 0; // 1 bonus point if >80% patience remains
      
      setGameScore(prev => {
        const newScore = prev.score + points + timeBonus;
        setSessionStats(sessionPrev => ({
          ...sessionPrev,
          highestMastery: Math.max(sessionPrev.highestMastery, newScore),
          totalGuestsServed: sessionPrev.totalGuestsServed + 1,
        }));
        return {
          ...prev,
          score: newScore,
          customersServed: prev.customersServed + 1,
          accuracy: Math.round((correctAnswers + 1) / (totalAnswers + 1) * 100),
          timeBonus: prev.timeBonus + timeBonus,
        };
      });
      
      audioManagerRef.current?.playHappyCustomer();
      
      // Remove happy customer after 2 seconds
      setTimeout(() => {
        setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      }, 2000);
      
    } else {
      // Wrong answer - make customer angry and reduce score
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, emotion: 'angry' as const, patience: -1 }
          : c
      ));
      
      // Reduce score for wrong answer (matches level base points)
      const levelConfig = LEVEL_CONFIG[gameScore.level - 1];
      setGameScore(prev => ({
        ...prev,
        score: prev.score - levelConfig.multiplier // Penalty matches base points
      }));
      
      audioManagerRef.current?.playAngryCustomer();
      
      // Show failure message from manager
      const allFailMessages = [
        // Keep existing matcha messages
        'Breathe and brew!', 'Find your zen!', 'Focus your chi!', 'Channel matcha energy!', 'Stay centered!', 
        'Keep practicing!', 'Almost perfect!', 'Mindful moment!', 
        'No rush, just flow!', 'Practice makes mastery!', 'You\'ve got the spirit!',
        // New matcha & cafe messages
        'Re-whisk with care!', 'Perfect the powder ratio!', 'Study the tea way!', 
        'Meditate on matcha!', 'Center your cafe focus!', 'Trust the brewing process!',
        'Review the tea order!', 'Mind the guest timing!', 'Practice tea precision!',
        'Refine your technique!', 'Balance like matcha foam!', 'Cafe wisdom grows!'
      ];
      
      let availableMessages = allFailMessages.filter(msg => !usedFailMessages.includes(msg));
      if (availableMessages.length === 0) {
        availableMessages = allFailMessages;
        setUsedFailMessages([]);
      }
      
      const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
      setManagerMessage(selectedMessage);
      setManagerMessageType('failure');
      setUsedFailMessages(prev => [...prev, selectedMessage]);
      setShowManagerBubble(true);
      setTimeout(() => setShowManagerBubble(false), 2000);
      managerTimerRef.current = 0;
    }
    
    // Reset selected items and close modal
    setSelectedBudgetItems([]);
    setSelectedCustomer(null);
    trackGameEvent('mathcha-cafe', 'view', { 
      correct: isCorrect, 
      questionType: selectedCustomer.question.type,
      level: gameScore.level
    });
  };
  
  const closeQuestion = () => {
    setSelectedCustomer(null);
    setSelectedBudgetItems([]);
    audioManagerRef.current?.playButtonClick();
  };
  
  // Use default theme
  const theme = THEME;
  
  // Helper function to format game time
  const formatGameTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Render functions
  const renderSplashScreen = () => {
    const iosSmallScreen = isIOSSmallScreen();
    
    return (
      <div 
        className="fixed inset-0 w-full h-full overflow-hidden cursor-pointer sm:bg-gradient-to-br sm:from-green-100 sm:via-amber-50 sm:to-green-200 sm:flex sm:items-center sm:justify-center sm:p-4"
        style={iosSmallScreen ? {
          height: '100dvh', // Dynamic viewport height for iOS
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        } : {}}
        onClick={() => {
          if (!hasUserInteracted) {
            setHasUserInteracted(true);
          } else if (showContinueButton) {
            setGameState('setup');
          }
        }}
        onTouchStart={() => {
          if (!hasUserInteracted) {
            setHasUserInteracted(true);
          }
        }}
      >
        {/* Mobile: Full screen image with overlay text */}
        <div 
          className="sm:hidden relative w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 via-amber-50 to-green-200"
          style={iosSmallScreen ? {
            height: '100dvh',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          } : {}}
        >
          <img 
            src="/mathcha-cafe-title.png" 
            alt="Mathcha Cafe" 
            className="max-w-full max-h-full w-auto h-auto object-contain"
            style={iosSmallScreen ? {
              maxWidth: '90%',
              maxHeight: '70%',
              objectFit: 'contain'
            } : {}}
          />
          <div 
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-lg font-bold animate-pulse bg-black/30 px-6 py-3 rounded-full"
            style={iosSmallScreen ? {
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '16px',
              padding: '12px 24px'
            } : {}}
          >
            {!hasUserInteracted ? 'Tap to Start' : (showContinueButton ? 'Tap to Continue' : 'Loading...')}
          </div>
        </div>
        
        {/* Desktop: Centered with background */}
        <div className="hidden sm:block relative text-center">
          <img 
            src="/mathcha-cafe-title.png" 
            alt="Mathcha Cafe" 
            className="max-w-full max-h-[70vh] w-auto h-auto object-contain mx-auto"
          />
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold animate-pulse bg-black/30 px-6 py-3 rounded-full">
            {!hasUserInteracted ? 'Tap to Start' : (showContinueButton ? 'Tap to Continue' : 'Loading...')}
          </div>
        </div>
      </div>
    );
  };

  const renderSetupScreen = () => (
    <div className={`min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] bg-gradient-to-br ${theme.playingBg} p-4`}>
      <div className="max-w-2xl mx-auto">
        <div className={`${theme.cardBg} rounded-3xl shadow-2xl p-8 text-center`}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-5xl text-green-600 opacity-70 font-bold">+</span>
            <span className="text-5xl text-green-600 opacity-70 font-bold">-</span>
            <span className="text-6xl">🍵</span>
            <span className="text-5xl text-green-600 opacity-70 font-bold">×</span>
            <span className="text-5xl text-green-600 opacity-70 font-bold">÷</span>
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${theme.accent}`}>Mathcha Cafe</h1>
          {/* TODO: Temporary start level selection for testing - remove before production */}
          {testConfig.ENABLE_TESTING && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-3 mb-3">
              <label className="text-sm text-yellow-800 font-medium">🧪 Test Start Level:</label>
              <select 
                className="px-2 py-1 rounded border border-yellow-400 bg-white text-sm"
                value={testConfig.START_LEVEL}
                onChange={(e) => {
                  setTestConfig(prev => ({
                    ...prev,
                    START_LEVEL: parseInt(e.target.value),
                    ENABLE_TESTING: true
                  }));
                }}
              >
                <option value={1}>Level 1</option>
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
                <option value={4}>Level 4</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setGameState('victory')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
              >
                🎉 Test Victory Confetti
              </button>
            </div>
          </div>
          )}
          <p className="text-gray-600 mb-6">Master the art of matcha service through mindful mathematics!</p>
          
          {/* Game Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">🍵 How to Play</h3>
            <div className="space-y-3 text-sm text-green-700">
              <div className="flex items-start gap-3">
                <span className="text-lg">👥</span>
                <div><strong>Serve customers:</strong> Click on customers who arrive at tables</div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🧮</span>
                <div><strong>Solve math questions:</strong> Calculate totals, change, discounts, and budgets to earn mastery points</div>
              </div>              
              <div className="flex items-start gap-3">
                <span className="text-lg">⏰</span>
                <div><strong>Serve quickly:</strong> Customers lose patience if you take too long</div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">😊</span>
                <div><strong>Level up:</strong> Serve enough happy guests to advance levels</div>
              </div>              
              <div className="flex items-start gap-3">
                <span className="text-lg">🎯</span>
                <div><strong>Goal:</strong> Complete all 4 levels to become a true Mathcha Master! Losing mastery below 0 will end the game</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  settings.soundEnabled
                    ? `${theme.button} text-white`
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                Music
              </button>
              
              <button
                onClick={() => updateSettings({ sfxEnabled: !settings.sfxEnabled })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  settings.sfxEnabled
                    ? `${theme.button} text-white`
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {settings.sfxEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                SFX
              </button>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className={`${theme.button} text-white px-8 py-3 rounded-xl text-lg font-semibold hover:scale-105 transition-transform`}
          >
            <Play className="inline mr-2" size={20} />
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderGameScreen = () => (
    <div className={`min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] bg-gradient-to-br ${theme.playingBg} p-4`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div className="flex flex-wrap gap-1 sm:gap-4 text-xs sm:text-lg font-semibold">
          <div className={`${theme.accent} flex items-center gap-1`}>
            <span className="text-sm sm:text-base">🍵</span>
            Mastery: {Math.max(0, gameScore.score)}
          </div>
          <div className={`${theme.accent} flex items-center gap-1`}>
            <span className="text-sm sm:text-base">🌟</span>
            Level: {gameScore.level}
          </div>
          <div className={`${theme.accent} flex items-center gap-1`}>
            <span className="text-sm sm:text-base">👥</span>
            Served: {gameScore.customersServed}
          </div>
          <div className={`${theme.accent} flex items-center gap-1`}>
            <span className="text-sm sm:text-base">😊</span>
            Happy Guests: {gameScore.customersServed}/{LEVEL_CONFIG[gameScore.level - 1].guestTarget}
          </div>
          <div className={`${theme.accent} flex items-center gap-1`}>
            <span className="text-sm sm:text-base">🌿</span>
            Harmony: {Math.round((correctAnswers / Math.max(1, totalAnswers)) * 100)}%
          </div>
          <div className={`${theme.accent} flex items-center gap-1`}>
            <Clock size={16} className="sm:w-5 sm:h-5" />
            {Math.floor(gameTimer / 60)}:{(Math.floor(gameTimer % 60)).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={pauseGame}
            className={`${theme.button} text-white p-2 rounded-lg hover:scale-105 transition-transform`}
          >
            <Pause size={20} />
          </button>
          <button
            onClick={restartGame}
            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg hover:scale-105 transition-transform"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
      
      {/* Game Area */}
      <div 
        className={`${theme.cardBg} rounded-3xl shadow-2xl p-2 sm:p-6 h-[calc(100vh-9rem)] sm:h-[560px] relative flex flex-col sm:block overflow-hidden`}
        style={{
          backgroundImage: 'url(/tile.png)',
          backgroundSize: 'auto',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'top left'
        }}
      >
        
        {/* Mobile Portrait Layout */}
        <div className="sm:hidden flex flex-col h-full max-h-full overflow-hidden">
          {/* Top Section: Menu */}
          <div className="flex-shrink-0 mb-1">
            <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white p-2 rounded-lg mx-auto w-fit max-w-xs min-w-64 shadow-xl border-2 border-green-600 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-400/20 rounded-full transform translate-x-2 -translate-y-2"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 bg-green-400/20 rounded-full transform -translate-x-1 translate-y-1"></div>
              
              <h3 className="font-bold mb-1.5 text-xs text-center flex items-center justify-center gap-1.5">
                <span className="text-sm">🍵</span>
                <span className="text-yellow-300">Matcha Menu</span>
                <span className="text-sm">🍃</span>
              </h3>
              <div className={`grid grid-cols-2 gap-1 text-xs relative z-10`}>
                {menuItems.slice(0, LEVEL_CONFIG[gameScore.level - 1].menuItems).map((item: typeof BASE_MENU_ITEMS[0]) => (
                  <div key={item.id} className={`flex justify-between ${gameScore.level >= 2 ? 'min-w-8 p-0.5' : 'min-w-10 p-0.5'} bg-green-800/40 rounded-md hover:bg-green-700/50 transition-colors`}>
                    <span className="font-medium text-xs">{item.icon} {item.name}</span>
                    <span className="text-yellow-300 font-bold text-xs">${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Middle Section: Customer Tables - Mobile Vertical 2x4 */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }, (_, i) => {
                const customer = customers.find(c => c.tableId === i);
                return (
                  <div key={i} className="relative">
                    {/* Table */}
                    <div 
                      className={`${gameScore.level === 4 ? 'w-14 h-14' : gameScore.level >= 2 ? 'w-16 h-16' : 'w-20 h-20'} flex items-center justify-center relative z-10 ${
                        customer ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                      }`}
                      onClick={customer ? () => selectCustomer(customer) : undefined}
                    >
                      <img 
                        src="/matcha-table.png" 
                        alt="Table" 
                        className={`${gameScore.level === 4 ? 'w-14 h-14' : gameScore.level >= 2 ? 'w-16 h-16' : 'w-20 h-20'} object-contain`}
                      />
                      
                      {/* Menu icon on table when guest is present */}
                      {customer && (
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-20">
                          <span className="text-lg drop-shadow-md">
                            {(() => {
                              // Use customer ID to get consistent random selection
                              let hash = 0;
                              for (let j = 0; j < customer.id.length; j++) {
                                hash = ((hash << 5) - hash) + customer.id.charCodeAt(j);
                                hash = hash & hash;
                              }
                              const index = Math.abs(hash) % customer.order.length;
                              return customer.order[index].icon;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Customer - positioned on left or right side of table */}
                    {customer && (() => {
                      // Mobile 2x4 grid: alternate left/right based on column position
                      const isLeftColumn = i % 2 === 0; // Even indices (0,2,4,6) are left column
                      const positionClass = isLeftColumn 
                        ? 'left-0 top-1/2 transform -translate-x-full -translate-y-1/2' 
                        : 'right-0 top-1/2 transform translate-x-full -translate-y-1/2';
                      
                      return (
                        <div
                          className={`absolute ${positionClass} cursor-pointer hover:scale-110 transition-transform z-0`}
                          onClick={() => selectCustomer(customer)}
                        >
                          <img 
                            src={customer.type.avatar} 
                            alt={customer.type.name}
                            className={`${gameScore.level === 4 ? 'w-16 h-16' : gameScore.level >= 2 ? 'w-20 h-20' : 'w-24 h-24'} scale-90 sm:scale-50 object-contain filter ${
                              customer.emotion === 'happy' ? 'brightness-110' :
                              customer.emotion === 'angry' ? 'brightness-75 saturate-150' :
                              ''
                            }`}
                          />
                          
                          {/* Emotion Indicator - positioned above guest avatar */}
                          {customer.emotion !== 'neutral' && (
                            <div className="absolute -top-6 sm:-top-5 left-1/2 transform -translate-x-1/2 z-20">
                              {customer.emotion === 'happy' && (
                                <img 
                                  src={getRandomEmotionAsset('happy', customer.id)} 
                                  alt="Happy" 
                                  className="w-6 h-6 object-contain animate-bounce drop-shadow-md"
                                />
                              )}
                              {customer.emotion === 'angry' && (
                                <img 
                                  src={getRandomEmotionAsset('angry', customer.id)} 
                                  alt="Angry" 
                                  className="w-6 h-6 object-contain animate-pulse drop-shadow-md"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Patience Bar */}
                    {customer && !customer.isAnswered && (
                      <div className={`absolute -bottom-3 left-0 ${gameScore.level === 4 ? 'w-14' : gameScore.level >= 2 ? 'w-16' : 'w-20'} h-2 bg-gray-300 rounded-full overflow-hidden`}>
                        <div 
                          className={`h-full ${
                            customer.patience / customer.maxPatience > 0.5 ? 'bg-green-500' :
                            customer.patience / customer.maxPatience > 0.2 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(0, (customer.patience / customer.maxPatience) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Bottom Section: Staff */}
          <div className="flex justify-between items-end mt-auto">
            {/* Cashier */}
            <div className="flex items-end gap-2">
              <img 
                src="/robo-cashier.png" 
                alt="Robo Cashier"
                className="w-14 h-14 object-contain"
              />
              <div className="mb-1">
                <div className="bg-green-100 border border-green-300 rounded px-2 py-1">
                  <div className="font-semibold text-[10px] text-green-800">Robo Cashier</div>
                  <div className="text-[9px] text-green-600">Matcha Bot</div>
                </div>
              </div>
            </div>
            
            {/* Manager */}
            <div className="flex items-end gap-2 mt-1">
              <img 
                src="/tea-master.png" 
                alt="Tea Master"
                className="w-14 h-14 object-contain"
              />
              <div className="mb-1">
                <div className="bg-green-100 border border-green-300 rounded px-2 py-1">
                  <div className="font-semibold text-[10px] text-green-800">Tea Master</div>
                  <div className="text-[9px] text-green-600">Matcha Sensei</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Speech Bubbles for Mobile */}
          {showCashierBubble && (
            <div className="absolute bottom-20 left-2 bg-gradient-to-br from-green-50 to-green-100 text-green-800 px-2 py-1 rounded-lg text-xs shadow-lg border border-green-400 max-w-32 text-center z-10 animate-pulse">
              <div className="font-medium">{cashierMessage}</div>
            </div>
          )}
          
          {showManagerBubble && (() => {
            const colors = {
              success: { bg: 'from-green-50 to-green-100', text: 'text-green-800', border: 'border-green-500' },
              failure: { bg: 'from-amber-50 to-amber-100', text: 'text-amber-800', border: 'border-amber-500' },
              timeout: { bg: 'from-red-50 to-red-100', text: 'text-red-800', border: 'border-red-500' }
            };
            const color = colors[managerMessageType];
            
            return (
              <div className={`absolute bottom-20 right-2 bg-gradient-to-br ${color.bg} ${color.text} px-2 py-1 rounded-lg text-xs shadow-lg border ${color.border} max-w-32 text-center z-10 animate-bounce`}>
                <div className="font-semibold">{managerMessage}</div>
              </div>
            );
          })()}
        </div>

        {/* Desktop Layout (hidden on mobile) */}
        <div className="hidden sm:block">
          {/* Menu Board */}
          <div className="absolute top-0 left-0 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white p-4 rounded-2xl w-72 shadow-2xl border-3 border-green-600 relative overflow-hidden transform hover:scale-105 transition-transform">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-2 text-4xl">🍵</div>
              <div className="absolute bottom-2 left-2 text-3xl">🍃</div>
              <div className="absolute top-1/2 right-6 text-2xl">✨</div>
            </div>
            
            {/* Corner decorations */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-400/20 rounded-full transform translate-x-3 -translate-y-3"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-green-400/20 rounded-full transform -translate-x-2 translate-y-2"></div>
            
            <h3 className="font-bold mb-3 text-lg text-center relative z-10 flex items-center justify-center gap-2">
              <span className="text-xl animate-pulse">🍵</span>
              <span className="text-yellow-300 tracking-wide">Matcha Menu</span>
              <span className="text-xl animate-pulse">🍃</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs relative z-10">
              {menuItems.slice(0, LEVEL_CONFIG[gameScore.level - 1].menuItems).map((item: typeof BASE_MENU_ITEMS[0]) => (
                <div key={item.id} className="flex justify-between bg-green-800/50 rounded-lg p-2 hover:bg-green-700/60 transition-all hover:scale-105 border border-green-600/30">
                  <span className="font-medium flex items-center gap-1">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs">{item.name}</span>
                  </span>
                  <span className="text-yellow-300 font-bold text-sm">${item.price}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Cashier/Ordering Counter */}
          <div className="absolute bottom-8 left-4 flex items-end gap-4">
            <img 
              src="/robo-cashier.png" 
              alt="Robo Cashier"
              className="w-20 h-20 object-contain scale-150 hover:scale-[1.6] transition-transform"
            />
            <div className="flex-1 mb-2">
              <div className="bg-green-100 border border-green-300 rounded px-3 py-2">
                <div className="font-semibold text-sm text-green-800">Robo Cashier</div>
                <div className="text-xs text-green-600">Matcha Bot</div>
              </div>
            </div>
          </div>
          
          {/* Cashier Speech Bubble */}
          {showCashierBubble && (
            <div className="absolute bottom-36 left-4 bg-gradient-to-br from-green-50 to-green-100 text-green-800 px-4 py-3 rounded-2xl text-sm shadow-xl border-2 border-green-400 max-w-80 text-center z-10 animate-pulse">
              <div className="font-medium">{cashierMessage}</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-transparent border-t-green-50"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-green-100"></div>
              </div>
            </div>
          )}
          
          {/* Manager */}
          <div className="absolute bottom-6 right-4 flex items-end gap-4">
            <div className="flex-1 mb-2">
              <div className="bg-green-100 border border-green-300 rounded px-3 py-2">
                <div className="font-semibold text-sm text-green-800">Tea Master</div>
                <div className="text-xs text-green-600">Matcha Sensei</div>
              </div>
            </div>
            <img 
              src="/tea-master.png" 
              alt="Tea Master"
              className="w-20 h-20 object-contain scale-150 hover:scale-[1.6] transition-transform"
            />
          </div>
          
          {/* Manager Speech Bubble */}
          {showManagerBubble && (() => {
            const colors = {
              success: {
                bg: 'from-green-50 to-green-100',
                text: 'text-green-800',
                border: 'border-green-500',
                arrow1: 'border-t-green-50',
                arrow2: 'border-t-green-100'
              },
              failure: {
                bg: 'from-amber-50 to-amber-100',
                text: 'text-amber-800',
                border: 'border-amber-500',
                arrow1: 'border-t-amber-50',
                arrow2: 'border-t-amber-100'
              },
              timeout: {
                bg: 'from-red-50 to-red-100',
                text: 'text-red-800',
                border: 'border-red-500',
                arrow1: 'border-t-red-50',
                arrow2: 'border-t-red-100'
              }
            };
            const color = colors[managerMessageType];
            
            return (
              <div className={`absolute bottom-32 right-4 bg-gradient-to-br ${color.bg} ${color.text} px-4 py-3 rounded-2xl text-sm shadow-xl border-2 ${color.border} max-w-80 text-center z-10 animate-bounce`}>
                <div className="font-semibold">{managerMessage}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className={`w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-transparent ${color.arrow1}`}></div>
                  <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent ${color.arrow2}`}></div>
                </div>
              </div>
            );
          })()}
          
          {/* Customer Tables */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 gap-x-12 gap-y-24">
            {Array.from({ length: 8 }, (_, i) => {
              const customer = customers.find(c => c.tableId === i);
              return (
                <div key={i} className="relative">
                  {/* Table */}
                  <div 
                    className={`w-24 h-24 flex items-center justify-center relative z-10 ${
                      customer ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                    }`}
                    onClick={customer ? () => selectCustomer(customer) : undefined}
                  >
                    <img 
                      src="/matcha-table.png" 
                      alt="Table" 
                      className="w-24 h-24 object-contain"
                    />
                    
                    {/* Menu icon on table when guest is present */}
                    {customer && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
                        <span className="text-2xl drop-shadow-lg">
                          {(() => {
                            // Use customer ID to get consistent random selection
                            let hash = 0;
                            for (let j = 0; j < customer.id.length; j++) {
                              hash = ((hash << 5) - hash) + customer.id.charCodeAt(j);
                              hash = hash & hash;
                            }
                            const index = Math.abs(hash) % customer.order.length;
                            return customer.order[index].icon;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Customer - positioned higher and scaled up */}
                  {customer && (
                    <div
                      className="absolute top-4 left-1/2 transform -translate-x-1/2 -translate-y-3/4 scale-[2.3] cursor-pointer hover:scale-[2.5] transition-transform z-0"
                      onClick={() => selectCustomer(customer)}
                    >
                      <img 
                        src={customer.type.avatar} 
                        alt={customer.type.name}
                        className={`w-32 h-32 scale-90 sm:scale-50 object-contain filter ${
                          customer.emotion === 'happy' ? 'brightness-110' :
                          customer.emotion === 'angry' ? 'brightness-75 saturate-150' :
                          ''
                        }`}
                      />
                      
                    </div>
                  )}
                  
                  {/* Emotion Indicator - positioned relative to table, above guest */}
                  {customer && customer.emotion !== 'neutral' && (
                    <div className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-30">
                      {customer.emotion === 'happy' && (
                        <img 
                          src={getRandomEmotionAsset('happy', customer.id)} 
                          alt="Happy" 
                          className="w-8 h-8 object-contain animate-bounce drop-shadow-lg"
                        />
                      )}
                      {customer.emotion === 'angry' && (
                        <img 
                          src={getRandomEmotionAsset('angry', customer.id)} 
                          alt="Angry" 
                          className="w-8 h-8 object-contain animate-pulse drop-shadow-lg"
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Patience Bar */}
                  {customer && !customer.isAnswered && (
                    <div className="absolute -bottom-4 left-0 w-24 h-3 bg-gray-300 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          customer.patience / customer.maxPatience > 0.5 ? 'bg-green-500' :
                          customer.patience / customer.maxPatience > 0.2 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(0, (customer.patience / customer.maxPatience) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Question Modal */}
      {selectedCustomer && (() => {
        // Get the current customer state from the customers array to ensure sync
        const currentCustomer = customers.find(c => c.id === selectedCustomer.id) || selectedCustomer;
        const questionTheme = QUESTION_THEMES[currentCustomer.question.type];
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`bg-gradient-to-br ${questionTheme.bgGradient} rounded-2xl p-6 max-w-md w-full border-2 ${questionTheme.borderColor} shadow-2xl`}>
              {/* Question Type Header */}
              <div className={`${questionTheme.headerBg} rounded-xl p-3 mb-4 text-center border ${questionTheme.borderColor}`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">{questionTheme.icon}</span>
                  <h3 className={`text-lg font-bold ${questionTheme.textColor}`}>{questionTheme.name}</h3>
                </div>
                <div className={`text-xs ${questionTheme.textColor} opacity-75`}>{questionTheme.description}</div>
              </div>

              <div className="text-center mb-4">
                <div className="mb-2 flex justify-center">
                  <img 
                    src={currentCustomer.type.avatar} 
                    alt={currentCustomer.type.name}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h3 className={`text-lg font-semibold ${questionTheme.textColor}`}>Customer Order</h3>
                {/* Patience Timer in Modal */}
                <div className="mt-3 mx-auto w-48 h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      currentCustomer.patience / currentCustomer.maxPatience > 0.5 ? 'bg-green-500' :
                      currentCustomer.patience / currentCustomer.maxPatience > 0.2 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(0, (currentCustomer.patience / currentCustomer.maxPatience) * 100)}%` }}
                  />
                </div>
                <div className={`text-xs ${questionTheme.textColor} opacity-75 mt-1`}>Customer Patience: {Math.ceil(currentCustomer.patience)}s</div>
              </div>
            
              {/* Show order only for non-budget questions */}
              {currentCustomer.question.type !== 'budget' && (
                <div className="mb-4">
                  <div className={`font-medium mb-2 ${questionTheme.textColor}`}>Order:</div>
                  <div className={`text-sm ${questionTheme.textColor} opacity-80 mb-4`}>
                    {currentCustomer.order.map((item, index) => (
                      <div key={`order-${item.id}-${index}`} className="flex justify-between">
                        <span>{item.icon} {item.name}</span>
                        <span>${item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <div className={`font-medium mb-3 ${questionTheme.textColor}`}>{currentCustomer.question.question}</div>
                
                {currentCustomer.question.type === 'budget' ? (
                  // Budget questions: Show compact menu with toggle buttons
                  <>
                    <div className={`bg-white/10 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border ${questionTheme.borderColor}`}>
                      <div className={`text-xs sm:text-sm font-medium ${questionTheme.textColor} mb-1 sm:mb-2 text-center`}>Available Menu</div>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {currentCustomer.question.menuItems?.map((item, index) => (
                          <button
                            key={`budget-${item.id}-${index}`}
                            onClick={() => {
                              if (selectedBudgetItems.includes(index)) {
                                setSelectedBudgetItems(prev => prev.filter(i => i !== index));
                              } else {
                                setSelectedBudgetItems(prev => [...prev, index]);
                              }
                            }}
                            className={`p-1 sm:p-1.5 rounded-md border-2 transition-all text-xs ${
                              selectedBudgetItems.includes(index)
                                ? `${questionTheme.borderColor} ${questionTheme.buttonBg} text-white shadow-md`
                                : `border-gray-300 ${questionTheme.textColor} hover:border-gray-400 bg-white/20`
                            }`}
                          >
                            <div className="flex flex-col items-center gap-0 sm:gap-0.5">
                              <span className="text-xs sm:text-sm">{item.icon}</span>
                              <span className="font-medium text-2xs sm:text-xs leading-tight">{item.name}</span>
                              <span className="font-bold text-2xs sm:text-xs">${item.price}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Show current total */}
                    {selectedBudgetItems.length > 0 && (
                      <div className={`text-xs sm:text-sm ${questionTheme.textColor} mb-3 sm:mb-4 text-center`}>
                        Selected Total: ${selectedBudgetItems.reduce((sum, index) => 
                          sum + (currentCustomer.question.menuItems?.[index]?.price || 0), 0
                        )} / ${currentCustomer.question.budget}
                      </div>
                    )}
                    
                    <button
                      onClick={submitBudgetAnswer}
                      disabled={selectedBudgetItems.length === 0}
                      className={`w-full ${questionTheme.buttonBg} text-white py-3 rounded-lg hover:scale-105 transition-transform font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      Order Selected Items
                    </button>
                  </>
                ) : (
                  // Other question types: Show regular buttons
                  <div className="grid grid-cols-2 gap-2">
                    {currentCustomer.question.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => answerQuestion(index)}
                        className={`${questionTheme.buttonBg} text-white p-3 rounded-lg hover:scale-105 transition-transform font-medium shadow-md`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            
              <button
                onClick={closeQuestion}
                className={`w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors border border-gray-400`}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Restart Game?</h2>
            <p className="text-lg text-gray-600 mb-6">
              This will restart from Level 1 and reset your progress. Are you sure?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={confirmRestart}
                className="bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg border-2 border-red-600"
              >
                Yes, Restart
              </button>
              <button
                onClick={cancelRestart}
                className="bg-gray-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-600 transition-all shadow-lg border-2 border-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderPauseScreen = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-6">Tea Ceremony Paused</h2>
        <div className="space-y-4">
          <button
            onClick={resumeGame}
            className={`w-full ${theme.button} text-white py-3 rounded-lg hover:scale-105 transition-transform`}
          >
            <Play className="inline mr-2" size={20} />
            Resume
          </button>
          <button
            onClick={restartGame}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg hover:scale-105 transition-transform"
          >
            <RotateCcw className="inline mr-2" size={20} />
            Restart
          </button>
          <button
            onClick={goToMainMenu}
            className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
          >
            <LogOut className="inline mr-2" size={20} />
            Exit Game
          </button>
        </div>
      </div>

      {/* Restart Confirmation Modal for Pause Screen */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Restart Game?</h2>
            <p className="text-lg text-gray-600 mb-6">
              This will restart from Level 1 and reset your progress. Are you sure?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={confirmRestart}
                className="bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg border-2 border-red-600"
              >
                Yes, Restart
              </button>
              <button
                onClick={cancelRestart}
                className="bg-gray-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-600 transition-all shadow-lg border-2 border-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderGameOverScreen = () => (
    <div className={`min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] bg-gradient-to-br ${theme.playingBg} p-4 flex items-center justify-center`}>
      <div className={`${theme.cardBg} rounded-3xl shadow-2xl p-8 text-center max-w-md w-full`}>
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-3xl font-bold mb-4 text-red-600">Game Over</h2>
        <div className="text-gray-600 mb-6">
          <p className="mb-4">The tea ceremony lost its harmony!</p>
          <div className="space-y-2">
            <div>Time Spent: <span className="font-bold">{formatGameTime(gameTimer)}</span></div>
            <div>Highest Mastery: <span className="font-bold">{Math.max(0, sessionStats.highestMastery)}</span></div>
            <div>Tea Level Reached: <span className="font-bold">{gameScore.level}</span></div>
            <div>Total Guests Served: <span className="font-bold">{sessionStats.totalGuestsServed}</span></div>
            <div>Harmony: <span className="font-bold">{Math.round((correctAnswers / Math.max(1, totalAnswers)) * 100)}%</span></div>
          </div>
        </div>
        <div className="space-y-4">
          <button
            onClick={startGame}
            className={`w-full ${theme.button} text-white py-3 rounded-lg hover:scale-105 transition-transform`}
          >
            <Play className="inline mr-2" size={20} />
            Play Again
          </button>
          <button
            onClick={goToMainMenu}
            className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
          >
            <LogOut className="inline mr-2" size={20} />
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderLevelUpScreen = () => (
    <div className={`min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] bg-gradient-to-br ${theme.playingBg} p-4 flex items-center justify-center`}>
      <div className={`${theme.cardBg} rounded-3xl shadow-2xl p-8 text-center max-w-md w-full`}>
        <div className="text-6xl mb-4">🍵</div>
        <h2 className="text-3xl font-bold mb-4 text-green-600">Tea Level Advanced!</h2>
        <div className="text-gray-600 mb-6">
          <p className="mb-4">Your mathcha mastery grows stronger!</p>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-700">Level {newLevel}</div>
            <div className="text-lg">New challenges await...</div>
            <div className="text-sm opacity-75">Auto-continuing in {Math.max(0, levelUpCountdown)} second{levelUpCountdown !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderVictoryScreen = () => (
    <div className={`min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] bg-gradient-to-br ${theme.playingBg} p-4 flex items-center justify-center`}>
      <div className={`${theme.cardBg} rounded-3xl shadow-2xl p-8 text-center max-w-md w-full`}>
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-4 text-green-600">Mathcha Master!</h2>
        <div className="text-gray-600 mb-6">
          <p className="mb-4">You have achieved true Mathcha Mastery!</p>
          <div className="space-y-2">
            <div>Time Spent: <span className="font-bold">{formatGameTime(gameTimer)}</span></div>
            <div>Highest Mastery: <span className="font-bold">{Math.max(0, sessionStats.highestMastery)}</span></div>
            <div>All Tea Levels Mastered! 🍵</div>
            <div>Total Guests Served: <span className="font-bold">{sessionStats.totalGuestsServed}</span></div>
            <div>Final Harmony: <span className="font-bold">{Math.round((correctAnswers / Math.max(1, totalAnswers)) * 100)}%</span></div>
          </div>
        </div>
        <div className="space-y-4">
          <button
            onClick={startGame}
            className={`w-full ${theme.button} text-white py-3 rounded-lg hover:scale-105 transition-transform`}
          >
            <Play className="inline mr-2" size={20} />
            Play Again
          </button>
          <button
            onClick={goToMainMenu}
            className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
          >
            <LogOut className="inline mr-2" size={20} />
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
  
  // Main render
  return (
    <div className="mathcha-cafe-game mathcha-cafe-container">
      {gameState === 'splash' && renderSplashScreen()}
      {gameState === 'setup' && renderSetupScreen()}
      {gameState === 'playing' && renderGameScreen()}
      {gameState === 'paused' && renderPauseScreen()}
      {gameState === 'levelUp' && renderLevelUpScreen()}
      {gameState === 'gameOver' && renderGameOverScreen()}
      {gameState === 'victory' && renderVictoryScreen()}
    </div>
  );
};