import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Calculator, ArrowLeft } from 'lucide-react';
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

interface MentalArithmeticGameProps {
  onBackToHome?: () => void;
}

const MentalArithmeticGame: React.FC<MentalArithmeticGameProps> = ({ onBackToHome }) => {
  // Load settings from localStorage or use defaults
  const loadSettings = (): GameSettings => {
    try {
      const saved = localStorage.getItem('mentalMathSettings');
      if (saved) {
        return JSON.parse(saved) as GameSettings;
      }
    } catch (error) {
      console.log('Could not load saved settings');
    }
    return {
      digitTypes: { '1digit': true, '2digit': true, '3digit': false, '4digit': false },
      operations: 'both',
      numQuestions: 10,
      numbersPerQuestion: 10,
      level: 1,
      theme: 'default'
    };
  };

  // State declarations
  const [gameState, setGameState] = useState<GameState>('setup');
  const [settings, setSettings] = useState<GameSettings>(loadSettings());
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

  // Save settings to localStorage
  const updateSettings = (newSettings: GameSettings | ((prev: GameSettings) => GameSettings)): void => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    setSettings(updatedSettings);
    try {
      localStorage.setItem('mentalMathSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.log('Could not save settings');
    }
  };

  // Theme configurations
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

  // Sound functions
  const playSound = async (type: SoundType): Promise<void> => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      const synth = new Tone.Synth().toDestination();
      
      switch (type) {
        case 'getReady':
          synth.triggerAttackRelease('C5', '0.3');
          break;
        case 'calculating':
          const seq = new Tone.Sequence((time) => {
            synth.triggerAttackRelease('A4', '0.1', time);
          }, ['A4'], '0.2').start(0);
          seq.stop('+1');
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

  // Calculate delays based on level
  const getDelays = (level: number) => {
    const numberDelay = Math.max(0.5, 2 - (level - 1) * 0.5);
    const answerDelay = Math.max(0.8, 5 - (level - 1) * 0.6);
    return { numberDelay, answerDelay };
  };

  // Generate a random number based on enabled digit types
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

  // Generate a question ensuring no negative intermediate results
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

  // Game functions
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
      playSound('getReady');
      setShowingGetReady(false);
      if (questions.length > 0) {
        setCurrentNumbers(questions[0].numbers);
        setCurrentOperations(questions[0].operations);
        setAnswer(questions[0].answer);
        setDisplayNumber(questions[0].numbers[0].toString());
      }
    }, 1000);
  };

  const pauseGame = (): void => {
    playSound('pause');
    setIsPaused(true);
    setGameState('paused');
  };

  const resumeGame = (): void => {
    playSound('resume');
    setIsPaused(false);
    setGameState('playing');
  };

  const restartGame = (): void => {
    setGameState('setup');
    setCurrentQuestion(0);
    setNextQuestionNumber(1);
    setCurrentNumberIndex(0);
    setShowingAnswer(false);
    setCalculatingAnswer(false);
    setShowingGetReady(false);
    setFlashingBetweenNumbers(false);
    setIsPaused(false);
    setAllQuestions([]);
  };

  // Game logic effect
  useEffect(() => {
    if (gameState !== 'playing' || isPaused || showingGetReady) return;
    
    const currentQ = allQuestions[currentQuestion];
    if (!currentQ) return;

    if (showingAnswer) {
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
            const nextQuestionNum = currentQuestion + 1;
            setCurrentQuestion(nextQuestionNum);
            setCurrentNumberIndex(0);
            setShowingGetReady(false);
            const nextQ = allQuestions[nextQuestionNum];
            setCurrentNumbers(nextQ.numbers);
            setCurrentOperations(nextQ.operations);
            setAnswer(nextQ.answer);
            setDisplayNumber(nextQ.numbers[0].toString());
          }, 1000);
        } else {
          playSound('gameComplete');
          setGameState('results');
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    } else if (calculatingAnswer) {
      const delays = getDelays(settings.level);
      const timer = setTimeout(() => {
        playSound('answerReveal');
        setDisplayNumber(answer.toString());
        setCalculatingAnswer(false);
        setShowingAnswer(true);
      }, delays.answerDelay * 1000);
      
      return () => clearTimeout(timer);
    } else if (flashingBetweenNumbers) {
      const timer = setTimeout(() => {
        setFlashingBetweenNumbers(false);
        if (currentNumberIndex < currentNumbers.length - 1) {
          setCurrentNumberIndex(prev => prev + 1);
          setDisplayNumber(currentNumbers[currentNumberIndex + 1].toString());
        } else {
          playSound('calculating');
          setDisplayNumber('Calculating...');
          setCalculatingAnswer(true);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    } else {
      if (currentNumberIndex < currentNumbers.length) {
        const delays = getDelays(settings.level);
        const timer = setTimeout(() => {
          if (currentNumberIndex < currentNumbers.length - 1) {
            setFlashingBetweenNumbers(true);
          } else {
            playSound('calculating');
            setDisplayNumber('Calculating...');
            setCalculatingAnswer(true);
          }
        }, delays.numberDelay * 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, currentQuestion, currentNumberIndex, showingAnswer, calculatingAnswer, flashingBetweenNumbers, showingGetReady, currentNumbers, answer, settings, allQuestions, isPaused]);

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
              {/* Theme Selector */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <label className="block text-2xl font-bold text-gray-800 mb-4">Theme:</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => {
                        playSound('settingChange');
                        updateSettings(prev => ({...prev, theme: key as GameSettings['theme']}));
                      }}
                      className={`p-3 rounded-xl font-bold text-center transition-all transform hover:scale-105 border-2 ${
                        settings.theme === key
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
                      className={`flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all transform hover:scale-105 border-2 ${
                        settings.digitTypes[option.value] 
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

              {/* Operations */}
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
                        updateSettings(prev => ({...prev, operations: option.value}));
                      }}
                      className={`p-4 rounded-xl text-lg font-bold transition-all ${
                        settings.operations === option.value
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
                        updateSettings(prev => ({...prev, numQuestions: 0}));
                      } else {
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 0) {
                          updateSettings(prev => ({...prev, numQuestions: Math.min(50, Math.max(0, num))}));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (settings.numQuestions === 0) {
                        updateSettings(prev => ({...prev, numQuestions: 1}));
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
                        updateSettings(prev => ({...prev, numbersPerQuestion: 0}));
                      } else {
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 0) {
                          updateSettings(prev => ({...prev, numbersPerQuestion: Math.min(20, Math.max(0, num))}));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (settings.numbersPerQuestion < 2) {
                        updateSettings(prev => ({...prev, numbersPerQuestion: 2}));
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map(level => {
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
                          updateSettings(prev => ({...prev, level: level as GameSettings['level']}));
                        }}
                        className={`p-3 sm:p-4 rounded-xl font-bold text-center transition-all transform hover:scale-105 border-2 min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center ${
                          settings.level === level 
                            ? selectedColor[level - 1]
                            : `${levelColors[level - 1]} hover:shadow-md`
                        }`}
                      >
                        <div className="text-xl sm:text-2xl mb-1 leading-none">{level}</div>
                        <div className="text-xs sm:text-sm leading-tight">{levelNames[level - 1]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => {
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
                    playSound('buttonClick');
                    pauseGame();
                  }}
                  className="bg-yellow-500 text-white text-xl font-bold py-3 px-6 rounded-xl hover:bg-yellow-600 transition-all shadow-lg"
                >
                  ⏸️ Pause
                </button>
                <button
                  onClick={() => {
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
                playSound('buttonClick');
                resumeGame();
              }}
              className="bg-green-500 text-white text-2xl font-bold py-4 px-8 rounded-xl hover:bg-green-600 transition-all shadow-lg"
            >
              ▶️ Resume
            </button>
            <button
              onClick={() => {
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
              <h1 className="text-4xl font-bold text-green-800 mb-4">🎉 Great Job! 🎉</h1>
              <p className="text-2xl text-green-600">Here are all your questions and answers:</p>
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
                playSound('buttonClick');
                restartGame();
              }}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white text-3xl font-bold py-6 rounded-2xl hover:from-green-600 hover:to-blue-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-4"
            >
              <RefreshCw className="w-8 h-8" />
              Start New Game!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MentalArithmeticGame;