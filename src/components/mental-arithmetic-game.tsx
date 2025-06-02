import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, Calculator, ArrowLeft } from 'lucide-react';
import { trackGameEvent, trackSettingsChange, trackButtonClick } from '../utils/analytics';
import * as Tone from 'tone';

// Type definitions
interface GameSettings {
  digitTypes: {
    '1digit': boolean;
    '2digit': boolean;
    '3digit': boolean;
    '4digit': boolean;
  };
  operations: 'addition' | 'both';
  numQuestions: number;
  numbersPerQuestion: number;
  level: 1 | 2 | 3 | 4 | 5;
  theme: 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';
  speechEnabled: boolean;
  soundEnabled: boolean;
}

interface Question {
  numbers: number[];
  operations: string[];
  answer: number;
}

interface Theme {
  name: string;
  setupBg: string;
  playingBg: string;
  pausedBg: string;
  resultsBg: string;
  cardBg: string;
  primary: string;
  secondary: string;
}

type GameState = 'setup' | 'playing' | 'paused' | 'results';
type SoundType = 'getReady' | 'calculating' | 'answerReveal' | 'questionComplete' | 'gameStart' | 'gameComplete' | 'pause' | 'resume' | 'buttonClick' | 'settingChange';
type DigitType = '1digit' | '2digit' | '3digit' | '4digit';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

interface MentalArithmeticGameProps {
  onBackToHome?: () => void;
}

const MentalArithmeticGame: React.FC<MentalArithmeticGameProps> = ({ onBackToHome }) => {
  // In-memory settings store
  const settingsRef = useRef<GameSettings>({
    digitTypes: { '1digit': true, '2digit': true, '3digit': false, '4digit': false },
    operations: 'both',
    numQuestions: 10,
    numbersPerQuestion: 10,
    level: 1,
    theme: 'default',
    speechEnabled: false,
    soundEnabled: true
  });

  // Load settings from memory on component mount
  const [settings, setSettingsState] = useState<GameSettings>(() => {
    try {
      const stored = localStorage.getItem('mental-arithmetic-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        settingsRef.current = { ...settingsRef.current, ...parsed };
        return settingsRef.current;
      }
    } catch (error) {
      console.log('Could not load settings from storage:', error);
    }
    return settingsRef.current;
  });

  // State declarations
  const [gameState, setGameState] = useState<GameState>('setup');
  const [nextQuestionNumber, setNextQuestionNumber] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [currentNumberIndex, setCurrentNumberIndex] = useState<number>(0);
  const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
  const [currentOperations, setCurrentOperations] = useState<string[]>([]);
  const [showingAnswer, setShowingAnswer] = useState<boolean>(false);
  const [calculatingAnswer, setCalculatingAnswer] = useState<boolean>(false);
  const [showingGetReady, setShowingGetReady] = useState<boolean>(false);
  const [flashingBetweenNumbers, setFlashingBetweenNumbers] = useState<boolean>(false);
  const [answer, setAnswer] = useState<number>(0);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [displayNumber, setDisplayNumber] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [, setSpeechInitialized] = useState<boolean>(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  // Speech synthesis references
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Update settings function with memory persistence and analytics
  const updateSettings = (newSettings: GameSettings | ((prev: GameSettings) => GameSettings)): void => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;

    // Track which setting changed (async, non-blocking)
    setTimeout(() => {
      const changedSetting = Object.keys(updatedSettings).find(key =>
        JSON.stringify(updatedSettings[key as keyof GameSettings]) !==
        JSON.stringify(settings[key as keyof GameSettings])
      );

      if (changedSetting) {
        trackSettingsChange(
          changedSetting,
          updatedSettings[changedSetting as keyof GameSettings],
          'mental-arithmetic'
        );
      }
    }, 0);

    settingsRef.current = updatedSettings;
    setSettingsState(updatedSettings);

    // Save to localStorage with error handling
    try {
      localStorage.setItem('mental-arithmetic-settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.log('Could not save settings to storage:', error);
    }
  };

  // Initialize speech synthesis and find preferred female voice
  /*const initializeSpeech = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.log('Speech synthesis not supported');
        resolve();
        return;
      }

      const setVoice = () => {
        const voices = speechSynthesis.getVoices();

        // Enhanced female voice detection with more patterns and priorities
        const femaleVoicePatterns = [
          // iOS/Safari specific
          { pattern: /samantha/i, priority: 10 },
          { pattern: /karen/i, priority: 9 },
          { pattern: /moira/i, priority: 8 },
          { pattern: /tessa/i, priority: 7 },
          { pattern: /serena/i, priority: 6 },

          // General patterns
          { pattern: /female/i, priority: 15 },
          { pattern: /woman/i, priority: 14 },
          { pattern: /zira/i, priority: 13 },
          { pattern: /susan/i, priority: 12 },
          { pattern: /amelie/i, priority: 11 },
          { pattern: /anna/i, priority: 5 },
          { pattern: /carmit/i, priority: 4 },
          { pattern: /lekha/i, priority: 3 },
          { pattern: /mei-jia/i, priority: 2 },
          { pattern: /sin-ji/i, priority: 1 },

          // Additional patterns
          { pattern: /ting-ting/i, priority: 1 },
          { pattern: /yuna/i, priority: 1 },
          { pattern: /nicky/i, priority: 1 },
          { pattern: /fiona/i, priority: 1 },
          { pattern: /ellen/i, priority: 1 },
          { pattern: /joana/i, priority: 1 },
          { pattern: /helena/i, priority: 1 },
          { pattern: /luciana/i, priority: 1 },
          { pattern: /paulina/i, priority: 1 }
        ];

        let bestVoice: SpeechSynthesisVoice | null = null;
        let bestPriority = -1;

        voices.forEach(voice => {
          femaleVoicePatterns.forEach(({ pattern, priority }) => {
            if (pattern.test(voice.name) && priority > bestPriority) {
              bestVoice = voice;
              bestPriority = priority;
            }
          });
        });

        preferredVoiceRef.current = bestVoice;
        setSpeechInitialized(true);
        resolve();
      };

      if (speechSynthesis.getVoices().length > 0) {
        setVoice();
      } else {
        speechSynthesis.onvoiceschanged = () => {
          setVoice();
          speechSynthesis.onvoiceschanged = null;
        };

        // Fallback timeout for iOS
        setTimeout(() => {
          if (!speechInitialized) {
            setVoice();
          }
        }, 1000);
      }
    });
  };*/

  // Enhanced speech function with better iOS/Safari support
  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!settings.speechEnabled || !('speechSynthesis' in window)) {
        resolve();
        return;
      }
  
      // Cancel any ongoing speech
      speechSynthesis.cancel();
  
      // Clear any existing timeout
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
  
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        speechUtteranceRef.current = utterance;
  
        // iOS-specific voice setting
        if (preferredVoiceRef.current) {
          utterance.voice = preferredVoiceRef.current;
          console.log('🗣️ Using voice:', preferredVoiceRef.current.name);
        } else if (isIOS) {
          // iOS emergency fallback: force refresh voices and try again
          const voices = speechSynthesis.getVoices();
          console.log('No preferred voice on iOS, available voices:', voices.map(v => v.name));
          
          // Try to find any female-sounding voice
          const femaleVoice = voices.find(voice => 
            /(samantha|victoria|allison|ava|susan|kathy)/i.test(voice.name) ||
            (voice.lang.startsWith('en-') && !/(alex|daniel|fred|ralph|tom|male|man)/i.test(voice.name))
          );
          
          if (femaleVoice) {
            utterance.voice = femaleVoice;
            console.log('🗣️ iOS emergency voice:', femaleVoice.name);
          }
        }
  
        // iOS-optimized settings
        if (isIOS) {
          utterance.rate = 0.7; // Slower for iOS
          utterance.volume = 1.0; // Full volume for iOS
          utterance.pitch = 1.0; // Normal pitch for iOS
        } else {
          utterance.rate = 1.0;
          utterance.volume = 0.9;
          utterance.pitch = 1.2;
        }
  
        let resolved = false;
        const resolveOnce = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };
  
        utterance.onend = resolveOnce;
        utterance.onerror = (event) => {
          console.log('Speech error:', event.error);
          resolveOnce();
        };
  
        // iOS-specific timeout calculation
        const estimatedDuration = estimateSpeechDuration(text);
        const timeoutDuration = isIOS ? estimatedDuration + 1000 : estimatedDuration + 500;
        speechTimeoutRef.current = setTimeout(resolveOnce, timeoutDuration);
  
        // Start speaking
        speechSynthesis.speak(utterance);
  
        // iOS-specific fixes
        if (isIOS) {
          // Multiple resume attempts for iOS
          setTimeout(() => {
            if (speechSynthesis.paused) {
              console.log('Resuming paused speech on iOS');
              speechSynthesis.resume();
            }
          }, 50);
          
          setTimeout(() => {
            if (speechSynthesis.paused) {
              console.log('Second resume attempt on iOS');
              speechSynthesis.resume();
            }
          }, 200);
        }
  
      } catch (error) {
        console.log('Speech synthesis error:', error);
        resolve();
      }
    });
  };

  // Enhanced speech duration estimation with level-based speed adjustments
  const estimateSpeechDuration = (text: string): number => {
    // Base calculation for words (excluding numbers)
    const wordsPerMinute = 100; // Base rate
    const words = text.replace(/\d+/g, '').split(/\s+/).filter(word => word.length > 0);

    // Level-based speed adjustments for duration calculation
    const speedMultipliers = {
      1: 1.0,   // Normal duration for slow speech
      2: 0.85,  // Shorter duration for medium speed  
      3: 0.75   // Shortest duration for fast speech
    };

    const speedMultiplier = speedMultipliers[settings.level as keyof typeof speedMultipliers] || 1.0;
    let baseTime = (words.length / wordsPerMinute) * 60 * 1000 * speedMultiplier;

    // Special handling for numbers and operators
    const numbers = text.match(/\d+/g) || [];
    const hasOperator = /minus/i.test(text);
    const hasAnswerPhrase = /the answer is/i.test(text);

    // Add time for numbers based on digit count and complexity, adjusted for level
    let numberTime = 0;
    numbers.forEach(num => {
      const digitCount = num.length;
      if (digitCount === 1) {
        numberTime += 500 * speedMultiplier; // Single digits
      } else if (digitCount === 2) {
        numberTime += 800 * speedMultiplier; // Two digits like "twenty-three"
      } else if (digitCount === 3) {
        numberTime += 1400 * speedMultiplier; // Three digits
      } else if (digitCount === 4) {
        numberTime += 1800 * speedMultiplier; // Four digits
      }
    });

    // Add extra time for specific phrases and operators, adjusted for level
    if (hasOperator) {
      numberTime += 500 * speedMultiplier; // "minus" takes time to say
    }

    if (hasAnswerPhrase) {
      baseTime += 800 * speedMultiplier; // "The answer is" phrase
    }

    // Minimum time based on complexity - adjusted for speech speed
    const minimumTime = Math.max(600 * speedMultiplier, text.length * 60 * speedMultiplier);

    return Math.max(minimumTime, baseTime + numberTime);
  };

  // Calculate dynamic delays based on level and speech duration
  const calculateSpeechDelay = (text: string, level: number): number => {
    if (!settings.speechEnabled) return 0;

    const baseDuration = estimateSpeechDuration(text);

    // Level-based multipliers for pause after speech - more generous for complex numbers    
    const levelMultipliers = {
      1: 2.4,  // Much longer pause for beginners, especially with complex numbers
      2: 1.9,  // Medium-long pause
      3: 1.4   // Shorter but still safe pause for advanced
    };

    // Extra multiplier for longer numbers
    const numbers = text.match(/\d+/g) || [];
    let complexityMultiplier = 1.0;
    numbers.forEach(num => {
      if (num.length >= 3) {
        complexityMultiplier += 0.3; // Add extra time for 3+ digit numbers
      }
    });

    const multiplier = (levelMultipliers[level as keyof typeof levelMultipliers] || 1.4) * complexityMultiplier;
    const bufferTime = 500; // Increased base buffer time

    return baseDuration * multiplier + bufferTime;
  };

  // NEW: Calculate delay specifically for after answer announcement
  const calculatePostAnswerDelay = (answerText: string): number => {
    if (settings.speechEnabled) {
      // For speech mode: ensure speech completes + brief pause
      const speechDuration = estimateSpeechDuration(answerText);
      return speechDuration - 900; // Speech duration - 0.9 second
    } else {
      // For non-speech mode: slightly longer, level-based delays
      const levelDelays = {
        1: 2500,  // 2.5 seconds for beginners
        2: 2100,  // 2.1 seconds
        3: 1800,  // 1.8 seconds
        4: 1500,  // 1.5 seconds
        5: 1200   // 1.2 seconds for experts
      };
      return levelDelays[settings.level as keyof typeof levelDelays] || 1800;
    }
  };

  // Sound functions (unchanged)
  const playSound = async (type: SoundType): Promise<void> => {
    if (!settings.soundEnabled) return;

    try {
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }

      const synth = new Tone.Synth().toDestination();

      switch (type) {
        case 'getReady':
          synth.triggerAttackRelease('C5', '0.3');
          break;
        case 'calculating':
          break;
        case 'answerReveal':
          synth.triggerAttackRelease('C5', '0.2');
          setTimeout(() => synth.triggerAttackRelease('E5', '0.2'), 100);
          setTimeout(() => synth.triggerAttackRelease('G5', '0.3'), 200);
          break;
        case 'questionComplete':
          synth.triggerAttackRelease('G4', '0.2');
          setTimeout(() => synth.triggerAttackRelease('C5', '0.3'), 150);
          break;
        case 'gameStart':
          synth.triggerAttackRelease('C4', '0.2');
          setTimeout(() => synth.triggerAttackRelease('E4', '0.2'), 100);
          setTimeout(() => synth.triggerAttackRelease('G4', '0.2'), 200);
          setTimeout(() => synth.triggerAttackRelease('C5', '0.4'), 300);
          break;
        case 'gameComplete':
          synth.triggerAttackRelease('C5', '0.2');
          setTimeout(() => synth.triggerAttackRelease('E5', '0.2'), 100);
          setTimeout(() => synth.triggerAttackRelease('G5', '0.2'), 200);
          setTimeout(() => synth.triggerAttackRelease('C6', '0.2'), 300);
          setTimeout(() => synth.triggerAttackRelease('E6', '0.4'), 400);
          break;
        case 'pause':
          synth.triggerAttackRelease('F4', '0.3');
          break;
        case 'resume':
          synth.triggerAttackRelease('G4', '0.2');
          setTimeout(() => synth.triggerAttackRelease('C5', '0.3'), 100);
          break;
        case 'buttonClick':
          synth.triggerAttackRelease('C4', '0.1');
          break;
        case 'settingChange':
          synth.triggerAttackRelease('A4', '0.15');
          break;
      }
    } catch (error) {
      console.log('Audio not available:', error);
    }
  };

  // Calculate delays based on level with speech consideration
  const getDelays = (level: number) => {
    const baseNumberDelay = Math.max(0.5, 2 - (level - 1) * 0.5);    
    //const baseAnswerDelay = Math.max(0.8, 5 - (level - 1) * 0.6);
    const baseAnswerDelay = Math.max(1.25, 5 - (level) * 0.75);

    return {
      numberDelay: baseNumberDelay,
      answerDelay: baseAnswerDelay
    };
  };

  // Theme configurations (unchanged)
  const themes: Record<string, Theme> = {
    default: {
      name: 'Rainbow',
      setupBg: 'from-purple-400 via-pink-400 to-yellow-400',
      playingBg: 'from-blue-400 via-purple-400 to-pink-400',
      pausedBg: 'from-gray-400 via-gray-500 to-gray-600',
      resultsBg: 'from-green-400 via-blue-400 to-purple-400',
      cardBg: 'bg-white',
      primary: 'text-purple-800',
      secondary: 'text-purple-600'
    },
    ocean: {
      name: 'Ocean',
      setupBg: 'from-blue-400 via-cyan-400 to-teal-400',
      playingBg: 'from-cyan-400 via-blue-400 to-indigo-400',
      pausedBg: 'from-slate-400 via-slate-500 to-slate-600',
      resultsBg: 'from-teal-400 via-cyan-400 to-blue-400',
      cardBg: 'bg-blue-50',
      primary: 'text-blue-800',
      secondary: 'text-blue-600'
    },
    forest: {
      name: 'Forest',
      setupBg: 'from-green-400 via-emerald-400 to-lime-400',
      playingBg: 'from-emerald-400 via-green-400 to-teal-400',
      pausedBg: 'from-gray-400 via-gray-500 to-gray-600',
      resultsBg: 'from-lime-400 via-emerald-400 to-green-400',
      cardBg: 'bg-green-50',
      primary: 'text-green-800',
      secondary: 'text-green-600'
    },
    sunset: {
      name: 'Sunset',
      setupBg: 'from-orange-400 via-red-400 to-pink-400',
      playingBg: 'from-red-400 via-orange-400 to-yellow-400',
      pausedBg: 'from-gray-400 via-gray-500 to-gray-600',
      resultsBg: 'from-pink-400 via-red-400 to-orange-400',
      cardBg: 'bg-orange-50',
      primary: 'text-orange-800',
      secondary: 'text-orange-600'
    },
    lavender: {
      name: 'Lavender',
      setupBg: 'from-purple-400 via-violet-400 to-indigo-400',
      playingBg: 'from-violet-400 via-purple-400 to-fuchsia-400',
      pausedBg: 'from-gray-400 via-gray-500 to-gray-600',
      resultsBg: 'from-indigo-400 via-violet-400 to-purple-400',
      cardBg: 'bg-purple-50',
      primary: 'text-purple-800',
      secondary: 'text-purple-600'
    }
  };

  const currentTheme: Theme = themes[settings.theme] || themes.default;

  // Generate number and question functions (unchanged)
  const generateNumber = (): number => {
    const enabledTypes: DigitType[] = [];
    if (settings.digitTypes['1digit']) enabledTypes.push('1digit');
    if (settings.digitTypes['2digit']) enabledTypes.push('2digit');
    if (settings.digitTypes['3digit']) enabledTypes.push('3digit');
    if (settings.digitTypes['4digit']) enabledTypes.push('4digit');

    if (enabledTypes.length === 0) enabledTypes.push('1digit');

    const randomType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];

    if (randomType === '1digit') {
      return Math.floor(Math.random() * 9) + 1;
    } else if (randomType === '2digit') {
      return Math.floor(Math.random() * 90) + 10;
    } else if (randomType === '3digit') {
      return Math.floor(Math.random() * 900) + 100;
    } else { // 4digit
      return Math.floor(Math.random() * 9000) + 1000;
    }
  };

  const generateQuestion = (): Question => {
    const numbers: number[] = [];
    const operations: string[] = [];

    let runningTotal = generateNumber();
    numbers.push(runningTotal);

    for (let i = 1; i < settings.numbersPerQuestion; i++) {
      let nextNumber = generateNumber();
      let op: string;

      if (settings.operations === 'addition') {
        op = '+';
      } else {
        if (runningTotal > nextNumber) {
          op = Math.random() < 0.5 ? '+' : '-';
        } else {
          op = '+';
        }
      }

      if (op === '-' && runningTotal - nextNumber < 0) {
        if (runningTotal > 1) {
          nextNumber = Math.floor(Math.random() * (runningTotal - 1)) + 1;
        } else {
          op = '+';
        }
      }

      operations.push(op);
      numbers.push(nextNumber);

      if (op === '+') {
        runningTotal += nextNumber;
      } else {
        runningTotal -= nextNumber;
      }
    }

    return { numbers, operations, answer: runningTotal };
  };

  const initializeSpeechSync = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.log('Speech synthesis not supported');
        setSpeechInitialized(true);
        resolve(false);
        return;
      }
  
      // CRITICAL FOR iOS: Must speak something first to initialize properly
      const initializeWithDummySpeak = () => {
        try {
          // Create a silent/very quiet utterance to initialize the speech system
          const initUtterance = new SpeechSynthesisUtterance(' ');
          initUtterance.volume = 0.01; // Very quiet
          initUtterance.rate = 10; // Very fast
          
          initUtterance.onend = () => {
            // Now the speech system is initialized, we can get voices
            setTimeout(() => {
              setVoiceAfterInit();
            }, 100);
          };
          
          initUtterance.onerror = () => {
            // Even if there's an error, try to set voice
            setTimeout(() => {
              setVoiceAfterInit();
            }, 100);
          };
  
          speechSynthesis.speak(initUtterance);
        } catch (error) {
          console.log('Dummy speak failed:', error);
          setVoiceAfterInit();
        }
      };
  
      const setVoiceAfterInit = () => {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices after init:', voices.map(v => `${v.name} (${v.lang})`));
  
        // iOS-specific female voice patterns with priority
        const femaleVoicePatterns = [
          // iOS built-in female voices
          { pattern: /^Samantha$/i, priority: 20 },
          { pattern: /^Victoria$/i, priority: 19 },
          { pattern: /^Allison$/i, priority: 18 },
          { pattern: /^Ava$/i, priority: 17 },
          { pattern: /^Susan$/i, priority: 16 },
          { pattern: /^Kathy$/i, priority: 15 },
          
          // General patterns for other systems
          { pattern: /samantha/i, priority: 14 },
          { pattern: /victoria/i, priority: 13 },
          { pattern: /allison/i, priority: 12 },
          { pattern: /female/i, priority: 11 },
          { pattern: /woman/i, priority: 10 },
          
          // Additional female voices
          { pattern: /karen/i, priority: 9 },
          { pattern: /zira/i, priority: 8 },
          { pattern: /amelie/i, priority: 7 },
          { pattern: /anna/i, priority: 6 },
          { pattern: /susan/i, priority: 5 }
        ];
  
        let bestVoice = null;
        let bestPriority = -1;
  
        voices.forEach(voice => {
          femaleVoicePatterns.forEach(({ pattern, priority }) => {
            if (pattern.test(voice.name) && priority > bestPriority) {
              bestVoice = voice;
              bestPriority = priority;
            }
          });
        });
  
        // iOS fallback: if no pattern match, look for English voices that might be female
        if (!bestVoice && isIOS) {
          const englishVoices = voices.filter(voice => 
            voice.lang.startsWith('en-') && 
            !/(male|man|alex|daniel|fred|ralph|tom)/i.test(voice.name)
          );
          
          if (englishVoices.length > 0) {
            // On iOS, often the first English voice that's not obviously male is female
            bestVoice = englishVoices[0];
            console.log('iOS fallback: selected first non-male English voice:', bestVoice.name);
          }
        }
  
        preferredVoiceRef.current = bestVoice;
        setSpeechInitialized(true);
        
        if (bestVoice) {
          console.log('✅ Selected female voice:', bestVoice.name, 'Language:', bestVoice.lang);
        } else {
          console.log('❌ No female voice found. Available voices:');
          voices.forEach(voice => {
            console.log(`  - ${voice.name} (${voice.lang}) ${voice.default ? '[DEFAULT]' : ''}`);
          });
        }
        
        resolve(!!bestVoice);
      };
  
      // For iOS: voices are often not available until after first user interaction
      // AND after a dummy speak call
      if (isIOS) {
        console.log('iOS detected: initializing with dummy speak');
        initializeWithDummySpeak();
      } else {
        // Non-iOS: use the regular approach
        if (speechSynthesis.getVoices().length > 0) {
          setVoiceAfterInit();
        } else {
          let resolved = false;
          
          const handleVoicesChanged = () => {
            if (!resolved && speechSynthesis.getVoices().length > 0) {
              resolved = true;
              speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
              setVoiceAfterInit();
            }
          };
  
          speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  
          // Fallback timeout
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
              setVoiceAfterInit();
            }
          }, 2000);
        }
      }
    });
  };

  // Game functions with analytics
  const startGame = async (): Promise<void> => {
    const hasDigitType = Object.values(settings.digitTypes).some(enabled => enabled);
    if (!hasDigitType) {
      alert('Please select at least one number type!');
      return;
    }
  
    if (settings.numbersPerQuestion < 2) {
      alert('Numbers per question must be at least 2!');
      return;
    }
  
    if (settings.numQuestions < 1) {
      alert('Number of questions must be at least 1!');
      return;
    }
  
    // Analytics tracking (async, non-blocking)
    const startTime = Date.now();
    setGameStartTime(startTime);
    setTimeout(() => {
      trackGameEvent('mental-arithmetic', 'start', {
        numQuestions: settings.numQuestions,
        numbersPerQuestion: settings.numbersPerQuestion,
        level: settings.level,
        speechEnabled: settings.speechEnabled,
        soundEnabled: settings.soundEnabled,
        operations: settings.operations
      });
    }, 0);
  
    // CRITICAL FOR iOS: Initialize speech with proper waiting
    if (settings.speechEnabled) {
      console.log('Initializing speech for platform:', isIOS ? 'iOS' : 'Other');
      try {
        const voiceInitialized = await initializeSpeechSync();
        console.log('Voice initialization result:', voiceInitialized);
        
        // iOS additional delay to ensure voice system is ready
        if (isIOS) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.log('Speech initialization failed:', error);
      }
    }
  
    playSound('gameStart');
    const questions: Question[] = [];
    for (let i = 0; i < settings.numQuestions; i++) {
      questions.push(generateQuestion());
    }
    setAllQuestions(questions);
    setCurrentQuestion(0);
    setNextQuestionNumber(1);
    setCurrentNumberIndex(0);
    setCalculatingAnswer(false);
    setShowingAnswer(false);
    setShowingGetReady(true);
    setFlashingBetweenNumbers(false);
    setIsPaused(false);
    setGameState('playing');
  
    setTimeout(() => {
      setTimeout(() => {
        setShowingGetReady(false);
        if (questions.length > 0) {
          setCurrentNumbers(questions[0].numbers);
          setCurrentOperations(questions[0].operations);
          setAnswer(questions[0].answer);
          setDisplayNumber(questions[0].numbers[0].toString());
  
          if (settings.speechEnabled) {
            speak(questions[0].numbers[0].toString());
          }
        }
      }, 800);
    }, 1000);
  };

  const pauseGame = (): void => {
    // Analytics tracking (async, non-blocking)
    setTimeout(() => {
      trackGameEvent('mental-arithmetic', 'pause', {
        currentQuestion: currentQuestion + 1,
        totalQuestions: settings.numQuestions
      });
    }, 0);

    // Immediately stop all speech and audio
    speechSynthesis.cancel();

    // Clear all possible timeouts and intervals
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    // Clear any other timeouts that might be running
    for (let i = 1; i < 99999; i++) {
      clearTimeout(i);
    }

    // Stop any Tone.js audio
    try {
      if (Tone.getContext().state === 'running') {
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
      }
    } catch (error) {
      // Ignore Tone.js errors
    }

    // Set paused state first to stop useEffect loops
    setIsPaused(true);
    setGameState('paused');

    // Play pause sound after stopping everything else
    setTimeout(() => {
      playSound('pause');
    }, 100);
  };

  const resumeGame = (): void => {
    // Analytics tracking (async, non-blocking)
    setTimeout(() => {
      trackGameEvent('mental-arithmetic', 'resume', {
        currentQuestion: currentQuestion + 1,
        totalQuestions: settings.numQuestions
      });
    }, 0);

    playSound('resume');
    setIsPaused(false);
    setGameState('playing');
  };

  const restartGame = (): void => {
    // Analytics tracking (async, non-blocking)
    setTimeout(() => {
      trackGameEvent('mental-arithmetic', 'restart', {
        currentQuestion: currentQuestion + 1,
        totalQuestions: settings.numQuestions,
        level: settings.level
      });
    }, 0);

    // Immediately stop all speech and audio
    speechSynthesis.cancel();

    // Clear all possible timeouts and intervals
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    // Clear any other timeouts that might be running
    for (let i = 1; i < 99999; i++) {
      clearTimeout(i);
    }

    // Stop any Tone.js audio
    try {
      if (Tone.getContext().state === 'running') {
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
      }
    } catch (error) {
      // Ignore Tone.js errors
    }

    // Set game state to setup first to stop useEffect loops
    setGameState('setup');
    setIsPaused(false);

    // Reset all game state variables
    setCurrentQuestion(0);
    setNextQuestionNumber(1);
    setCurrentNumberIndex(0);
    setShowingAnswer(false);
    setCalculatingAnswer(false);
    setShowingGetReady(false);
    setFlashingBetweenNumbers(false);
    setAllQuestions([]);
    setDisplayNumber('');
    setAnswer(0);
    setCurrentNumbers([]);
    setCurrentOperations([]);
  };

  const completeGame = (): void => {
    const duration = gameStartTime ? Date.now() - gameStartTime : 0;
    // Analytics tracking (async, non-blocking)
    setTimeout(() => {
      trackGameEvent('mental-arithmetic', 'complete', {
        numQuestions: settings.numQuestions,
        duration: Math.round(duration / 1000),
        level: settings.level
      });
    }, 0);
  };

  // Enhanced game logic effect with NEW post-answer delay mechanism
  useEffect(() => {
    if (gameState !== 'playing' || isPaused || showingGetReady) return;

    const currentQ = allQuestions[currentQuestion];
    if (!currentQ) return;

    if (showingAnswer) {
      const answerText = `The answer is ${answer}`;

      if (settings.speechEnabled) {
        speak(answerText).then(() => {
          // Use the NEW post-answer delay calculation
          const postAnswerDelay = calculatePostAnswerDelay(answerText);

          setTimeout(() => {
            playSound('questionComplete');
            if (currentQuestion < allQuestions.length - 1) {
              setNextQuestionNumber(currentQuestion + 2);
              setShowingGetReady(true);
              setShowingAnswer(false);
              setCalculatingAnswer(false);
              setFlashingBetweenNumbers(false);

              setTimeout(() => {
                playSound('getReady');

                setTimeout(() => {
                  const nextQuestionNum = currentQuestion + 1;
                  setCurrentQuestion(nextQuestionNum);
                  setCurrentNumberIndex(0);
                  setShowingGetReady(false);
                  const nextQ = allQuestions[nextQuestionNum];
                  setCurrentNumbers(nextQ.numbers);
                  setCurrentOperations(nextQ.operations);
                  setAnswer(nextQ.answer);
                  setDisplayNumber(nextQ.numbers[0].toString());

                  if (settings.speechEnabled) {
                    speak(nextQ.numbers[0].toString());
                  }
                }, 800);
              }, 1000);
            } else {
              playSound('gameComplete');
              completeGame();
              setGameState('results');
            }
          }, postAnswerDelay);
        });
      } else {
        // Use the NEW post-answer delay calculation for non-speech mode too
        const postAnswerDelay = calculatePostAnswerDelay(answerText);
        const timer = setTimeout(() => {
          playSound('questionComplete');
          if (currentQuestion < allQuestions.length - 1) {
            setNextQuestionNumber(currentQuestion + 2);
            setShowingGetReady(true);
            setShowingAnswer(false);
            setCalculatingAnswer(false);
            setFlashingBetweenNumbers(false);

            setTimeout(() => {
              playSound('getReady');

              setTimeout(() => {
                const nextQuestionNum = currentQuestion + 1;
                setCurrentQuestion(nextQuestionNum);
                setCurrentNumberIndex(0);
                setShowingGetReady(false);
                const nextQ = allQuestions[nextQuestionNum];
                setCurrentNumbers(nextQ.numbers);
                setCurrentOperations(nextQ.operations);
                setAnswer(nextQ.answer);
                setDisplayNumber(nextQ.numbers[0].toString());
              }, 800);
            }, 1000);
          } else {
            playSound('gameComplete');
            completeGame();
            setGameState('results');
          }
        }, postAnswerDelay);

        return () => clearTimeout(timer);
      }

      return;
    } else if (calculatingAnswer) {
      if (settings.speechEnabled) {        
        //const levelDelay = Math.max(800, 3000 - (settings.level - 1) * 400);
        const levelDelay = Math.max(1200, 3000 - settings.level * 600);
        const timer = setTimeout(() => {
          setDisplayNumber(answer.toString());
          setCalculatingAnswer(false);
          setShowingAnswer(true);
        }, levelDelay);

        return () => clearTimeout(timer);
      } else {
        const delays = getDelays(settings.level);
        const timer = setTimeout(() => {
          playSound('answerReveal');
          setDisplayNumber(answer.toString());
          setCalculatingAnswer(false);
          setShowingAnswer(true);
        }, delays.answerDelay * 1000);

        return () => clearTimeout(timer);
      }
    } else if (flashingBetweenNumbers) {
      const timer = setTimeout(() => {
        setFlashingBetweenNumbers(false);
        if (currentNumberIndex < currentNumbers.length - 1) {
          setCurrentNumberIndex(prev => prev + 1);
          const nextNumber = currentNumbers[currentNumberIndex + 1];
          setDisplayNumber(nextNumber.toString());

          if (settings.speechEnabled) {
            const operation = currentOperations[currentNumberIndex];
            if (operation === '-') {
              speak(`minus ${nextNumber}`);
            } else {
              speak(nextNumber.toString());
            }
          }
        } else {
          setDisplayNumber('Calculating...');
          setCalculatingAnswer(true);
        }
      }, 200);

      return () => clearTimeout(timer);
    } else {
      if (currentNumberIndex < currentNumbers.length) {
        if (settings.speechEnabled) {
          const currentText = displayNumber;
          const speechDelay = calculateSpeechDelay(currentText, settings.level);

          const timer = setTimeout(() => {
            if (currentNumberIndex < currentNumbers.length - 1) {
              setFlashingBetweenNumbers(true);
            } else {
              setDisplayNumber('Calculating...');
              setCalculatingAnswer(true);
            }
          }, speechDelay);

          return () => clearTimeout(timer);
        } else {
          const delays = getDelays(settings.level);
          const timer = setTimeout(() => {
            if (currentNumberIndex < currentNumbers.length - 1) {
              setFlashingBetweenNumbers(true);
            } else {
              setDisplayNumber('Calculating...');
              setCalculatingAnswer(true);
            }
          }, delays.numberDelay * 1000);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [gameState, currentQuestion, currentNumberIndex, showingAnswer, calculatingAnswer, flashingBetweenNumbers, showingGetReady, currentNumbers, answer, settings, allQuestions, isPaused, displayNumber]);

  // Initialize speech on component mount if speech is enabled
  /*useEffect(() => {
    if (settings.speechEnabled && !speechInitialized) {
      initializeSpeech();
    }
  }, [settings.speechEnabled, speechInitialized]);*/

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      speechSynthesis.cancel();
    };
  }, []);

  // Setup Screen
  if (gameState === 'setup') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.setupBg} p-4`}>
        <div className="max-w-2xl mx-auto">
          <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-8`}>
            {/* Back to Home Button */}
            {onBackToHome && (
              <button
                onClick={() => {
                  trackButtonClick('back-to-home', 'mental-arithmetic-setup');
                  playSound('buttonClick');
                  onBackToHome();
                }}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Games</span>
              </button>
            )}

            <div className="text-center mb-8">
              <Calculator className={`w-16 h-16 mx-auto ${currentTheme.secondary} mb-4`} />
              <h1 className={`text-4xl font-bold ${currentTheme.primary} mb-2`}>Mental Arithmetic Game</h1>
              <p className={`text-xl ${currentTheme.secondary}`}>Train your brain with fun calculations!</p>
            </div>

            <div className="space-y-6">
              {/* Audio & Speech Settings */}
              <div className="bg-purple-50 rounded-2xl p-6">
                <label className="block text-2xl font-bold text-purple-800 mb-4">Audio Settings:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all transform hover:scale-105 border-2 ${settings.soundEnabled
                    ? 'bg-purple-100 border-purple-300 text-purple-800 shadow-lg'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔊</span>
                      <span className="text-lg font-bold">Sound Effects</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => {
                        playSound('settingChange');
                        updateSettings(prev => ({ ...prev, soundEnabled: e.target.checked }));
                      }}
                      className="w-6 h-6 text-purple-600 rounded"
                    />
                  </label>

                  <label className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all transform hover:scale-105 border-2 ${settings.speechEnabled
                    ? 'bg-purple-100 border-purple-300 text-purple-800 shadow-lg'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🗣️</span>
                      <span className="text-lg font-bold">Voice</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.speechEnabled}
                      onChange={(e) => {
                        playSound('settingChange');
                        updateSettings(prev => ({
                          ...prev,
                          speechEnabled: e.target.checked,
                          // Reset level to 1 if speech is enabled and current level is above 3
                          level: e.target.checked && prev.level > 3 ? 1 : prev.level
                        }));
                      }}
                      className="w-6 h-6 text-purple-600 rounded"
                    />
                  </label>
                </div>
                {settings.speechEnabled && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ℹ️ Voice mode uses intelligent timing and limits difficulty to levels 1-3 for optimal experience
                    </p>
                  </div>
                )}
              </div>

              {/* Theme Selector */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <label className="block text-2xl font-bold text-gray-800 mb-4">Theme:</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => {
                        playSound('settingChange');
                        updateSettings(prev => ({ ...prev, theme: key as GameSettings['theme'] }));
                      }}
                      className={`p-3 rounded-xl font-bold text-center transition-all transform hover:scale-105 border-2 ${settings.theme === key
                        ? `bg-gradient-to-r ${theme.setupBg} text-white shadow-lg border-white`
                        : 'bg-white text-gray-700 border-gray-200 hover:shadow-md'
                        }`}
                    >
                      <div className="text-sm">{theme.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Digit Types */}
              <div className="bg-blue-50 rounded-2xl p-6">
                <label className="block text-2xl font-bold text-blue-800 mb-4">Number Types:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { value: '1digit' as DigitType, label: '1 Digit', range: '1-9', color: 'bg-green-100 border-green-300 text-green-800' },
                    { value: '2digit' as DigitType, label: '2 Digits', range: '10-99', color: 'bg-blue-100 border-blue-300 text-blue-800' },
                    { value: '3digit' as DigitType, label: '3 Digits', range: '100-999', color: 'bg-purple-100 border-purple-300 text-purple-800' },
                    { value: '4digit' as DigitType, label: '4 Digits', range: '1000-9999', color: 'bg-red-100 border-red-300 text-red-800' }
                  ].map(option => (
                    <label
                      key={option.value}
                      className={`flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all transform hover:scale-105 border-2 ${settings.digitTypes[option.value]
                        ? `${option.color} shadow-lg border-opacity-100`
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={settings.digitTypes[option.value]}
                        onChange={(e) => {
                          playSound('settingChange');
                          updateSettings(prev => ({
                            ...prev,
                            digitTypes: {
                              ...prev.digitTypes,
                              [option.value]: e.target.checked
                            }
                          }));
                        }}
                        className="w-6 h-6 text-blue-600 rounded mb-2"
                      />
                      <span className="text-lg font-bold mb-1">{option.label}</span>
                      <span className="text-sm opacity-75">({option.range})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-2xl p-6">
                <label className="block text-2xl font-bold text-green-800 mb-4">Operations:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { value: 'addition' as const, label: 'Addition Only' },
                    { value: 'both' as const, label: 'Addition & Subtraction' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        playSound('settingChange');
                        updateSettings(prev => ({ ...prev, operations: option.value }));
                      }}
                      className={`p-4 rounded-xl text-lg font-bold transition-all ${settings.operations === option.value
                        ? 'bg-green-500 text-white shadow-lg transform scale-105'
                        : 'bg-white text-green-600 hover:bg-green-100'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings - Questions and Numbers per Question */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 rounded-2xl p-6">
                  <label className="block text-xl font-bold text-orange-800 mb-3">Questions:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.numQuestions === 0 ? '' : settings.numQuestions}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        updateSettings(prev => ({ ...prev, numQuestions: 0 }));
                      } else {
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 0) {
                          updateSettings(prev => ({ ...prev, numQuestions: Math.min(50, Math.max(0, num)) }));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (settings.numQuestions === 0) {
                        updateSettings(prev => ({ ...prev, numQuestions: 1 }));
                      }
                    }}
                    className="w-full p-4 text-2xl font-bold text-center rounded-xl border-4 border-orange-200 focus:border-orange-400 focus:outline-none"
                    placeholder="1-50"
                  />
                </div>

                <div className="bg-red-50 rounded-2xl p-6">
                  <label className="block text-xl font-bold text-red-800 mb-3">Numbers per Question:</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={settings.numbersPerQuestion === 0 ? '' : settings.numbersPerQuestion}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        updateSettings(prev => ({ ...prev, numbersPerQuestion: 0 }));
                      } else {
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 0) {
                          updateSettings(prev => ({ ...prev, numbersPerQuestion: Math.min(20, Math.max(0, num)) }));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (settings.numbersPerQuestion < 2) {
                        updateSettings(prev => ({ ...prev, numbersPerQuestion: 2 }));
                      }
                    }}
                    className="w-full p-4 text-2xl font-bold text-center rounded-xl border-4 border-red-200 focus:border-red-400 focus:outline-none"
                    placeholder="2-20"
                  />
                </div>
              </div>

              {/* Difficulty Level - Separate Full Width Section */}
              <div className="bg-indigo-50 rounded-2xl p-6">
                <label className="block text-xl font-bold text-indigo-800 mb-4">Difficulty Level:</label>
                <div className={`grid gap-3 ${settings.speechEnabled ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
                  {settings.speechEnabled ? (
                    // Voice mode - only show 3 levels with new names
                    [1, 2, 3].map(level => {
                      const voiceLevelNames = ['Easy', 'Medium', 'Hard'];
                      const levelColors = [
                        'bg-green-100 border-green-400 text-green-800',
                        'bg-orange-100 border-orange-400 text-orange-800',
                        'bg-red-100 border-red-400 text-red-800'
                      ];
                      const selectedColor = [
                        'bg-green-500 text-white shadow-lg',
                        'bg-orange-500 text-white shadow-lg',
                        'bg-red-500 text-white shadow-lg'
                      ];

                      return (
                        <button
                          key={level}
                          onClick={() => {
                            playSound('settingChange');
                            updateSettings(prev => ({ ...prev, level: level as GameSettings['level'] }));
                          }}
                          className={`p-3 sm:p-4 rounded-xl font-bold text-center transition-all border-2 min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center ${settings.level === level
                            ? `${selectedColor[level - 1]} transform hover:scale-105`
                            : `${levelColors[level - 1]} hover:shadow-md transform hover:scale-105`
                            }`}
                        >
                          <div className="text-xl sm:text-2xl mb-1 leading-none">{level}</div>
                          <div className="text-xs sm:text-sm leading-tight">{voiceLevelNames[level - 1]}</div>
                        </button>
                      );
                    })
                  ) : (
                    // Regular mode - show all 5 levels with original names
                    [1, 2, 3, 4, 5].map(level => {
                      const levelNames = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
                      const levelColors = [
                        'bg-green-100 border-green-400 text-green-800',
                        'bg-yellow-100 border-yellow-400 text-yellow-800',
                        'bg-orange-100 border-orange-400 text-orange-800',
                        'bg-red-100 border-red-400 text-red-800',
                        'bg-purple-100 border-purple-400 text-purple-800'
                      ];
                      const selectedColor = [
                        'bg-green-500 text-white shadow-lg',
                        'bg-yellow-500 text-white shadow-lg',
                        'bg-orange-500 text-white shadow-lg',
                        'bg-red-500 text-white shadow-lg',
                        'bg-purple-500 text-white shadow-lg'
                      ];

                      return (
                        <button
                          key={level}
                          onClick={() => {
                            playSound('settingChange');
                            updateSettings(prev => ({ ...prev, level: level as GameSettings['level'] }));
                          }}
                          className={`p-3 sm:p-4 rounded-xl font-bold text-center transition-all border-2 min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center ${settings.level === level
                            ? `${selectedColor[level - 1]} transform hover:scale-105`
                            : `${levelColors[level - 1]} hover:shadow-md transform hover:scale-105`
                            }`}
                        >
                          <div className="text-xl sm:text-2xl mb-1 leading-none">{level}</div>
                          <div className="text-xs sm:text-sm leading-tight">{levelNames[level - 1]}</div>
                        </button>
                      );
                    })
                  )}
                </div>
                {settings.speechEnabled && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ℹ️ Voice mode offers 3 difficulty levels for optimal timing experience
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  trackButtonClick('start-game', 'mental-arithmetic-setup');
                  playSound('buttonClick');
                  startGame();
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-3xl font-bold py-6 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-4"
              >
                <Play className="w-8 h-8" />
                Start Game!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing Screen
  if (gameState === 'playing') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.playingBg} flex items-center justify-center p-4`}>
        <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-12 text-center max-w-lg w-full`}>
          {showingGetReady ? (
            <div className="mb-8">
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-5xl font-bold text-green-600 mb-4">Get Ready!</h2>
              <p className="text-2xl text-green-500">Question {nextQuestionNumber} of {settings.numQuestions}</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className={`text-2xl font-bold ${currentTheme.primary} mb-2`}>
                  Question {currentQuestion + 1} of {settings.numQuestions}
                </div>
                <div className={`text-lg ${currentTheme.secondary}`}>
                  {showingAnswer ? 'Answer:' : calculatingAnswer ? 'Calculating...' : `Number ${currentNumberIndex + 1} of ${currentNumbers.length}`}
                </div>
              </div>

              <div className="mb-8">
                <div className={`flex items-center justify-center gap-6 transition-opacity duration-200 ${flashingBetweenNumbers ? 'opacity-20' : 'opacity-100'}`}>
                  {!showingAnswer && !calculatingAnswer && currentNumberIndex > 0 && currentOperations[currentNumberIndex - 1] && (
                    <div className="text-6xl font-bold text-red-600 bg-red-100 rounded-2xl p-4 shadow-lg">
                      {currentOperations[currentNumberIndex - 1]}
                    </div>
                  )}
                  <div className={`text-8xl font-bold ${currentTheme.primary}`}>
                    {calculatingAnswer ? (
                      <span className="text-4xl">Calculating...</span>
                    ) : (
                      displayNumber
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full bg-purple-200 rounded-full h-4 mb-6">
                <div
                  className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestion * currentNumbers.length + currentNumberIndex + (showingAnswer ? 1 : 0)) / (settings.numQuestions * settings.numbersPerQuestion)) * 100}%`
                  }}
                ></div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    trackButtonClick('pause', 'mental-arithmetic-playing');
                    playSound('buttonClick');
                    pauseGame();
                  }}
                  className="bg-yellow-500 text-white text-xl font-bold py-3 px-6 rounded-xl hover:bg-yellow-600 transition-all shadow-lg"
                >
                  ⏸️ Pause
                </button>
                <button
                  onClick={() => {
                    trackButtonClick('restart', 'mental-arithmetic-playing');
                    playSound('buttonClick');
                    restartGame();
                  }}
                  className="bg-red-500 text-white text-xl font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg"
                >
                  🔄 Restart
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Paused Screen
  if (gameState === 'paused') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.pausedBg} flex items-center justify-center p-4`}>
        <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-12 text-center max-w-lg w-full`}>
          <div className="mb-8">
            <div className="text-6xl mb-4">⏸️</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Game Paused</h2>
            <p className="text-xl text-gray-600">Take your time!</p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                trackButtonClick('resume', 'mental-arithmetic-paused');
                playSound('buttonClick');
                resumeGame();
              }}
              className="bg-green-500 text-white text-2xl font-bold py-4 px-8 rounded-xl hover:bg-green-600 transition-all shadow-lg"
            >
              ▶️ Resume
            </button>
            <button
              onClick={() => {
                trackButtonClick('restart-from-pause', 'mental-arithmetic-paused');
                playSound('buttonClick');
                restartGame();
              }}
              className="bg-red-500 text-white text-2xl font-bold py-4 px-8 rounded-xl hover:bg-red-600 transition-all shadow-lg"
            >
              🔄 Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (gameState === 'results') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.resultsBg} p-4`}>
        <div className="max-w-4xl mx-auto">
          <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-8`}>
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-800 mb-4 leading-tight">
                <span className="text-2xl sm:text-3xl md:text-4xl">🎉</span>
                <span className="mx-2 sm:mx-3">Great Job!</span>
                <span className="text-2xl sm:text-3xl md:text-4xl">🎉</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-green-600 px-2">Here are all your questions and answers:</p>
            </div>

            <div className="space-y-6 mb-8 max-h-96 overflow-y-auto">
              {allQuestions.map((question, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <div className="text-lg font-bold text-purple-800 mb-2">
                    Question {index + 1}:
                  </div>
                  <div className="text-2xl font-bold text-purple-700 mb-2">
                    {question.numbers[0]}
                    {question.operations.map((op, opIndex) =>
                      ` ${op} ${question.numbers[opIndex + 1]}`
                    ).join('')} = {question.answer}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                trackButtonClick('new-game', 'mental-arithmetic-results');
                playSound('buttonClick');
                restartGame();
              }}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl sm:text-2xl md:text-3xl font-bold py-4 sm:py-5 md:py-6 px-4 rounded-2xl hover:from-green-600 hover:to-blue-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2 sm:gap-3 md:gap-4"
            >
              <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />
              <span className="leading-tight">Start New Game!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MentalArithmeticGame;