import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, ArrowLeft, Divide } from 'lucide-react';
import { trackGameEvent, trackSettingsChange, trackButtonClick } from '../utils/analytics';
import { useGameState } from '../hooks/useGameState';
import * as Tone from 'tone';

// Type definitions
interface GameSettings {
    divisorDigits: 1 | 2 | 3 | 4;
    dividendDigits: 1 | 2 | 3 | 4;
    numQuestions: number;
    level: 1 | 2 | 3 | 4 | 5;
    theme: 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';
    speechEnabled: boolean;
    soundEnabled: boolean;
}

interface Question {
    dividend: number;
    divisor: number;
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

interface MentalDivisionGameProps {
    onBackToHome?: () => void;
}

const MentalDivisionGame: React.FC<MentalDivisionGameProps> = ({ onBackToHome }) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const { updateGameState } = useGameState();

    // In-memory settings store   
    const settingsRef = useRef<GameSettings>({
        divisorDigits: 1,
        dividendDigits: 2,
        numQuestions: 10,
        level: 1,
        theme: 'default',
        speechEnabled: false,
        soundEnabled: true
    });

    // Load settings from memory on component mount
    const [settings, setSettingsState] = useState<GameSettings>(() => {
        try {
            const stored = localStorage.getItem('mental-division-settings');
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
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [nextQuestionNumber, setNextQuestionNumber] = useState<number>(1);
    const [showingQuestion, setShowingQuestion] = useState<boolean>(true);
    const [showingAnswer, setShowingAnswer] = useState<boolean>(false);
    const [calculatingAnswer, setCalculatingAnswer] = useState<boolean>(false);
    const [showingGetReady, setShowingGetReady] = useState<boolean>(false);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [displayText, setDisplayText] = useState<string>('');
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [, setSpeechInitialized] = useState<boolean>(false);
    const [gameStartTime, setGameStartTime] = useState<number>(0);

    // Speech synthesis references
    const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

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
                    'mental-division'
                );
            }
        }, 0);

        settingsRef.current = updatedSettings;
        setSettingsState(updatedSettings);

        // Save to localStorage with error handling
        try {
            localStorage.setItem('mental-division-settings', JSON.stringify(updatedSettings));
        } catch (error) {
            console.log('Could not save settings to storage:', error);
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

    // Generate number functions
    const generateNumber = (digits: number): number => {
        if (digits === 1) {
            return Math.floor(Math.random() * 9) + 1;
        } else if (digits === 2) {
            return Math.floor(Math.random() * 90) + 10;
        } else if (digits === 3) {
            return Math.floor(Math.random() * 900) + 100;
        } else { // 4 digits
            return Math.floor(Math.random() * 9000) + 1000;
        }
    };

    const generateQuestion = (): Question => {
        let divisor: number;
        let dividend: number;
        let answer: number;
        let dividendDigitCount: number;
        let attempts = 0;
        const maxAttempts = 1000; // Prevent infinite loops

        // Keep generating until we get a valid question
        do {
            attempts++;
            if (attempts > maxAttempts) {
                // Fallback to ensure we don't get stuck
                divisor = generateNumber(settings.divisorDigits);
                answer = Math.floor(Math.random() * 999) + 2; // 2-1000 range
                dividend = divisor * answer;
                dividendDigitCount = dividend.toString().length;
                break;
            }

            // Generate divisor with bias against 1 (make divisor = 1 less frequent)
            if (settings.divisorDigits === 1 && Math.random() < 0.1) {
                // Only 10% chance of getting divisor = 1 for single digit
                divisor = 1;
            } else {
                divisor = generateNumber(settings.divisorDigits);
                // Ensure we don't get divisor = 1 when we don't want it
                while (divisor === 1 && Math.random() < 0.9) {
                    divisor = generateNumber(settings.divisorDigits);
                }
            }

            // Generate answer with wider range (can be more than 2 digits)
            // Range depends on dividend digits to ensure realistic division problems
            const maxAnswer = Math.floor(Math.pow(10, settings.dividendDigits) / divisor);
            const minAnswer = 2; // Minimum answer to avoid trivial cases

            if (maxAnswer <= minAnswer) {
                // Set dummy values to avoid "not assigned" error and continue loop
                answer = minAnswer;
                dividend = divisor * answer;
                dividendDigitCount = dividend.toString().length;
                continue; // Skip if impossible to generate valid question
            }

            answer = Math.floor(Math.random() * (maxAnswer - minAnswer)) + minAnswer;

            // Calculate dividend
            dividend = divisor * answer;

            // Avoid division by itself (dividend = divisor, which gives answer = 1)
            if (dividend === divisor) {
                dividendDigitCount = dividend.toString().length; // Assign before continue
                continue;
            }

            // Check if dividend has the correct number of digits
            dividendDigitCount = dividend.toString().length;

        } while (dividendDigitCount !== settings.dividendDigits);

        return { dividend, divisor, answer };
    };

    // Add iOS audio context resumption effect
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && settings.soundEnabled) {
                try {
                    if (Tone.getContext().state === 'suspended') {
                        console.log('Resuming audio context after app became visible');
                        await Tone.start();
                    }
                } catch (error) {
                    console.log('Failed to resume audio context:', error);
                }
            }
        };

        const handleFocus = async () => {
            if (settings.soundEnabled) {
                try {
                    if (Tone.getContext().state !== 'running') {
                        console.log('Resuming audio context on window focus');
                        await Tone.start();
                    }
                } catch (error) {
                    console.log('Failed to resume audio context on focus:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [settings.soundEnabled]);

    // Broadcast game state changes to hide floating buttons during gameplay
    useEffect(() => {
        const isPlaying = gameState === 'playing';
        updateGameState('mental-division', isPlaying);
    }, [gameState, updateGameState]);

    // Enhanced speech function with better iOS/Safari support
    const speak = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!settings.speechEnabled || !('speechSynthesis' in window)) {
                resolve();
                return;
            }

            speechSynthesis.cancel();
            const speakDelay = isIOS ? 100 : 0;

            setTimeout(() => {
                if (speechTimeoutRef.current) {
                    clearTimeout(speechTimeoutRef.current);
                    speechTimeoutRef.current = null;
                }

                try {
                    const utterance = new SpeechSynthesisUtterance(text);
                    speechUtteranceRef.current = utterance;

                    if (preferredVoiceRef.current) {
                        utterance.voice = preferredVoiceRef.current;
                        console.log('🗣️ Using voice:', preferredVoiceRef.current.name);
                    } else if (isIOS) {
                        const voices = speechSynthesis.getVoices();
                        console.log('No preferred voice on iOS, available voices:', voices.map(v => v.name));

                        const femaleVoice = voices.find(voice =>
                            /(samantha|victoria|allison|ava|susan|kathy)/i.test(voice.name) ||
                            (voice.lang.startsWith('en-') && !/(alex|daniel|fred|ralph|tom|male|man)/i.test(voice.name))
                        );

                        if (femaleVoice) {
                            utterance.voice = femaleVoice;
                            console.log('🗣️ iOS emergency voice:', femaleVoice.name);
                        }
                    }

                    if (isIOS) {
                        utterance.rate = 1.0;
                        utterance.volume = 1.0;
                        utterance.pitch = 1.0;
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

                    utterance.onstart = () => {
                        console.log('Speech started:', text);
                    };

                    utterance.onend = () => {
                        console.log('Speech ended:', text);
                        resolveOnce();
                    };

                    utterance.onerror = (event) => {
                        console.log('Speech error:', event.error);
                        resolveOnce();
                    };

                    const estimatedDuration = estimateSpeechDuration(text);
                    const timeoutDuration = isIOS ? estimatedDuration + 1000 : estimatedDuration + 500;
                    speechTimeoutRef.current = setTimeout(() => {
                        console.log('Speech timeout for:', text);
                        resolveOnce();
                    }, timeoutDuration);

                    console.log('Starting speech:', text);
                    speechSynthesis.speak(utterance);

                    if (isIOS) {
                        setTimeout(() => {
                            if (speechSynthesis.paused && speechSynthesis.speaking) {
                                console.log('Resuming paused speech on iOS');
                                speechSynthesis.resume();
                            }
                        }, 150);
                    }

                } catch (error) {
                    console.log('Speech synthesis error:', error);
                    resolve();
                }
            }, speakDelay);
        });
    };

    // Enhanced speech duration estimation
    const estimateSpeechDuration = (text: string): number => {
        const wordsPerMinute = 100;
        const words = text.replace(' divided by ', '').replace(/\d+/g, '').split(/\s+/).filter(word => word.length > 0);

        const speedMultipliers = {
            1: 1.0,
            2: 0.85,
            3: 0.75
        };

        const speedMultiplier = speedMultipliers[settings.level as keyof typeof speedMultipliers] || 1.0;
        let baseTime = (words.length / wordsPerMinute) * 60 * 1000 * speedMultiplier;

        const numbers = text.match(/\d+/g) || [];
        const hasDividedBy = /divided by/i.test(text);
        const hasAnswerPhrase = /the answer is/i.test(text);

        let numberTime = 0;
        numbers.forEach(num => {
            const digitCount = num.length;
            if (digitCount === 1) {
                numberTime += 500 * speedMultiplier;
            } else if (digitCount === 2) {
                numberTime += 800 * speedMultiplier;
            } else if (digitCount === 3) {
                numberTime += 1400 * speedMultiplier;
            } else if (digitCount === 4) {
                numberTime += 1800 * speedMultiplier;
            }
        });

        if (hasDividedBy) {
            numberTime += 500 * speedMultiplier;
        }

        if (hasAnswerPhrase) {
            baseTime += 800 * speedMultiplier;
        }

        const minimumTime = Math.max(600 * speedMultiplier, text.length * 60 * speedMultiplier);

        return Math.max(minimumTime, baseTime + numberTime);
    };

    // Calculate dynamic delays based on level and speech duration
    const calculateSpeechDelay = (text: string, level: number): number => {
        if (!settings.speechEnabled) return 0;

        const baseDuration = estimateSpeechDuration(text);

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

    // Calculate delay specifically for after answer announcement    
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

            setTimeout(() => {
                synth.dispose();
            }, 1000);

        } catch (error) {
            console.log('Audio not available:', error);
        }
    };

    // Calculate delays (question delay and calculating answer delay) based on level
    const getDelays = (level: number) => {
        const baseNumberDelay = Math.max(0.5, 2 - (level - 1) * 0.3);
        const baseAnswerDelay = Math.max(1.25, 5 - (level) * 0.75);

        return {
            numberDelay: baseNumberDelay * 2, //Times 2, Because division is only per question, not per number, so it needs more delay time
            answerDelay: baseAnswerDelay
        };
    };

    // Initialize speech synthesis and find preferred female voice
    const initializeSpeechSync = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                console.log('Speech synthesis not supported');
                setSpeechInitialized(true);
                resolve(false);
                return;
            }

            const initializeWithDummySpeak = () => {
                try {
                    const initUtterance = new SpeechSynthesisUtterance('');
                    initUtterance.volume = 0;
                    initUtterance.rate = 10;

                    let initComplete = false;

                    const completeInit = () => {
                        if (initComplete) return;
                        initComplete = true;

                        setTimeout(() => {
                            setVoiceAfterInit();
                        }, 200);
                    };

                    initUtterance.onend = completeInit;
                    initUtterance.onerror = completeInit;

                    setTimeout(completeInit, 500);

                    speechSynthesis.speak(initUtterance);
                } catch (error) {
                    console.log('Dummy speak failed:', error);
                    setTimeout(() => {
                        setVoiceAfterInit();
                    }, 200);
                }
            };

            const setVoiceAfterInit = () => {
                speechSynthesis.cancel();

                const voices = speechSynthesis.getVoices();
                console.log('Available voices after init:', voices.map(v => `${v.name} (${v.lang})`));

                const femaleVoicePatterns = [
                    { pattern: /^Samantha$/i, priority: 20 },
                    { pattern: /^Victoria$/i, priority: 19 },
                    { pattern: /^Allison$/i, priority: 18 },
                    { pattern: /^Ava$/i, priority: 17 },
                    { pattern: /^Susan$/i, priority: 16 },
                    { pattern: /^Kathy$/i, priority: 15 },
                    { pattern: /samantha/i, priority: 14 },
                    { pattern: /victoria/i, priority: 13 },
                    { pattern: /allison/i, priority: 12 },
                    { pattern: /female/i, priority: 11 },
                    { pattern: /woman/i, priority: 10 },
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

                if (!bestVoice && isIOS) {
                    const englishVoices = voices.filter(voice =>
                        voice.lang.startsWith('en-') &&
                        !/(male|man|alex|daniel|fred|ralph|tom)/i.test(voice.name)
                    );

                    if (englishVoices.length > 0) {
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

            if (isIOS) {
                console.log('iOS detected: initializing with dummy speak');
                initializeWithDummySpeak();
            } else {
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
        if (settings.numQuestions < 1) {
            alert('Number of questions must be at least 1!');
            return;
        }

        // Validate divisor is <= dividend
        if (settings.divisorDigits > settings.dividendDigits) {
            alert('Divisor digits must be less than or equal to dividend digits!');
            return;
        }

        // IMMEDIATE UI FEEDBACK
        playSound('gameStart');
        const questions: Question[] = [];

        // Generate questions for division game        
        for (let i = 0; i < settings.numQuestions; i++) {
            questions.push(generateQuestion());
        }

        setAllQuestions(questions);
        setCurrentQuestion(0);
        setNextQuestionNumber(1);
        setShowingQuestion(true);
        setCalculatingAnswer(false);
        setShowingAnswer(false);
        setShowingGetReady(true);
        setIsPaused(false);
        setGameState('playing');

        const startTime = Date.now();
        setGameStartTime(startTime);
        setTimeout(() => {
            trackGameEvent('mental-division', 'start', {
                divisorDigits: settings.divisorDigits,
                dividendDigits: settings.dividendDigits,
                numQuestions: settings.numQuestions,
                level: settings.level,
                speechEnabled: settings.speechEnabled,
                soundEnabled: settings.soundEnabled
            });
        }, 0);

        // Background speech initialization for iOS
        if (settings.speechEnabled && isIOS) {
            console.log('iOS detected: initializing speech in background');
            initializeSpeechSync().then((voiceInitialized) => {
                console.log('Background voice initialization result:', voiceInitialized);
            }).catch((error) => {
                console.log('Background speech initialization failed:', error);
            });
        } else if (settings.speechEnabled) {
            try {
                await initializeSpeechSync();
            } catch (error) {
                console.log('Speech initialization failed:', error);
            }
        }

        // Show "Get Ready" immediately, then proceed with game
        setTimeout(() => {
            setTimeout(() => {
                setShowingGetReady(false);
                if (questions.length > 0) {
                    const firstQuestion = questions[0];
                    setDisplayText(`${firstQuestion.dividend} ÷ ${firstQuestion.divisor}`);

                    if (settings.speechEnabled) {
                        const firstNumberDelay = isIOS ? 800 : 0;

                        if (firstNumberDelay > 0) {
                            setDisplayText('');
                        } else {
                            setDisplayText(`${firstQuestion.dividend} ÷ ${firstQuestion.divisor}`);
                        }

                        setTimeout(() => {
                            setDisplayText(`${firstQuestion.dividend} ÷ ${firstQuestion.divisor}`);
                            speak(`${firstQuestion.dividend} divided by ${firstQuestion.divisor}`);
                        }, firstNumberDelay);
                    } else {
                        setDisplayText(`${firstQuestion.dividend} ÷ ${firstQuestion.divisor}`);
                    }
                }
            }, 800);
        }, 1000);
    };

    const pauseGame = (): void => {
        setTimeout(() => {
            trackGameEvent('mental-division', 'pause', {
                currentQuestion: currentQuestion + 1,
                totalQuestions: settings.numQuestions
            });
        }, 0);

        speechSynthesis.cancel();

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
        } catch {
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
        setTimeout(() => {
            trackGameEvent('mental-division', 'resume', {
                currentQuestion: currentQuestion + 1,
                totalQuestions: settings.numQuestions
            });
        }, 0);

        playSound('resume');
        setIsPaused(false);
        setGameState('playing');
    };

    const restartGame = (): void => {
        setTimeout(() => {
            trackGameEvent('mental-division', 'restart', {
                currentQuestion: currentQuestion + 1,
                totalQuestions: settings.numQuestions,
                level: settings.level
            });
        }, 0);

        speechSynthesis.cancel();

        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
        }

        for (let i = 1; i < 99999; i++) {
            clearTimeout(i);
        }

        try {
            if (Tone.getContext().state === 'running') {
                Tone.getTransport().stop();
                Tone.getTransport().cancel();
            }
        } catch (error) {
            // Ignore Tone.js errors
        }

        setGameState('setup');
        setIsPaused(false);

        // Reset all game state variables
        setCurrentQuestion(0);
        setNextQuestionNumber(1);
        setShowingQuestion(true);
        setShowingAnswer(false);
        setCalculatingAnswer(false);
        setShowingGetReady(false);
        setAllQuestions([]);
        setDisplayText('');
    };

    const completeGame = (): void => {
        const duration = gameStartTime ? Date.now() - gameStartTime : 0;

        setTimeout(() => {
            trackGameEvent('mental-division', 'complete', {
                numQuestions: settings.numQuestions,
                duration: Math.round(duration / 1000),
                level: settings.level
            });
        }, 0);
    };

    // Enhanced game logic effect for division
    useEffect(() => {
        if (gameState !== 'playing' || isPaused || showingGetReady) return;

        const currentQ = allQuestions[currentQuestion];
        if (!currentQ) return;

        if (showingAnswer) {
            const answerText = `The answer is ${currentQ.answer}`;

            if (settings.speechEnabled) {
                speak(answerText).then(() => {
                    const postAnswerDelay = calculatePostAnswerDelay(answerText);

                    setTimeout(() => {
                        playSound('questionComplete');
                        if (currentQuestion < allQuestions.length - 1) {
                            setNextQuestionNumber(currentQuestion + 2);
                            setShowingGetReady(true);
                            setShowingAnswer(false);
                            setCalculatingAnswer(false);
                            setShowingQuestion(true);

                            setTimeout(() => {
                                playSound('getReady');

                                setTimeout(() => {
                                    const nextQuestionNum = currentQuestion + 1;
                                    setCurrentQuestion(nextQuestionNum);
                                    setShowingGetReady(false);
                                    const nextQ = allQuestions[nextQuestionNum];
                                    setDisplayText(`${nextQ.dividend} ÷ ${nextQ.divisor}`);

                                    if (settings.speechEnabled) {
                                        speak(`${nextQ.dividend} divided by ${nextQ.divisor}`);
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
                const postAnswerDelay = calculatePostAnswerDelay(answerText);
                const timer = setTimeout(() => {
                    playSound('questionComplete');
                    if (currentQuestion < allQuestions.length - 1) {
                        setNextQuestionNumber(currentQuestion + 2);
                        setShowingGetReady(true);
                        setShowingAnswer(false);
                        setCalculatingAnswer(false);
                        setShowingQuestion(true);

                        setTimeout(() => {
                            playSound('getReady');

                            setTimeout(() => {
                                const nextQuestionNum = currentQuestion + 1;
                                setCurrentQuestion(nextQuestionNum);
                                setShowingGetReady(false);
                                const nextQ = allQuestions[nextQuestionNum];
                                setDisplayText(`${nextQ.dividend} ÷ ${nextQ.divisor}`);
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
                const levelDelay = Math.max(1200, 3000 - settings.level * 600);
                const timer = setTimeout(() => {
                    setDisplayText(currentQ.answer.toString());
                    setCalculatingAnswer(false);
                    setShowingAnswer(true);
                }, levelDelay);

                return () => clearTimeout(timer);
            } else {
                const delays = getDelays(settings.level);
                const timer = setTimeout(() => {
                    playSound('answerReveal');
                    setDisplayText(currentQ.answer.toString());
                    setCalculatingAnswer(false);
                    setShowingAnswer(true);
                }, delays.answerDelay * 1000);

                return () => clearTimeout(timer);
            }
        } else if (showingQuestion) {
            if (settings.speechEnabled) {
                const speechText = `${currentQ.dividend} divided by ${currentQ.divisor}`;
                const speechDelay = calculateSpeechDelay(speechText, settings.level);

                const timer = setTimeout(() => {
                    setDisplayText('Calculating...');
                    setCalculatingAnswer(true);
                    setShowingQuestion(false);
                }, speechDelay);

                return () => clearTimeout(timer);
            } else {
                const delays = getDelays(settings.level);
                const timer = setTimeout(() => {
                    setDisplayText('Calculating...');
                    setCalculatingAnswer(true);
                    setShowingQuestion(false);
                }, delays.numberDelay * 1000);

                return () => clearTimeout(timer);
            }
        }
    }, [gameState, currentQuestion, showingAnswer, calculatingAnswer, showingGetReady, showingQuestion, settings, allQuestions, isPaused, displayText]);

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
                                    trackButtonClick('back-to-home', 'mental-division-setup');
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
                            <Divide className={`w-16 h-16 mx-auto ${currentTheme.secondary} mb-4`} />
                            <h1 className={`text-4xl font-bold ${currentTheme.primary} mb-2`}>Mental Division Game</h1>
                            <p className={`text-xl ${currentTheme.secondary}`}>Master division with mental math!</p>
                        </div>

                        <div className="space-y-6">
                            {/* Audio & Speech Settings */}
                            <div className="bg-purple-50 rounded-2xl p-4 sm:p-6">
                                <label className="block text-2xl font-bold text-purple-800 mb-4">Audio Settings:</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 gap-4">
                                    <label className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all transform hover:scale-105 border-2 ${settings.soundEnabled
                                        ? 'bg-purple-100 border-purple-300 text-purple-800 shadow-lg'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <span className="text-xl sm:text-2xl">🔊</span>
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
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <span className="text-xl sm:text-2xl">🗣️</span>
                                            <span className="text-base sm:text-lg font-bold">Voice</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.speechEnabled}
                                            onChange={(e) => {
                                                playSound('settingChange');
                                                updateSettings(prev => ({
                                                    ...prev,
                                                    speechEnabled: e.target.checked,
                                                    level: e.target.checked && prev.level > 3 ? 1 : prev.level
                                                }));
                                            }}
                                            className="w-6 h-6 text-purple-600 rounded"
                                        />
                                    </label>
                                </div>

                                {settings.speechEnabled && (
                                    <div className="mt-3 sm:mt-4 space-y-3">
                                        <div className="p-3 sm:p-4 bg-amber-100 rounded-lg border-l-4 border-amber-400">
                                            <p className="text-sm text-amber-800 font-medium">
                                                🎭 Voice will use available device voices (may be female or male depending on your device)
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-100 rounded-lg border-l-4 border-gray-400">
                                    <div className="flex items-start gap-2 sm:gap-3">
                                        <span className="text-base sm:text-lg">🔧</span>
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-700 font-medium mb-1">
                                                Troubleshooting: Sound/Voice Not Working?
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Please refresh the page and try again. Make sure your device volume is up and browser permissions allow audio.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Theme Selector */}
                            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                                <label className="block text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Theme:</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
                                    {Object.entries(themes).map(([key, theme]) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                playSound('settingChange');
                                                updateSettings(prev => ({ ...prev, theme: key as GameSettings['theme'] }));
                                            }}
                                            className={`p-2 sm:p-3 rounded-xl font-bold text-center transition-all transform hover:scale-105 border-2 ${settings.theme === key
                                                ? `bg-gradient-to-r ${theme.setupBg} text-white shadow-lg border-white`
                                                : 'bg-white text-gray-700 border-gray-200 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="text-xs sm:text-sm">{theme.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Number Digits Settings */}
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-green-200 shadow-lg">
                                <label className="block text-lg sm:text-xl font-bold text-green-800 mb-3 sm:mb-4 flex items-center gap-2">                                    
                                    Division Digits:
                                </label>

                                <div className="flex items-center justify-center gap-2 sm:gap-4">
                                    {/* Dividend Selection */}
                                    <div className="flex flex-col items-center gap-3 flex-1">
                                        <div className="grid grid-cols-2 gap-1 sm:gap-2 w-full max-w-[140px]">
                                            {[1, 2, 3, 4].map(digits => (
                                                <button
                                                    key={digits}
                                                    onClick={() => {
                                                        playSound('settingChange');
                                                        updateSettings(prev => ({
                                                            ...prev,
                                                            dividendDigits: digits as GameSettings['dividendDigits'],
                                                            divisorDigits: digits < prev.divisorDigits ? digits as GameSettings['divisorDigits'] : prev.divisorDigits
                                                        }));
                                                    }}
                                                    className={`h-[35px] sm:h-[40px] rounded-xl text-lg sm:text-xl font-bold transition-all transform hover:scale-105 ${settings.dividendDigits === digits
                                                            ? 'bg-green-500 text-white shadow-lg ring-2 ring-green-300'
                                                            : 'bg-white text-green-600 border-2 border-green-200 hover:bg-green-50 hover:border-green-300'
                                                        }`}
                                                >
                                                    {digits}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="bg-white px-3 py-1 rounded-full border-2 border-green-200 shadow-sm h-[28px] flex items-center justify-center w-[60px] mt-2">
                                            <span className="text-xs sm:text-sm text-green-700 font-bold">
                                                {settings.dividendDigits === 1 ? 'digit' : 'digits'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Divide Icon */}
                                    <div className="flex items-center justify-center px-2 sm:px-4">
                                        <div className="bg-white p-2 sm:p-3 rounded-full shadow-lg border-2 border-green-300">
                                            <Divide className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-green-600" />
                                        </div>
                                    </div>

                                    {/* Divisor Selection */}
                                    <div className="flex flex-col items-center gap-3 flex-1">
                                        <div className="grid grid-cols-2 gap-1 sm:gap-2 w-full max-w-[140px]">
                                            {[1, 2, 3, 4].map(digits => (
                                                <button
                                                    key={digits}
                                                    onClick={() => {
                                                        playSound('settingChange');
                                                        updateSettings(prev => ({
                                                            ...prev,
                                                            divisorDigits: digits as GameSettings['divisorDigits'],
                                                            dividendDigits: digits > prev.dividendDigits ? digits as GameSettings['dividendDigits'] : prev.dividendDigits
                                                        }));
                                                    }}
                                                    style={{
                                                        visibility: digits <= settings.dividendDigits ? 'visible' : 'hidden'
                                                    }}
                                                    className={`h-[35px] sm:h-[40px] rounded-xl text-lg sm:text-xl font-bold transition-all transform hover:scale-105 ${settings.divisorDigits === digits
                                                            ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300'
                                                            : 'bg-white text-blue-600 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                                                        }`}
                                                >
                                                    {digits}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="bg-white px-3 py-1 rounded-full border-2 border-blue-200 shadow-sm h-[28px] flex items-center justify-center w-[60px] mt-2">
                                            <span className="text-xs sm:text-sm text-blue-700 font-bold">
                                                {settings.divisorDigits === 1 ? 'digit' : 'digits'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Number of Questions */}
                            <div className="bg-orange-50 rounded-2xl p-4 sm:p-6">
                                <label className="block text-lg sm:text-xl font-bold text-orange-800 mb-3 sm:mb-4">Number of Questions:</label>
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
                                                //playSound('settingChange');
                                                updateSettings(prev => ({ ...prev, numQuestions: Math.min(50, Math.max(0, num)) }));
                                            }
                                        }
                                    }}
                                    onBlur={() => {
                                        if (settings.numQuestions === 0) {
                                            updateSettings(prev => ({ ...prev, numQuestions: 1 }));
                                        }
                                    }}
                                    className="w-full p-2 sm:p-4 text-xl sm:text-2xl font-bold text-center rounded-xl border-4 border-orange-200 focus:border-orange-400 focus:outline-none"
                                    placeholder="1-50"
                                />
                            </div>

                            {/* Difficulty Level */}
                            <div className="bg-indigo-50 rounded-2xl p-4 sm:p-6">
                                <label className="block text-lg sm:text-xl font-bold text-indigo-800 mb-3 sm:mb-4">Difficulty Level:</label>
                                <div className={`grid gap-2 sm:gap-3 ${settings.speechEnabled ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
                                    {settings.speechEnabled ? (
                                        // Voice mode - only show 3 levels
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
                                                    className={`p-2 sm:p-3 md:p-4 rounded-xl font-bold text-center transition-all border-2 min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center ${settings.level === level
                                                        ? `${selectedColor[level - 1]} transform hover:scale-105`
                                                        : `${levelColors[level - 1]} hover:shadow-md transform hover:scale-105`
                                                        }`}
                                                >
                                                    <div className="text-lg sm:text-xl md:text-2xl mb-1 leading-none">{level}</div>
                                                    <div className="text-xs sm:text-sm leading-tight">{voiceLevelNames[level - 1]}</div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        // Regular mode - show all 5 levels
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
                                                    className={`p-2 sm:p-3 md:p-4 rounded-xl font-bold text-center transition-all border-2 min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center ${settings.level === level
                                                        ? `${selectedColor[level - 1]} transform hover:scale-105`
                                                        : `${levelColors[level - 1]} hover:shadow-md transform hover:scale-105`
                                                        }`}
                                                >
                                                    <div className="text-lg sm:text-xl md:text-2xl mb-1 leading-none">{level}</div>
                                                    <div className="text-xs sm:text-sm leading-tight">{levelNames[level - 1]}</div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                                {settings.speechEnabled && (
                                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                                        <p className="text-xs sm:text-sm text-blue-700">
                                            ℹ️ Voice mode uses intelligent timing and limits difficulty to levels 1-3 for optimal experience
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    trackButtonClick('start-game', 'mental-division-setup');
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
                                    {showingAnswer ? 'Answer:' : calculatingAnswer ? 'Calculating...' : ''}
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className={`flex items-center justify-center gap-6 transition-opacity duration-200 opacity-100 px-2 sm:px-4`}>
                                    <div className={`font-bold ${currentTheme.primary} text-center w-full`}>
                                        {calculatingAnswer ? (
                                            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Calculating...</span>
                                        ) : showingAnswer ? (
                                            // Answer display - original size
                                            <div className="text-8xl font-bold leading-tight">
                                                {displayText}
                                            </div>
                                        ) : (
                                            // Question display - larger on mobile
                                            <div className="text-4xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight break-words">
                                                {displayText}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full bg-purple-200 rounded-full h-4 mb-6">
                                <div
                                    className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${((currentQuestion + (showingAnswer ? 1 : 0)) / settings.numQuestions) * 100}%`
                                    }}
                                ></div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => {
                                        trackButtonClick('pause', 'mental-division-playing');
                                        playSound('buttonClick');
                                        pauseGame();
                                    }}
                                    className="bg-yellow-500 text-white text-xl font-bold py-3 px-6 rounded-xl hover:bg-yellow-600 transition-all shadow-lg"
                                >
                                    ⏸️ Pause
                                </button>
                                <button
                                    onClick={() => {
                                        trackButtonClick('restart', 'mental-division-playing');
                                        playSound('buttonClick');
                                        restartGame();
                                    }}
                                    className="bg-red-500 text-white text-lg sm:text-xl font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg"
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
                                trackButtonClick('resume', 'mental-division-paused');
                                playSound('buttonClick');
                                resumeGame();
                            }}
                            className="bg-green-500 text-white text-2xl font-bold py-4 px-8 rounded-xl hover:bg-green-600 transition-all shadow-lg"
                        >
                            ▶️ Resume
                        </button>
                        <button
                            onClick={() => {
                                trackButtonClick('restart-from-pause', 'mental-division-paused');
                                playSound('buttonClick');
                                restartGame();
                            }}
                            className="bg-red-500 text-white text-xl font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg"
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
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-800 mb-3 sm:mb-4 leading-tight">
                                <span className="text-2xl sm:text-3xl md:text-4xl">🎉</span>
                                <span className="mx-2 sm:mx-3">Excellent Work!</span>
                                <span className="text-2xl sm:text-3xl md:text-4xl">🎉</span>
                            </h1>
                            <p className="text-lg sm:text-xl md:text-2xl text-green-600 px-2">Here are all your division problems and answers:</p>
                        </div>

                        <div className="space-y-6 mb-8 max-h-96 overflow-y-auto">
                            {allQuestions.map((question, index) => (
                                <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6">
                                    <div className="text-base sm:text-lg font-bold text-purple-800 mb-2">
                                        Question {index + 1}:
                                    </div>
                                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
                                        <span className="text-xl sm:text-2xl font-bold text-purple-700">{question.dividend}</span>
                                        <Divide className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                        <span className="text-xl sm:text-2xl font-bold text-purple-700">{question.divisor}</span>
                                        <span className="text-xl sm:text-2xl font-bold text-purple-700">=</span>
                                        <span className="text-xl sm:text-2xl font-bold text-green-700">{question.answer}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                trackButtonClick('new-game', 'mental-division-results');
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

export default MentalDivisionGame;