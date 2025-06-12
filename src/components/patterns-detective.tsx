import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { trackGameEvent, trackSettingsChange, trackButtonClick } from '../utils/analytics';
import { getRandomSequencesByLevel, type PatternSequence } from '../utils/supabase';
import * as Tone from 'tone';

interface GameSettings {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    theme: 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';
    soundEnabled: boolean;
}

interface PatternElement {
    type: 'number';
    value: number;
    display: string;
}

interface Question {
    id: string;
    pattern: PatternElement[];
    missingIndex: number;
    options: PatternElement[];
    correctAnswer: PatternElement;
    patternName: string;
    difficulty: number;
}

interface Theme {
    name: string;
    playingBg: string;
    cardBg: string;
    primary: string;
    secondary: string;
}

interface SavedGameState {
    currentQuestion: number;
    score: number;
    lives: number;
    streak: number;
    level: number;
    allQuestions: Question[];
    gameStartTime: number;
}

type GameState = 'playing' | 'results' | 'gameOver';
type SoundType = 'correct' | 'incorrect' | 'levelUp' | 'gameComplete' | 'buttonClick' | 'hint' | 'gameOver';

const PatternsDetectiveGame: React.FC = () => {
    const settingsRef = useRef<GameSettings>({
        level: 1,
        theme: 'default',
        soundEnabled: true
    });

    const [settings, setSettingsState] = useState<GameSettings>(() => {
        try {
            const stored = localStorage.getItem('patterns-detective-settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Only restore theme and sound settings, not level (level comes from game state)
                const settingsToRestore = {
                    level: settingsRef.current.level, // Keep default level
                    theme: parsed.theme || settingsRef.current.theme,
                    soundEnabled: parsed.soundEnabled !== undefined ? parsed.soundEnabled : settingsRef.current.soundEnabled
                };
                settingsRef.current = settingsToRestore;
                return settingsRef.current;
            }
        } catch (error) {
            console.log('Could not load settings from storage:', error);
        }
        return settingsRef.current;
    });

    const [gameState, setGameState] = useState<GameState>('playing');
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [lives, setLives] = useState<number>(3);
    const [streak, setStreak] = useState<number>(0);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<PatternElement | null>(null);
    const [feedback, setFeedback] = useState<string>('');
    const getQuestionsPerLevel = (level: number): number => {
        if (level === 1 || level === 2) return 10;
        if (level === 3) return 5;
        return 3; // levels 4, 5, 6
    };
    const [gameStartTime, setGameStartTime] = useState<number>(0);
    const [showLevelUpPopup, setShowLevelUpPopup] = useState<boolean>(false);
    const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [progressComplete, setProgressComplete] = useState<boolean>(false);

    const updateSettings = (newSettings: GameSettings | ((prev: GameSettings) => GameSettings)): void => {
        const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;

        setTimeout(() => {
            const changedSetting = Object.keys(updatedSettings).find(key =>
                JSON.stringify(updatedSettings[key as keyof GameSettings]) !==
                JSON.stringify(settings[key as keyof GameSettings])
            );

            if (changedSetting) {
                trackSettingsChange(
                    changedSetting,
                    updatedSettings[changedSetting as keyof GameSettings],
                    'patterns-detective'
                );
            }
        }, 0);

        settingsRef.current = updatedSettings;
        setSettingsState(updatedSettings);

        try {
            localStorage.setItem('patterns-detective-settings', JSON.stringify(updatedSettings));
        } catch (error) {
            console.log('Could not save settings to storage:', error);
        }
    };

    const saveGameState = (): void => {
        try {
            const gameState: SavedGameState = {
                currentQuestion,
                score,
                lives,
                streak,
                level: settings.level,
                allQuestions,
                gameStartTime
            };
            localStorage.setItem('patterns-detective-game-state', JSON.stringify(gameState));
        } catch (error) {
            console.log('Could not save game state to storage:', error);
        }
    };

    const loadGameState = (): SavedGameState | null => {
        try {
            const stored = localStorage.getItem('patterns-detective-game-state');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.log('Could not load game state from storage:', error);
        }
        return null;
    };

    const clearGameState = (): void => {
        try {
            localStorage.removeItem('patterns-detective-game-state');
        } catch (error) {
            console.log('Could not clear game state from storage:', error);
        }
    };

    const themes: Record<string, Theme> = {
        default: {
            name: 'Rainbow',
            playingBg: 'from-blue-400 via-purple-400 to-pink-400',
            cardBg: 'bg-white',
            primary: 'text-purple-800',
            secondary: 'text-purple-600'
        },
        ocean: {
            name: 'Ocean',
            playingBg: 'from-cyan-400 via-blue-400 to-indigo-400',
            cardBg: 'bg-blue-50',
            primary: 'text-blue-800',
            secondary: 'text-blue-600'
        },
        forest: {
            name: 'Forest',
            playingBg: 'from-emerald-400 via-green-400 to-teal-400',
            cardBg: 'bg-green-50',
            primary: 'text-green-800',
            secondary: 'text-green-600'
        },
        sunset: {
            name: 'Sunset',
            playingBg: 'from-red-400 via-orange-400 to-yellow-400',
            cardBg: 'bg-orange-50',
            primary: 'text-orange-800',
            secondary: 'text-orange-600'
        },
        lavender: {
            name: 'Lavender',
            playingBg: 'from-violet-400 via-purple-400 to-fuchsia-400',
            cardBg: 'bg-purple-50',
            primary: 'text-purple-800',
            secondary: 'text-purple-600'
        }
    };

    const currentTheme: Theme = themes[settings.theme] || themes.default;

    const playSound = async (type: SoundType): Promise<void> => {
        if (!settings.soundEnabled) return;

        try {
            if (Tone.getContext().state !== 'running') {
                await Tone.start();
            }

            const synth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
            }).toDestination();

            switch (type) {
                case 'correct':
                    synth.triggerAttackRelease('C5', '0.2');
                    setTimeout(() => synth.triggerAttackRelease('E5', '0.2'), 100);
                    setTimeout(() => synth.triggerAttackRelease('G5', '0.3'), 200);
                    break;
                case 'incorrect':
                    synth.triggerAttackRelease('F3', '0.4');
                    break;
                case 'levelUp':
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
                case 'buttonClick':
                    synth.triggerAttackRelease('C4', '0.1');
                    break;
                case 'gameOver':
                    synth.triggerAttackRelease('C3', '0.6');
                    setTimeout(() => synth.triggerAttackRelease('G2', '0.8'), 400);
                    break;
                default:
                    break;
            }

            setTimeout(() => synth.dispose(), 1000);
        } catch (error) {
            console.log('Audio not available:', error);
        }
    };

    const generateRandomMissingIndex = (length: number): number => {
        return Math.floor(Math.random() * length);
    };

    const generateWrongOptions = (correctValue: number): number[] => {
        const options = new Set<number>();
        const ranges = [
            () => correctValue + Math.floor(Math.random() * 10) + 1,
            () => correctValue - Math.floor(Math.random() * 10) - 1,
            () => correctValue + Math.floor(Math.random() * 20) + 10,
            () => correctValue - Math.floor(Math.random() * 20) - 10,
            () => Math.floor(correctValue * 1.5),
            () => Math.floor(correctValue * 0.7),
        ];

        while (options.size < 3) {
            const randomRange = ranges[Math.floor(Math.random() * ranges.length)];
            const wrongValue = randomRange();
            if (wrongValue > 0 && wrongValue !== correctValue) {
                options.add(wrongValue);
            }
        }

        return Array.from(options);
    };

    const createQuestionFromSequence = (sequence: PatternSequence): Question => {
        const missingIndex = generateRandomMissingIndex(sequence.sequence_numbers.length);
        const correctValue = sequence.sequence_numbers[missingIndex];
        
        const pattern: PatternElement[] = sequence.sequence_numbers.map(num => ({
            type: 'number' as const,
            value: num,
            display: num.toString()
        }));

        const correctAnswer: PatternElement = {
            type: 'number',
            value: correctValue,
            display: correctValue.toString()
        };

        const wrongValues = generateWrongOptions(correctValue);
        const allOptions = [correctAnswer, ...wrongValues.map(val => ({
            type: 'number' as const,
            value: val,
            display: val.toString()
        }))];

        allOptions.sort(() => Math.random() - 0.5);

        return {
            id: sequence.id,
            pattern,
            missingIndex,
            options: allOptions,
            correctAnswer,
            patternName: sequence.pattern_name,
            difficulty: sequence.level_order
        };
    };

    const loadQuestionsFromSupabase = async (level: number): Promise<Question[]> => {
        setLoading(true);
        try {
            const questionsCount = getQuestionsPerLevel(level);
            const sequences = await getRandomSequencesByLevel(level, questionsCount);
            
            if (sequences.length === 0) {
                console.warn(`No sequences found for level ${level}`);
                return [];
            }

            const questions = sequences.map(sequence => createQuestionFromSequence(sequence));
            return questions;
        } catch (error) {
            console.error('Error loading questions from Supabase:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const startGame = async (forceLevel?: number): Promise<void> => {
        playSound('buttonClick');
        
        // Always reset game state when starting
        setCurrentQuestion(0);
        setScore(0);
        setLives(3);
        setStreak(0);
        setSelectedAnswer(null);
        setFeedback('');
        setGameState('playing');
        setGameStartTime(Date.now());
        setProgressComplete(false);
        
        // Clear previous questions to prevent carryover
        setAllQuestions([]);
        
        // Use forced level or current settings level
        const levelToUse = forceLevel ?? settings.level;
        
        // Load questions for specified level
        const questions = await loadQuestionsFromSupabase(levelToUse);
        
        if (questions.length === 0) {
            setFeedback('Unable to load questions. Please try again.');
            return;
        }

        setAllQuestions(questions);
        
        setTimeout(() => {
            trackGameEvent('patterns-detective', 'start', {
                level: levelToUse,
                soundEnabled: settings.soundEnabled
            });
        }, 0);
    };

    const selectAnswer = (answer: PatternElement): void => {
        if (selectedAnswer) return;

        setSelectedAnswer(answer);
        
        const currentQ = allQuestions[currentQuestion];
        const isCorrect = answer.value === currentQ.correctAnswer.value;

        if (isCorrect) {
            playSound('correct');
            setFeedback('🎉 Excellent! You found the pattern!');
            const points = (10 + settings.level * 5) * (streak + 1);
            setScore(prev => prev + points);
            setStreak(prev => prev + 1);

            setTimeout(async () => {
                if (currentQuestion < allQuestions.length - 1) {
                    setCurrentQuestion(prev => prev + 1);
                    setSelectedAnswer(null);
                    setFeedback('');
                } else {
                    // Final question - animate progress to 100% first
                    setProgressComplete(true);
                    
                    // Wait for progress animation, then show popup
                    setTimeout(() => {
                        if (settings.level < 6) {
                            playSound('levelUp');
                            setShowLevelUpPopup(true);
                            const nextLevel = settings.level + 1 as GameSettings['level'];
                            updateSettings(prev => ({ ...prev, level: nextLevel }));
                            
                            setTimeout(async () => {
                                setShowLevelUpPopup(false);
                                // Explicitly start game with the next level to ensure fresh questions
                                await startGame(nextLevel);
                            }, 3000);
                        } else {
                            playSound('gameComplete');
                            completeGame();
                        }
                    }, 800); // Wait for progress bar animation
                }
            }, 1500);
        } else {
            playSound('incorrect');
            setFeedback('🤔 Not quite right. Try again!');
            setStreak(0);
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setTimeout(() => setGameState('gameOver'), 1000);
                }
                return newLives;
            });

            setTimeout(() => {
                setSelectedAnswer(null);
                setFeedback('');
            }, 1500);
        }
    };

    const restartGame = (): void => {
        setShowRestartConfirm(true);
    };

    const confirmRestart = async (): Promise<void> => {
        setTimeout(() => {
            trackGameEvent('patterns-detective', 'restart', {
                currentQuestion: currentQuestion + 1,
                score: score,
                level: settings.level
            });
        }, 0);

        // Clear saved game state on restart
        clearGameState();

        // Reset all game state first
        setShowRestartConfirm(false);
        setCurrentQuestion(0);
        setScore(0);
        setLives(3);
        setStreak(0);
        setSelectedAnswer(null);
        setFeedback('');
        setShowLevelUpPopup(false);
        setProgressComplete(false);
        setAllQuestions([]);
        
        // Then update settings to level 1 and start fresh
        updateSettings(prev => ({ ...prev, level: 1 }));
        
        // Start game with level 1 explicitly
        await startGame(1);
    };

    const cancelRestart = (): void => {
        setShowRestartConfirm(false);
    };

    const completeGame = (): void => {
        const duration = gameStartTime ? Date.now() - gameStartTime : 0;

        setTimeout(() => {
            trackGameEvent('patterns-detective', 'complete', {
                score: score,
                duration: Math.round(duration / 1000),
                level: settings.level,
                finalStreak: streak
            });
        }, 0);

        // Clear saved state when game is completed
        clearGameState();
        setGameState('results');
    };

    const getLevelDisplayName = (level: number): string => {
        const levelNames = {
            1: 'Level 1: Basic Arithmetic',
            2: 'Level 2: Intermediate Patterns', 
            3: 'Level 3: Advanced Patterns',
            4: 'Level 4: Expert Patterns',
            5: 'Level 5: Master Patterns',
            6: 'Olympic Level: Competition Patterns'
        };
        return levelNames[level as keyof typeof levelNames] || `Level ${level}`;
    };

    useEffect(() => {
        // Try to restore saved game state first
        const savedState = loadGameState();
        if (savedState && savedState.lives > 0 && savedState.allQuestions.length > 0) {
            // Restore the saved game state
            setCurrentQuestion(savedState.currentQuestion);
            setScore(savedState.score);
            setLives(savedState.lives);
            setStreak(savedState.streak);
            setAllQuestions(savedState.allQuestions);
            setGameStartTime(savedState.gameStartTime);
            setGameState('playing');
            
            // Update settings level to match saved game level
            if (savedState.level !== settings.level) {
                updateSettings(prev => ({ ...prev, level: savedState.level as GameSettings['level'] }));
            }
        } else {
            // No saved state or invalid state, start fresh
            startGame();
        }
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (gameState === 'gameOver') {
            playSound('gameOver');
            clearGameState(); // Clear saved state on game over
        }
    }, [gameState]);  // eslint-disable-line react-hooks/exhaustive-deps

    // Save game state whenever key values change
    useEffect(() => {
        if (gameState === 'playing' && allQuestions.length > 0) {
            saveGameState();
        }
    }, [currentQuestion, score, lives, streak, settings.level, allQuestions, gameStartTime, gameState]);  // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className={`min-h-screen bg-gradient-to-br ${currentTheme.playingBg} p-4 flex items-center justify-center`}>
                <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-8 text-center`}>
                    <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className={`text-lg ${currentTheme.primary}`}>Loading patterns...</p>
                </div>
            </div>
        );
    }

    if (gameState === 'playing') {
        const currentQ = allQuestions[currentQuestion];
        if (!currentQ) return null;

        const patternWithMissing = currentQ.pattern.map((item, index) => 
            index === currentQ.missingIndex ? { ...item, display: '?' } : item
        );

        return (
            <div className={`min-h-screen bg-gradient-to-br ${currentTheme.playingBg} p-4`}>
                <div className="max-w-4xl mx-auto">
                    <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-6 sm:p-8`}>
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Search className={`w-8 h-8 ${currentTheme.primary}`} />
                                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${currentTheme.primary}`}>
                                    Patterns Detective
                                </h1>
                            </div>
                            <p className={`text-sm sm:text-base ${currentTheme.secondary} mb-2`}>
                                {getLevelDisplayName(settings.level)}
                            </p>
                            <p className={`text-sm sm:text-base ${currentTheme.secondary} mb-2`}>
                                🧠 Find the missing number in each mathematical sequence!
                            </p>
                            <p className={`text-xs sm:text-sm ${currentTheme.secondary} mb-4`}>
                                📊 Complete 6 challenging levels • Levels 1-2: 10 questions • Level 3: 5 questions • Levels 4-5: 3 questions • <strong>Final Olympic Level awaits!</strong>
                            </p>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                <div className="bg-blue-100 rounded-xl p-3">
                                    <div className="text-blue-800 font-bold text-lg">{score}</div>
                                    <div className="text-blue-600 text-sm">Score</div>
                                </div>
                                <div className="bg-green-100 rounded-xl p-3">
                                    <div className="text-green-800 font-bold text-lg">{settings.level}</div>
                                    <div className="text-green-600 text-sm">Level</div>
                                </div>
                                <div className="bg-red-100 rounded-xl p-3">
                                    <div className="text-red-800 font-bold text-lg">{'❤️'.repeat(lives)}</div>
                                    <div className="text-red-600 text-sm">Lives</div>
                                </div>
                                <div className="bg-yellow-100 rounded-xl p-3">
                                    <div className="text-yellow-800 font-bold text-lg">{streak}</div>
                                    <div className="text-yellow-600 text-sm">Streak</div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="text-center mb-2">
                                <span className={`${currentTheme.primary} font-semibold`}>
                                    Question {currentQuestion + 1} of {getQuestionsPerLevel(settings.level)}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className={currentTheme.secondary}>
                                    Level Progress
                                </span>
                                <span className={currentTheme.secondary}>
                                    {getLevelDisplayName(settings.level)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                                    style={{
                                        width: progressComplete 
                                            ? '100%' 
                                            : `${(currentQuestion / getQuestionsPerLevel(settings.level)) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className={`text-lg font-bold ${currentTheme.primary} mb-4 text-center`}>
                                Find the missing number in this sequence:
                            </h3>
                            <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6 flex-wrap">
                                {patternWithMissing.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`w-12 h-12 sm:w-16 sm:h-16 border-3 rounded-xl flex items-center justify-center text-lg sm:text-2xl font-bold transition-all ${
                                            index === currentQ.missingIndex
                                                ? 'border-dashed border-purple-500 bg-purple-100 animate-pulse'
                                                : 'border-solid border-gray-300 bg-white'
                                        }`}
                                    >
                                        {item.display}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className={`text-base font-bold ${currentTheme.primary} mb-4 text-center`}>
                                Choose the correct answer:
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto">
                                {currentQ.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => selectAnswer(option)}
                                        disabled={!!selectedAnswer}
                                        className={`w-full h-16 border-3 rounded-xl flex items-center justify-center text-xl font-bold transition-all transform hover:scale-105 shadow-lg touch-manipulation select-none ${
                                            selectedAnswer
                                                ? option.value === selectedAnswer.value
                                                    ? selectedAnswer.value === currentQ.correctAnswer.value
                                                        ? 'border-green-500 bg-green-100 text-green-800'
                                                        : 'border-red-500 bg-red-100 text-red-800'
                                                    : 'border-gray-300 bg-gray-100 text-gray-600 opacity-60'
                                                : 'border-blue-500 bg-blue-50 hover:border-blue-600 hover:bg-blue-100 text-blue-800 hover:shadow-xl cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50'
                                        }`}
                                        onTouchEnd={(e) => {
                                            // Remove focus after touch to prevent persistent highlighting
                                            e.currentTarget.blur();
                                        }}
                                    >
                                        {option.display}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {feedback && (
                            <div className="text-center mb-6">
                                <div className={`text-lg font-bold ${
                                    feedback.includes('🎉') ? 'text-green-700' :
                                    feedback.includes('🤔') ? 'text-red-700' :
                                    'text-blue-700'
                                }`}>
                                    {feedback}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={restartGame}
                                className="bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center gap-2 border-2 border-red-600"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Restart
                            </button>
                        </div>

                        {showLevelUpPopup && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h2 className="text-3xl font-bold text-purple-800 mb-2">
                                        {settings.level === 6 ? 'Olympic Level!' : 'Level Up!'}
                                    </h2>
                                    <p className="text-xl text-purple-600 mb-4">
                                        {settings.level === 6 
                                            ? "Welcome to the Olympic Level! Prepare for competition-level patterns!" 
                                            : `Congratulations! You've advanced to ${getLevelDisplayName(settings.level)}!`
                                        }
                                    </p>
                                    <div className="text-lg text-gray-600">
                                        Get ready for more challenging patterns...
                                    </div>
                                </div>
                            </div>
                        )}

                        {showRestartConfirm && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl">
                                    <div className="text-5xl mb-4">⚠️</div>
                                    <h2 className="text-2xl font-bold text-red-800 mb-2">Restart Game?</h2>
                                    <p className="text-lg text-gray-600 mb-6">
                                        This will reset your progress back to Level 1. Are you sure?
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
                </div>
            </div>
        );
    }

    if (gameState === 'results') {
        return (
            <div className={`min-h-screen bg-gradient-to-br ${currentTheme.playingBg} p-4`}>
                <div className="max-w-2xl mx-auto">
                    <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-8 text-center`}>
                        <div className="mb-8">
                            <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-4">
                                🎉 Game Complete! 🎉
                            </h1>
                            <p className="text-lg text-green-600 mb-6">
                                Congratulations! You've completed all levels including the Olympic Level!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            <div className="bg-blue-100 rounded-2xl p-6">
                                <div className="text-blue-800 font-bold text-3xl mb-2">{score}</div>
                                <div className="text-blue-600 text-lg">Final Score</div>
                            </div>
                            <div className="bg-purple-100 rounded-2xl p-6">
                                <div className="text-purple-800 font-bold text-3xl mb-2">{settings.level}</div>
                                <div className="text-purple-600 text-lg">Level Completed</div>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-2xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-green-800 mb-3">
                                🧠 Mathematical Thinking Skills Mastered
                            </h3>
                            <div className="text-green-700 space-y-2">
                                <div>✓ <strong>Pattern Recognition:</strong> Expert level sequence identification</div>
                                <div>✓ <strong>Mathematical Reasoning:</strong> Competition-level problem solving</div>
                                <div>✓ <strong>Abstract Thinking:</strong> Advanced mathematical concepts</div>
                                <div>✓ <strong>Olympic Skills:</strong> Competition-ready pattern analysis</div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                trackButtonClick('new-game', 'patterns-detective-results');
                                playSound('buttonClick');
                                confirmRestart();
                            }}
                            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white text-2xl font-bold py-6 rounded-2xl hover:from-green-600 hover:to-blue-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-4 border-2 border-blue-600"
                        >
                            <RefreshCw className="w-8 h-8" />
                            Play Again!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'gameOver') {
        return (
            <div className={`min-h-screen bg-gradient-to-br ${currentTheme.playingBg} p-4`}>
                <div className="max-w-2xl mx-auto">
                    <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-8 text-center`}>
                        <div className="mb-8">
                            <h1 className="text-3xl sm:text-4xl font-bold text-red-800 mb-4">
                                💔 Game Over! 💔
                            </h1>
                            <p className="text-lg text-red-600 mb-6">
                                You ran out of lives, but great effort, Pattern Detective!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            <div className="bg-blue-100 rounded-2xl p-6">
                                <div className="text-blue-800 font-bold text-3xl mb-2">{score}</div>
                                <div className="text-blue-600 text-lg">Final Score</div>
                            </div>
                            <div className="bg-purple-100 rounded-2xl p-6">
                                <div className="text-purple-800 font-bold text-3xl mb-2">{settings.level}</div>
                                <div className="text-purple-600 text-lg">Level Reached</div>
                            </div>
                        </div>

                        <div className="bg-orange-50 rounded-2xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-orange-800 mb-3">
                                💪 Keep Practicing!
                            </h3>
                            <div className="text-orange-700 space-y-2">
                                <div>🎯 Pattern recognition improves with practice</div>
                                <div>🧠 Each attempt strengthens your mathematical thinking</div>
                                <div>🌟 Try again to reach the Olympic Level!</div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                trackButtonClick('try-again', 'patterns-detective-game-over');
                                playSound('buttonClick');
                                confirmRestart();
                            }}
                            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-2xl font-bold py-6 rounded-2xl hover:from-red-600 hover:to-orange-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-4 border-2 border-red-600"
                        >
                            <RefreshCw className="w-8 h-8" />
                            Try Again!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default PatternsDetectiveGame;