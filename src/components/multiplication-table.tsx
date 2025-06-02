import React, { useState, useEffect, useRef } from 'react';
import { Grid, CheckCircle, Star, Trophy, Target, ArrowLeft, RotateCcw, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { trackGameEvent, trackSettingsChange, trackButtonClick } from '../utils/analytics';
import * as Tone from 'tone';

// Type definitions
interface TableSettings {
  theme: 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';
  soundEnabled: boolean;
  showAnswers: boolean;
  gamificationEnabled: boolean;
}

interface Theme {
  name: string;
  bg: string;
  cardBg: string;
  primary: string;
  secondary: string;
  accent: string;
  headerBg: string;
}

interface MemorizedFacts {
  [key: string]: boolean; // key format: "2x3" or "3x2"
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

type SoundType = 'check' | 'uncheck' | 'achievement' | 'complete' | 'buttonClick' | 'settingChange';

interface MultiplicationTableProps {
  onBackToHome?: () => void;
}

const MultiplicationTable: React.FC<MultiplicationTableProps> = ({ onBackToHome }) => {
  //const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // In-memory settings store
  const settingsRef = useRef<TableSettings>({
    theme: 'default',
    soundEnabled: true,
    showAnswers: true,
    gamificationEnabled: true
  });

  // Load settings from memory on component mount
  const [settings, setSettingsState] = useState<TableSettings>(() => {
    try {
      const stored = localStorage.getItem('multiplication-table-settings');
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

  // Load memorized facts from memory
  const [memorizedFacts, setMemorizedFactsState] = useState<MemorizedFacts>(() => {
    try {
      const stored = localStorage.getItem('multiplication-table-memorized');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.log('Could not load memorized facts from storage:', error);
    }
    return {};
  });

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  // State for collapsible achievements
  const [achievementsCollapsed, setAchievementsCollapsed] = useState(true);
  // State for collapsible instructions
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false);

  // Update settings function with memory persistence and analytics
  const updateSettings = (newSettings: TableSettings | ((prev: TableSettings) => TableSettings)): void => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    
    // Track which setting changed (async, non-blocking)
    setTimeout(() => {
      const changedSetting = Object.keys(updatedSettings).find(key => 
        JSON.stringify(updatedSettings[key as keyof TableSettings]) !== 
        JSON.stringify(settings[key as keyof TableSettings])
      );
      
      if (changedSetting) {
        trackSettingsChange(
          changedSetting, 
          updatedSettings[changedSetting as keyof TableSettings], 
          'multiplication-table'
        );
      }
    }, 0);

    settingsRef.current = updatedSettings;
    setSettingsState(updatedSettings);
    
    try {
      localStorage.setItem('multiplication-table-settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.log('Could not save settings to storage:', error);
    }
  };

  // Update memorized facts function with memory persistence
  const updateMemorizedFacts = (newFacts: MemorizedFacts | ((prev: MemorizedFacts) => MemorizedFacts)): void => {
    const updatedFacts = typeof newFacts === 'function' ? newFacts(memorizedFacts) : newFacts;
    setMemorizedFactsState(updatedFacts);
    
    try {
      localStorage.setItem('multiplication-table-memorized', JSON.stringify(updatedFacts));
    } catch (error) {
      console.log('Could not save memorized facts to storage:', error);
    }
  };

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

  // Sound functions
  const playSound = async (type: SoundType): Promise<void> => {
    if (!settings.soundEnabled) return;
    
    try {
      // Always ensure audio context is running before playing sound
      if (Tone.getContext().state !== 'running') {
        console.log('Audio context not running, starting...');
        await Tone.start();
      }
  
      // Create a new synth instance each time for better reliability on iOS
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
        case 'check':
          synth.triggerAttackRelease('C5', '0.2');
          setTimeout(() => synth.triggerAttackRelease('E5', '0.2'), 100);
          break;
        case 'uncheck':
          synth.triggerAttackRelease('A4', '0.2');
          break;
        case 'achievement':
          synth.triggerAttackRelease('C5', '0.2');
          setTimeout(() => synth.triggerAttackRelease('E5', '0.2'), 100);
          setTimeout(() => synth.triggerAttackRelease('G5', '0.2'), 200);
          setTimeout(() => synth.triggerAttackRelease('C6', '0.4'), 300);
          break;
        case 'complete':
          synth.triggerAttackRelease('C4', '0.2');
          setTimeout(() => synth.triggerAttackRelease('E4', '0.2'), 100);
          setTimeout(() => synth.triggerAttackRelease('G4', '0.2'), 200);
          setTimeout(() => synth.triggerAttackRelease('C5', '0.2'), 300);
          setTimeout(() => synth.triggerAttackRelease('E5', '0.4'), 400);
          break;
        case 'buttonClick':
          synth.triggerAttackRelease('C4', '0.1');
          break;
        case 'settingChange':
          synth.triggerAttackRelease('A4', '0.15');
          break;
      }
      
      // Dispose of the synth after a delay to free up resources
      setTimeout(() => {
        synth.dispose();
      }, 1000);
  
    } catch (error) {
      console.log('Audio not available:', error);
    }
  };

  // Theme configurations
  const themes: Record<string, Theme> = {
    default: {
      name: 'Rainbow',
      bg: 'from-purple-400 via-pink-400 to-yellow-400',
      cardBg: 'bg-white',
      primary: 'text-purple-800',
      secondary: 'text-purple-600',
      accent: 'text-pink-600',
      headerBg: 'bg-purple-100'
    },
    ocean: {
      name: 'Ocean',
      bg: 'from-blue-400 via-cyan-400 to-teal-400',
      cardBg: 'bg-blue-50',
      primary: 'text-blue-800',
      secondary: 'text-blue-600',
      accent: 'text-cyan-600',
      headerBg: 'bg-blue-100'
    },
    forest: {
      name: 'Forest',
      bg: 'from-green-400 via-emerald-400 to-lime-400',
      cardBg: 'bg-green-50',
      primary: 'text-green-800',
      secondary: 'text-green-600',
      accent: 'text-emerald-600',
      headerBg: 'bg-green-100'
    },
    sunset: {
      name: 'Sunset',
      bg: 'from-orange-400 via-red-400 to-pink-400',
      cardBg: 'bg-orange-50',
      primary: 'text-orange-800',
      secondary: 'text-orange-600',
      accent: 'text-red-600',
      headerBg: 'bg-orange-100'
    },
    lavender: {
      name: 'Lavender',
      bg: 'from-purple-400 via-violet-400 to-indigo-400',
      cardBg: 'bg-purple-50',
      primary: 'text-purple-800',
      secondary: 'text-purple-600',
      accent: 'text-violet-600',
      headerBg: 'bg-purple-100'
    }
  };

  const currentTheme: Theme = themes[settings.theme] || themes.default;

  // Generate achievements
  const generateAchievements = (): Achievement[] => {
    return generateAchievementsWithFacts(memorizedFacts);
  };

  // Generate achievements
  const generateAchievementsWithFacts = (facts: MemorizedFacts): Achievement[] => {
    // Count unique facts (avoid double counting due to commutativity)
    const uniqueMemorizedFacts = new Set<string>();
    Object.keys(facts).forEach(key => {
      if (facts[key]) {
        const [a, b] = key.split('x').map(Number);
        const normalizedKey = a <= b ? `${a}x${b}` : `${b}x${a}`;
        uniqueMemorizedFacts.add(normalizedKey);
      }
    });
    
    const memorizedCount = uniqueMemorizedFacts.size;
    
    return [
      {
        id: 'first_step',
        title: 'First Step',
        description: 'Memorize your first multiplication fact',
        icon: '🌟',
        unlocked: memorizedCount >= 1,
        progress: Math.min(memorizedCount, 1),
        maxProgress: 1
      },
      {
        id: 'getting_started',
        title: 'Getting Started',
        description: 'Memorize 10 multiplication facts',
        icon: '🚀',
        unlocked: memorizedCount >= 10,
        progress: Math.min(memorizedCount, 10),
        maxProgress: 10
      },
      {
        id: 'quarter_master',
        title: 'Quarter Master',
        description: 'Memorize 25% of the multiplication table',
        icon: '🎯',
        unlocked: memorizedCount >= 25,
        progress: Math.min(memorizedCount, 25),
        maxProgress: 25
      },
      {
        id: 'halfway_hero',
        title: 'Halfway Hero',
        description: 'Memorize 50% of the multiplication table',
        icon: '⭐',
        unlocked: memorizedCount >= 50,
        progress: Math.min(memorizedCount, 50),
        maxProgress: 50
      },
      {
        id: 'almost_there',
        title: 'Almost There',
        description: 'Memorize 75% of the multiplication table',
        icon: '🏆',
        unlocked: memorizedCount >= 75,
        progress: Math.min(memorizedCount, 75),
        maxProgress: 75
      },
      {
        id: 'master',
        title: 'Multiplication Master',
        description: 'Memorize the complete multiplication table!',
        icon: '👑',
        unlocked: memorizedCount >= 100,
        progress: Math.min(memorizedCount, 100),
        maxProgress: 100
      }
    ];
  };

  // Toggle memorization status
  const toggleMemorized = (num1: number, num2: number): void => {
    const key1 = `${num1}x${num2}`;
    const key2 = `${num2}x${num1}`;
    
    updateMemorizedFacts(prev => {
      const newFacts = { ...prev };
      const isCurrentlyMemorized = newFacts[key1] || false;
      
      if (isCurrentlyMemorized) {
        // Uncheck both directions
        delete newFacts[key1];
        delete newFacts[key2];
        playSound('uncheck');
        
        // Track fact unmemorized (async, non-blocking)
        setTimeout(() => {
          trackGameEvent('multiplication-table', 'fact_unmemorized', {
            fact: `${num1}x${num2}`,
            totalMemorized: Object.values(newFacts).filter(Boolean).length
          });
        }, 0);
      } else {
        // Check both directions (since multiplication is commutative)
        newFacts[key1] = true;
        newFacts[key2] = true;
        playSound('check');
        
        // Track fact memorized (async, non-blocking)
        setTimeout(() => {
          trackGameEvent('multiplication-table', 'fact_memorized', {
            fact: `${num1}x${num2}`,
            totalMemorized: Object.values(newFacts).filter(Boolean).length
          });
        }, 0);
      }
      
      return newFacts;
    });
  
    // Check for achievements after state update - only when adding facts
    setTimeout(() => {
      const key = `${num1}x${num2}`;
      const willBeMemorized = !memorizedFacts[key];
      if (willBeMemorized) {
        // Pass the updated facts to checkAchievements
        const updatedFacts = { ...memorizedFacts };
        updatedFacts[key] = true;
        updatedFacts[`${num2}x${num1}`] = true;
        checkAchievementsWithFacts(updatedFacts);
      }
    }, 100);
  };

  // Check for new achievements
  const checkAchievementsWithFacts = (updatedFacts: MemorizedFacts): void => {
    if (!settings.gamificationEnabled) return;
    
    const newAchievements = generateAchievementsWithFacts(updatedFacts);
    const previousAchievements = achievements;
    
    // Find newly unlocked achievements
    for (const achievement of newAchievements) {
      const wasUnlocked = previousAchievements.find(a => a.id === achievement.id)?.unlocked || false;
      const previousProgress = previousAchievements.find(a => a.id === achievement.id)?.progress || 0;
      
      // Only trigger achievement if it's newly unlocked AND progress increased
      if (achievement.unlocked && !wasUnlocked && achievement.progress > previousProgress) {
        setShowAchievement(achievement);
        playSound('achievement');
        
        // Track achievement unlock (async, non-blocking)
        setTimeout(() => {
          trackGameEvent('multiplication-table', 'achievement_unlocked', {
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            memorizedCount: achievement.progress
          });
        }, 0);
        
        setTimeout(() => setShowAchievement(null), 3000);
        break; // Show one achievement at a time
      }
    }
    
    setAchievements(newAchievements);
  };

  // Check if a fact is memorized
  const isMemorized = (num1: number, num2: number): boolean => {
    const key = `${num1}x${num2}`;
    return memorizedFacts[key] || false;
  };

  // Clear all memorized facts
  const clearAllMemorized = (): void => {
    // Track reset progress (async, non-blocking)
    setTimeout(() => {
      trackGameEvent('multiplication-table', 'reset_progress', {
        previousMemorizedCount: Object.values(memorizedFacts).filter(Boolean).length
      });
    }, 0);
    
    updateMemorizedFacts({});
    setAchievements(generateAchievements());
    playSound('buttonClick');
  };

  // Calculate progress
  const getProgress = () => {
    // Count unique facts (avoid double counting due to commutativity)
    const uniqueMemorizedFacts = new Set<string>();
    Object.keys(memorizedFacts).forEach(key => {
      if (memorizedFacts[key]) {
        const [a, b] = key.split('x').map(Number);
        const normalizedKey = a <= b ? `${a}x${b}` : `${b}x${a}`;
        uniqueMemorizedFacts.add(normalizedKey);
      }
    });
    
    const memorizedCount = uniqueMemorizedFacts.size;
    
    return {
      memorized: memorizedCount,
      total: 100,
      percentage: Math.round((memorizedCount / 100) * 100)
    };
  };

  // Initialize achievements on component mount and track view
  useEffect(() => {
    setAchievements(generateAchievements());
    
    // Track table view (async, non-blocking)
    setTimeout(() => {
      trackGameEvent('multiplication-table', 'view', {
        memorizedCount: Object.values(memorizedFacts).filter(Boolean).length
      });
    }, 0);
  }, []);

  // Update achievements when memorized facts change
  useEffect(() => {
    setAchievements(generateAchievements());
  }, [memorizedFacts]);

  // Get cell background color based on memorization status
  const getCellColor = (num1: number, num2: number): string => {
    if (isMemorized(num1, num2)) {
      return 'bg-green-200 border-green-400 text-green-800';
    }
    
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };

  const progress = getProgress();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} p-4`}>
      <div className="max-w-7xl mx-auto">
        <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-6`}>
          {/* Header */}
          <div className="space-y-4 mb-6">
            {/* Back Button and Title */}
            <div className="space-y-3">
              {onBackToHome && (
                <button
                  onClick={() => {
                    trackButtonClick('back-to-home', 'multiplication-table');
                    playSound('buttonClick');
                    onBackToHome();
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Games</span>
                </button>
              )}
              <div className="flex items-center gap-3">
                <Grid className={`w-6 h-6 sm:w-8 sm:h-8 ${currentTheme.secondary}`} />
                <div>
                  <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${currentTheme.primary}`}>Multiplication Table</h1>
                  <p className={`text-sm sm:text-base lg:text-lg ${currentTheme.secondary}`}>1 × 1 to 10 × 10</p>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="space-y-3">
              {/* Theme Selector - Full Width on Mobile */}
              <div className="w-full">
                <select
                  value={settings.theme}
                  onChange={(e) => {
                    playSound('settingChange');
                    updateSettings(prev => ({...prev, theme: e.target.value as TableSettings['theme']}));
                  }}
                  className="w-full sm:w-auto px-3 py-2 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                >
                  {Object.entries(themes).map(([key, theme]) => (
                    <option key={key} value={key}>{theme.name} Theme</option>
                  ))}
                </select>
              </div>

              {/* Toggle Buttons - Grid Layout for Mobile */}
              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    playSound('settingChange');
                    updateSettings(prev => ({...prev, soundEnabled: !prev.soundEnabled}));
                  }}
                  className={`px-3 py-2 text-sm sm:text-base rounded-xl font-medium transition-all ${
                    settings.soundEnabled 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <span className="block sm:hidden">{settings.soundEnabled ? '🔊 Sound' : '🔇 Sound'}</span>
                  <span className="hidden sm:inline">{settings.soundEnabled ? '🔊' : '🔇'} Sound</span>
                </button>

                <button
                  onClick={() => {
                    playSound('settingChange');
                    updateSettings(prev => ({...prev, showAnswers: !prev.showAnswers}));
                  }}
                  className={`px-3 py-2 text-sm sm:text-base rounded-xl font-medium transition-all ${
                    settings.showAnswers 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <span className="block sm:hidden">{settings.showAnswers ? '👁️ Answers' : '🙈 Answers'}</span>
                  <span className="hidden sm:inline">{settings.showAnswers ? '👁️' : '🙈'} Answers</span>
                </button>

                <button
                  onClick={() => {
                    playSound('settingChange');
                    updateSettings(prev => ({...prev, gamificationEnabled: !prev.gamificationEnabled}));
                  }}
                  className={`px-3 py-2 text-sm sm:text-base rounded-xl font-medium transition-all ${
                    settings.gamificationEnabled 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <span className="block sm:hidden">{settings.gamificationEnabled ? '🏆 Goals' : '📚 Goals'}</span>
                  <span className="hidden sm:inline">{settings.gamificationEnabled ? '🏆' : '📚'} Goals</span>
                </button>

                <button
                  onClick={() => {
                    trackButtonClick('reset-all', 'multiplication-table');
                    clearAllMemorized();
                  }}
                  className="px-3 py-2 text-sm sm:text-base rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-1 sm:gap-2"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="block sm:hidden">Reset</span>
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => {
                trackButtonClick('toggle-instructions', 'multiplication-table');
                playSound('buttonClick');
                setInstructionsCollapsed(!instructionsCollapsed);
              }}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                instructionsCollapsed 
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                  : 'bg-blue-50 border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-lg sm:text-xl font-bold text-blue-800">
                    How to Use
                  </span>
                </div>
                {instructionsCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>
            
            {!instructionsCollapsed && (
              <div className="mt-3 p-3 sm:p-4 bg-blue-50 rounded-xl">
                <ul className="text-blue-700 space-y-1 text-xs sm:text-sm">
                  <li>• Tap any cell to mark it as memorized</li>
                  <li>• Green cells show facts you've memorized</li>
                  <li>• Track progress and unlock achievements! 🏆</li>
                  <li>• Practice one times table at a time</li>
                  <li>• Use the toggle buttons to customize your experience</li>
                </ul>
              </div>
            )}
          </div>

          {/* Progress Bar and Stats */}
          <div className={`${currentTheme.headerBg} rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Target className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTheme.primary} flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm sm:text-base font-bold ${currentTheme.primary} truncate`}>
                      Progress: {progress.memorized}/{progress.total}
                    </div>
                    <div className={`text-xs sm:text-sm ${currentTheme.secondary}`}>
                      {progress.percentage}% Complete
                    </div>
                  </div>
                </div>
                {progress.percentage === 100 && (
                  <div className="flex items-center gap-1 text-yellow-600 animate-pulse flex-shrink-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-bold">MASTER!</span>
                  </div>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 sm:h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Achievements Panel */}
          {settings.gamificationEnabled && (
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => {
                  trackButtonClick('toggle-achievements', 'multiplication-table');
                  playSound('buttonClick');
                  setAchievementsCollapsed(!achievementsCollapsed);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                  achievementsCollapsed 
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                    : `${currentTheme.headerBg} border-gray-300`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                    <span className={`text-lg sm:text-xl font-bold ${currentTheme.primary}`}>
                      Achievements
                    </span>
                    <div className="text-xs sm:text-sm px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full font-bold">
                      {achievements.filter(a => a.unlocked).length}/{achievements.length}
                    </div>
                  </div>
                  {achievementsCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {!achievementsCollapsed && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                  {achievements.map(achievement => (
                    <div 
                      key={achievement.id}
                      className={`p-2 sm:p-3 rounded-xl border-2 transition-all ${
                        achievement.unlocked 
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-800' 
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base sm:text-lg">{achievement.icon}</span>
                        <span className="font-bold text-xs sm:text-sm">{achievement.title}</span>
                        {achievement.unlocked && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </div>
                      <p className="text-xs mb-2 line-clamp-2">{achievement.description}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div 
                          className={`h-1.5 sm:h-2 rounded-full transition-all ${
                            achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Multiplication Table */}
          <div className="w-full">
            {/* Card-based design for all screen sizes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <div key={num} className={`${currentTheme.headerBg} rounded-2xl p-3 sm:p-4 border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all`}>
                  <div className={`text-center text-base sm:text-lg font-bold ${currentTheme.primary} mb-3`}>
                    {num} Times Table
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(multiplier => {
                      const product = num * multiplier;
                      return (
                        <div
                          key={multiplier}
                          onClick={() => toggleMemorized(num, multiplier)}
                          className={`p-2 sm:p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 hover:scale-105 border-2 relative ${getCellColor(num, multiplier)}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-xs sm:text-sm">
                              {num} × {multiplier}
                            </span>
                            {settings.showAnswers && (
                              <span className="font-bold text-sm sm:text-base">
                                = {product}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Popup */}
      {showAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-center max-w-xs sm:max-w-sm w-full transform animate-bounce">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{showAchievement.icon}</div>
            <h2 className="text-lg sm:text-2xl font-bold text-yellow-600 mb-1 sm:mb-2">Achievement Unlocked!</h2>
            <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">{showAchievement.title}</h3>
            <p className="text-sm sm:text-base text-gray-600">{showAchievement.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplicationTable;