import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { trackGameEvent, trackSettingsChange, trackButtonClick } from '../utils/analytics';
import * as Tone from 'tone';

// Type definitions
interface GameSettings {
    level: 1 | 2 | 3 | 4 | 5;
    theme: 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';
    soundEnabled: boolean;
}

interface PatternElement {
    type: 'number';
    value: number;
    display: string;
}

interface Question {
    pattern: PatternElement[];
    missingIndex: number;
    options: PatternElement[];
    correctAnswer: PatternElement;
    patternType: string;
    difficulty: number;
}

interface Theme {
    name: string;
    playingBg: string;
    cardBg: string;
    primary: string;
    secondary: string;
}

type GameState = 'playing' | 'results' | 'gameOver';
type SoundType = 'correct' | 'incorrect' | 'levelUp' | 'gameComplete' | 'buttonClick' | 'hint' | 'gameOver';

interface PatternsDetectiveGameProps {}

const PatternsDetectiveGame: React.FC<PatternsDetectiveGameProps> = () => {

    // In-memory settings store   
    const settingsRef = useRef<GameSettings>({
        level: 1,
        theme: 'default',
        soundEnabled: true
    });

    // Load settings from memory on component mount
    const [settings, setSettingsState] = useState<GameSettings>(() => {
        try {
            const stored = localStorage.getItem('patterns-detective-settings');
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
    const [gameState, setGameState] = useState<GameState>('playing');
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [lives, setLives] = useState<number>(3);
    const [streak, setStreak] = useState<number>(0);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<PatternElement | null>(null);
    const [feedback, setFeedback] = useState<string>('');
    const [questionsPerLevel] = useState<number>(5);
    const [usedPatternTypes, setUsedPatternTypes] = useState<Set<string>>(new Set());
    const [gameStartTime, setGameStartTime] = useState<number>(0);
    const [showLevelUpPopup, setShowLevelUpPopup] = useState<boolean>(false);
    const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);

    // Update settings function with memory persistence and analytics
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

        // Save to localStorage with error handling
        try {
            localStorage.setItem('patterns-detective-settings', JSON.stringify(updatedSettings));
        } catch (error) {
            console.log('Could not save settings to storage:', error);
        }
    };

    // Theme configurations
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

    const generateNumberPattern = (level: number, forcePatternType?: string): PatternElement[] => {
        const patternLength = 7; // All levels: 7 numbers
        
        const createSimpleArithmeticPattern = (): PatternElement[] => {
            // Level 1 ONLY: Very simple addition patterns (+1, +2)
            const start = Math.floor(Math.random() * 5) + 1; // 1-5
            const diff = Math.floor(Math.random() * 2) + 1; // +1 or +2 only
            return Array.from({length: patternLength}, (_, i) => ({
                type: 'number' as const,
                value: start + i * diff,
                display: (start + i * diff).toString()
            }));
        };

        const createSkipCountingPattern = (): PatternElement[] => {
            // Level 1 ONLY: Skip counting by 2, 5, or 10
            const steps = [2, 5, 10];
            const step = steps[Math.floor(Math.random() * steps.length)];
            const start = Math.floor(Math.random() * 5) + 1;
            return Array.from({length: patternLength}, (_, i) => ({
                type: 'number' as const,
                value: start + i * step,
                display: (start + i * step).toString()
            }));
        };

        const createDoublePattern = (): PatternElement[] => {
            // Level 1 ONLY: Simple doubling pattern (×2)
            const start = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
            const sequence = [start];
            for (let i = 1; i < Math.min(patternLength, 6); i++) { // Limit to prevent huge numbers
                sequence.push(sequence[i-1] * 2);
            }
            // If sequence too short, pad with addition
            while (sequence.length < patternLength) {
                sequence.push(sequence[sequence.length-1] + sequence[sequence.length-1]);
            }
            return sequence.map(value => ({
                type: 'number' as const,
                value,
                display: value.toString()
            }));
        };

        const createArithmeticJumpPattern = (): PatternElement[] => {
            // Level 2 ONLY: Arithmetic with bigger jumps (+3, +4, +5, +6)
            const start = Math.floor(Math.random() * 8) + 1;
            const diff = Math.floor(Math.random() * 4) + 3; // +3, +4, +5, or +6
            return Array.from({length: patternLength}, (_, i) => ({
                type: 'number' as const,
                value: start + i * diff,
                display: (start + i * diff).toString()
            }));
        };

        const createTriplePattern = (): PatternElement[] => {
            // Level 2 ONLY: Triple pattern (×3)
            const start = Math.floor(Math.random() * 2) + 1; // 1 or 2
            const sequence = [start];
            for (let i = 1; i < Math.min(patternLength, 5); i++) { // Limit to prevent huge numbers
                sequence.push(sequence[i-1] * 3);
            }
            // If sequence too short, pad with last * 3
            while (sequence.length < patternLength) {
                sequence.push(sequence[sequence.length-1] * 3);
            }
            return sequence.slice(0, patternLength).map(value => ({
                type: 'number' as const,
                value,
                display: value.toString()
            }));
        };

        const createSquarePattern = (): PatternElement[] => {
            // Level 2 ONLY: Square numbers (1², 2², 3², 4²...)
            const start = Math.floor(Math.random() * 2) + 1; // Start at 1 or 2
            return Array.from({length: patternLength}, (_, i) => ({
                type: 'number' as const,
                value: Math.pow(start + i, 2),
                display: Math.pow(start + i, 2).toString()
            }));
        };

        const createFibonacciPattern = (): PatternElement[] => {
            // Level 3 ONLY: Fibonacci sequences
            const start1 = Math.floor(Math.random() * 3) + 1;
            const start2 = Math.floor(Math.random() * 3) + 1;
            const sequence = [start1, start2];
            
            while (sequence.length < patternLength) {
                const next = sequence[sequence.length - 1] + sequence[sequence.length - 2];
                if (next > 200) break;
                sequence.push(next);
            }
            
            if (sequence.length < patternLength) {
                return createArithmeticJumpPattern(); // fallback
            }
            
            return sequence.map(value => ({
                type: 'number' as const,
                value,
                display: value.toString()
            }));
        };

        const createTriangularPattern = (): PatternElement[] => {
            // Level 3 ONLY: Triangular numbers (1, 3, 6, 10, 15...)
            const length = Math.min(patternLength, 10);
            return Array.from({length}, (_, i) => ({
                type: 'number' as const,
                value: ((i + 1) * (i + 2)) / 2,
                display: (((i + 1) * (i + 2)) / 2).toString()
            }));
        };

        const createArithmeticSequenceLevel3 = (): PatternElement[] => {
            // Level 3 ONLY: Arithmetic with larger differences (+10 to +15)
            const start = Math.floor(Math.random() * 20) + 5;
            const diff = Math.floor(Math.random() * 6) + 10; // +10 to +15
            return Array.from({length: patternLength}, (_, i) => ({
                type: 'number' as const,
                value: start + i * diff,
                display: (start + i * diff).toString()
            }));
        };

        const createPerfectSquarePattern = (): PatternElement[] => {
            // Level 4 ONLY: Perfect squares for advanced level
            const start = Math.floor(Math.random() * 2) + 1;
            const length = Math.min(patternLength, 8);
            return Array.from({length}, (_, i) => ({
                type: 'number' as const,
                value: Math.pow(start + i, 2),
                display: Math.pow(start + i, 2).toString()
            }));
        };

        const createCubePattern = (): PatternElement[] => {
            // Level 4 ONLY: Perfect cubes
            const start = Math.floor(Math.random() * 2) + 1;
            const length = Math.min(patternLength, 6);
            return Array.from({length}, (_, i) => ({
                type: 'number' as const,
                value: Math.pow(start + i, 3),
                display: Math.pow(start + i, 3).toString()
            }));
        };

        const createPrimePattern = (): PatternElement[] => {
            // Level 4 ONLY: Prime number sequences
            const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];
            const length = Math.min(patternLength, primes.length);
            return Array.from({length}, (_, i) => ({
                type: 'number' as const,
                value: primes[i],
                display: primes[i].toString()
            }));
        };

        const createComplexGeometricPattern = (): PatternElement[] => {
            // Level 4 ONLY: More complex geometric (multiply by 4, 5, or 6)
            const start = Math.floor(Math.random() * 2) + 1;
            const ratio = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
            const length = Math.min(patternLength, 5); // Keep numbers manageable
            return Array.from({length}, (_, i) => ({
                type: 'number' as const,
                value: start * Math.pow(ratio, i),
                display: (start * Math.pow(ratio, i)).toString()
            }));
        };

        const createFactorialPattern = (): PatternElement[] => {
            // Level 5 ONLY: Factorial sequences
            const factorials = [1, 1, 2, 6, 24, 120, 720, 5040];
            const length = Math.min(patternLength, factorials.length);
            return Array.from({length}, (_, i) => ({
                type: 'number' as const,
                value: factorials[i],
                display: factorials[i].toString()
            }));
        };

        const createPentagonalPattern = (): PatternElement[] => {
            // Level 5 ONLY: Pentagonal numbers
            const length = Math.min(patternLength, 8);
            return Array.from({length}, (_, i) => ({
                type: 'number' as const,
                value: ((i + 1) * (3 * (i + 1) - 1)) / 2,
                display: (((i + 1) * (3 * (i + 1) - 1)) / 2).toString()
            }));
        };

        const createComplexFibonacciPattern = (): PatternElement[] => {
            // Level 5 ONLY: Tribonacci (sum of previous 3 numbers)
            const start1 = 1;
            const start2 = 1;
            const start3 = 2;
            const sequence = [start1, start2, start3];
            
            while (sequence.length < patternLength) {
                const next = sequence[sequence.length - 1] + sequence[sequence.length - 2] + sequence[sequence.length - 3];
                if (next > 1000) break;
                sequence.push(next);
            }
            
            if (sequence.length < patternLength) {
                return createFactorialPattern(); // fallback
            }
            
            return sequence.map(value => ({
                type: 'number' as const,
                value,
                display: value.toString()
            }));
        };

        const createLucasPattern = (): PatternElement[] => {
            // Level 5 ONLY: Lucas numbers (2, 1, 3, 4, 7, 11, 18...)
            const sequence = [2, 1];
            
            while (sequence.length < patternLength) {
                const next = sequence[sequence.length - 1] + sequence[sequence.length - 2];
                if (next > 500) break;
                sequence.push(next);
            }
            
            if (sequence.length < patternLength) {
                return createPentagonalPattern(); // fallback
            }
            
            return sequence.map(value => ({
                type: 'number' as const,
                value,
                display: value.toString()
            }));
        };
        
        // EXCLUSIVE patterns per level - NO OVERLAP with duplicate prevention
        let availablePatterns: {name: string, fn: () => PatternElement[]}[];
        if (level === 1) {
            // Level 1: Very basic patterns - simple addition, skip counting, doubling
            availablePatterns = [
                {name: 'simple-arithmetic', fn: createSimpleArithmeticPattern},
                {name: 'skip-counting', fn: createSkipCountingPattern},
                {name: 'doubling', fn: createDoublePattern}
            ];
        } else if (level === 2) {
            // Level 2: Intermediate patterns - bigger jumps, tripling, squares
            availablePatterns = [
                {name: 'arithmetic-jump', fn: createArithmeticJumpPattern},
                {name: 'tripling', fn: createTriplePattern},
                {name: 'squares', fn: createSquarePattern}
            ];
        } else if (level === 3) {
            // Level 3: Advanced sequences (3 patterns)
            availablePatterns = [
                {name: 'fibonacci', fn: createFibonacciPattern},
                {name: 'triangular', fn: createTriangularPattern},
                {name: 'arithmetic-level3', fn: createArithmeticSequenceLevel3}
            ];
        } else if (level === 4) {
            // Level 4: Expert mathematical sequences (4 patterns)
            availablePatterns = [
                {name: 'perfect-square', fn: createPerfectSquarePattern},
                {name: 'cube', fn: createCubePattern},
                {name: 'prime', fn: createPrimePattern},
                {name: 'complex-geometric', fn: createComplexGeometricPattern}
            ];
        } else {
            // Level 5: Master level sequences (4 patterns)
            availablePatterns = [
                {name: 'factorial', fn: createFactorialPattern},
                {name: 'pentagonal', fn: createPentagonalPattern},
                {name: 'tribonacci', fn: createComplexFibonacciPattern},
                {name: 'lucas', fn: createLucasPattern}
            ];
        }
        
        // If forcing a specific pattern type, use it
        if (forcePatternType) {
            const forcedPattern = availablePatterns.find(p => p.name === forcePatternType);
            if (forcedPattern) {
                return forcedPattern.fn();
            }
        }
        
        // Filter out already used patterns for this level
        const unusedPatterns = availablePatterns.filter(p => !usedPatternTypes.has(`${level}-${p.name}`));
        
        // If all patterns used, reset for this level
        if (unusedPatterns.length === 0) {
            // Clear used patterns for this level only
            const newUsedPatterns = new Set([...usedPatternTypes].filter(pattern => !pattern.startsWith(`${level}-`)));
            setUsedPatternTypes(newUsedPatterns);
            const selectedPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
            setUsedPatternTypes(prev => new Set([...prev, `${level}-${selectedPattern.name}`]));
            return selectedPattern.fn();
        }
        
        const selectedPattern = unusedPatterns[Math.floor(Math.random() * unusedPatterns.length)];
        setUsedPatternTypes(prev => new Set([...prev, `${level}-${selectedPattern.name}`]));
        return selectedPattern.fn();
    };


    // Sound functions
    const playSound = async (type: SoundType): Promise<void> => {
        if (!settings.soundEnabled) return;

        try {
            if (Tone.getContext().state !== 'running') {
                console.log('Audio context not running, starting...');
                await Tone.start();
            }

            const synth = new Tone.Synth({
                oscillator: {
                    type: "sine"
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.5
                }
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
                case 'hint':
                    synth.triggerAttackRelease('A4', '0.2');
                    setTimeout(() => synth.triggerAttackRelease('C5', '0.2'), 150);
                    break;
                case 'gameOver':
                    synth.triggerAttackRelease('C3', '0.6');
                    setTimeout(() => synth.triggerAttackRelease('G2', '0.8'), 400);
                    break;
            }

            setTimeout(() => {
                synth.dispose();
            }, 1000);

        } catch (error) {
            console.log('Audio not available:', error);
        }
    };

    // Game functions
    const generateUniqueQuestions = (level: number): Question[] => {
        // Clear used patterns for this level when starting new game
        setUsedPatternTypes(prev => new Set([...prev].filter(pattern => !pattern.startsWith(`${level}-`))));
        
        const questions: Question[] = [];
        const availablePatternNames = level === 1 ? ['simple-arithmetic', 'skip-counting', 'doubling'] :
                                   level === 2 ? ['arithmetic-jump', 'tripling', 'squares'] :
                                   level === 3 ? ['fibonacci', 'triangular', 'arithmetic-level3'] :
                                   level === 4 ? ['perfect-square', 'cube', 'prime', 'complex-geometric'] :
                                   ['factorial', 'pentagonal', 'tribonacci', 'lucas'];
        
        // Shuffle pattern names to randomize order
        const shuffledPatterns = [...availablePatternNames].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < questionsPerLevel; i++) {
            const patternIndex = i % shuffledPatterns.length;
            const selectedPatternType = shuffledPatterns[patternIndex];
            
            const pattern = generateNumberPattern(level, selectedPatternType);
            const missingIndex = pattern.length - 1;
            const correctAnswer = pattern[missingIndex];

            // Generate wrong options
            const options = [correctAnswer];
            
            while (options.length < 4) {
                const offset = Math.floor(Math.random() * 20) - 10;
                const wrongValue = (correctAnswer.value as number) + offset;
                if (wrongValue > 0 && wrongValue !== correctAnswer.value) {
                    const wrongOption = {
                        type: 'number' as const,
                        value: wrongValue,
                        display: wrongValue.toString()
                    };
                    
                    if (!options.some(opt => opt.value === wrongOption.value)) {
                        options.push(wrongOption);
                    }
                }
            }

            // Shuffle options
            options.sort(() => Math.random() - 0.5);

            questions.push({
                pattern,
                missingIndex,
                options,
                correctAnswer,
                patternType: 'number',
                difficulty: level
            });
        }
        
        return questions;
    };

    const startGame = (): void => {
        playSound('buttonClick');
        
        const questions = generateUniqueQuestions(settings.level);
        
        setAllQuestions(questions);
        setCurrentQuestion(0);
        // DON'T reset score when advancing levels - only on fresh game start
        if (gameState !== 'playing') {
            setScore(0);
        }
        // Don't reset lives when advancing levels - only reset on fresh restart
        if (gameState !== 'playing') {
            setLives(3);
        }
        setStreak(0);
        setSelectedAnswer(null);
        setFeedback('');
        setGameState('playing');

        const startTime = Date.now();
        setGameStartTime(startTime);
        
        setTimeout(() => {
            trackGameEvent('patterns-detective', 'start', {
                level: settings.level,
                soundEnabled: settings.soundEnabled
            });
        }, 0);
    };

    const selectAnswer = (answer: PatternElement): void => {
        if (selectedAnswer) return; // Prevent multiple selections

        setSelectedAnswer(answer);
        
        const currentQ = allQuestions[currentQuestion];
        const isCorrect = answer.value === currentQ.correctAnswer.value;

        if (isCorrect) {
            playSound('correct');
            setFeedback('🎉 Excellent! You found the pattern!');
            const points = (10 + settings.level * 5) * (streak + 1);
            setScore(prev => prev + points);
            setStreak(prev => prev + 1);

            setTimeout(() => {
                if (currentQuestion < allQuestions.length - 1) {
                    setCurrentQuestion(prev => prev + 1);
                    setSelectedAnswer(null);
                    setFeedback('');
                } else {
                    // Level completed
                    if (settings.level < 5) {
                        playSound('levelUp');
                        setShowLevelUpPopup(true);
                        updateSettings(prev => ({ ...prev, level: (prev.level + 1) as GameSettings['level'] }));
                        setTimeout(() => {
                            setShowLevelUpPopup(false);
                            startGame();
                        }, 3000);
                    } else {
                        playSound('gameComplete');
                        completeGame();
                    }
                }
            }, 1500);
        } else {
            playSound('incorrect');
            setFeedback('🤔 Not quite right. Try again!');
            setStreak(0);
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setTimeout(() => {
                        setGameState('gameOver');
                    }, 1000);
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

    const confirmRestart = (): void => {
        setTimeout(() => {
            trackGameEvent('patterns-detective', 'restart', {
                currentQuestion: currentQuestion + 1,
                score: score,
                level: settings.level
            });
        }, 0);

        // Reset level to 1 and score to 0
        updateSettings(prev => ({ ...prev, level: 1 }));
        setShowRestartConfirm(false);
        setGameState('playing');
        
        // Reset all game states
        setCurrentQuestion(0);
        setScore(0);
        setLives(3);
        setStreak(0);
        setSelectedAnswer(null);
        setFeedback('');
        setShowLevelUpPopup(false);
        setUsedPatternTypes(new Set()); // Clear pattern tracking
        
        // Start new game immediately with level 1 - don't wait for settings update
        const questions = generateUniqueQuestions(1); // Force level 1 with unique patterns
        
        setAllQuestions(questions);
        setGameStartTime(Date.now());
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

        setGameState('results');
    };

    // Initialize game on mount
    useEffect(() => {
        startGame();
    }, []);

    // Play game over sound when entering game over state
    useEffect(() => {
        if (gameState === 'gameOver') {
            playSound('gameOver');
        }
    }, [gameState]);

    // Game Screen
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
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Search className={`w-8 h-8 ${currentTheme.primary}`} />
                                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${currentTheme.primary}`}>
                                    Patterns Detective
                                </h1>
                            </div>
                            <p className={`text-sm sm:text-base ${currentTheme.secondary} mb-4`}>
                                🧠 Train your computational thinking by recognizing number patterns! 
                                Find the missing number in each mathematical sequence.
                            </p>
                            
                            {/* Game Stats */}
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

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className={currentTheme.secondary}>
                                    Question {currentQuestion + 1} of {questionsPerLevel}
                                </span>
                                <span className={currentTheme.secondary}>
                                    Level {settings.level} Progress
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${((currentQuestion + 1) / questionsPerLevel) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Pattern Display */}
                        <div className="mb-8">
                            <h3 className={`text-lg font-bold ${currentTheme.primary} mb-4 text-center`}>
                                Find the missing number in this mathematical sequence:
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

                        {/* Options */}
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
                                        className={`w-full h-16 border-3 rounded-xl flex items-center justify-center text-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                                            selectedAnswer
                                                ? option.value === selectedAnswer.value
                                                    ? selectedAnswer.value === currentQ.correctAnswer.value
                                                        ? 'border-green-500 bg-green-100 text-green-800'
                                                        : 'border-red-500 bg-red-100 text-red-800'
                                                    : 'border-gray-300 bg-gray-100 text-gray-600 opacity-60'
                                                : 'border-blue-500 bg-blue-50 hover:border-blue-600 hover:bg-blue-100 text-blue-800 hover:shadow-xl cursor-pointer'
                                        }`}
                                    >
                                        {option.display}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
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

                        {/* Controls */}
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={restartGame}
                                className="bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center gap-2 border-2 border-red-600"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Restart
                            </button>
                        </div>

                        {/* Level Up Popup */}
                        {showLevelUpPopup && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h2 className="text-3xl font-bold text-purple-800 mb-2">Level Up!</h2>
                                    <p className="text-xl text-purple-600 mb-4">
                                        Congratulations! You've advanced to Level {settings.level}!
                                    </p>
                                    <div className="text-lg text-gray-600">
                                        Get ready for more challenging patterns...
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Restart Confirmation Popup */}
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

    // Results Screen
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
                                Great job, Pattern Detective! You've sharpened your mathematical thinking skills!
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

                        <div className="bg-green-50 rounded-2xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-green-800 mb-3">
                                🧠 Mathematical Thinking Skills Developed
                            </h3>
                            <div className="text-green-700 space-y-2">
                                <div>✓ <strong>Number Pattern Recognition:</strong> Identifying mathematical sequences and relationships</div>
                                <div>✓ <strong>Logical Reasoning:</strong> Understanding mathematical rules and applying them</div>
                                <div>✓ <strong>Problem Solving:</strong> Breaking down complex numerical patterns</div>
                                <div>✓ <strong>Abstract Thinking:</strong> Working with mathematical concepts and sequences</div>
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

    // Game Over Screen
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
                                <div>🎯 Number pattern recognition improves with practice</div>
                                <div>🧠 Each attempt strengthens your mathematical thinking</div>
                                <div>🌟 Try again to beat your high score!</div>
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