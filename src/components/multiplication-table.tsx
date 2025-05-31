import React, { useState, useEffect, useRef } from 'react';
import { Grid, CheckCircle, Star, Trophy, Target, ArrowLeft, RotateCcw, Zap } from 'lucide-react';
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

  // Update settings function with memory persistence
  const updateSettings = (newSettings: TableSettings | ((prev: TableSettings) => TableSettings)): void => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
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

  // Sound functions
  const playSound = async (type: SoundType): Promise<void> => {
    if (!settings.soundEnabled) return;
    
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      const synth = new Tone.Synth().toDestination();
      
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
    const totalFacts = 100; // 10x10 table
    const memorizedCount = Object.values(memorizedFacts).filter(Boolean).length;
    
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

  // Check for new achievements
  const checkAchievements = (previousCount: number, newCount: number): void => {
    if (!settings.gamificationEnabled) return;
    
    const newAchievements = generateAchievements();
    const previousAchievements = achievements;
    
    // Find newly unlocked achievements
    for (const achievement of newAchievements) {
      const wasUnlocked = previousAchievements.find(a => a.id === achievement.id)?.unlocked || false;
      if (achievement.unlocked && !wasUnlocked) {
        setShowAchievement(achievement);
        playSound('achievement');
        setTimeout(() => setShowAchievement(null), 3000);
        break; // Show one achievement at a time
      }
    }
    
    setAchievements(newAchievements);
  };

  // Toggle memorization status
  const toggleMemorized = (num1: number, num2: number): void => {
    const key1 = `${num1}x${num2}`;
    const key2 = `${num2}x${num1}`;
    
    const previousCount = Object.values(memorizedFacts).filter(Boolean).length;
    
    updateMemorizedFacts(prev => {
      const newFacts = { ...prev };
      const isCurrentlyMemorized = newFacts[key1] || false;
      
      if (isCurrentlyMemorized) {
        // Uncheck both directions
        delete newFacts[key1];
        delete newFacts[key2];
        playSound('uncheck');
      } else {
        // Check both directions (since multiplication is commutative)
        newFacts[key1] = true;
        newFacts[key2] = true;
        playSound('check');
      }
      
      return newFacts;
    });

    // Check for achievements after state update
    setTimeout(() => {
      const newCount = Object.values(memorizedFacts).filter(Boolean).length;
      checkAchievements(previousCount, newCount);
    }, 100);
  };

  // Check if a fact is memorized
  const isMemorized = (num1: number, num2: number): boolean => {
    const key = `${num1}x${num2}`;
    return memorizedFacts[key] || false;
  };

  // Clear all memorized facts
  const clearAllMemorized = (): void => {
    updateMemorizedFacts({});
    setAchievements(generateAchievements());
    playSound('buttonClick');
  };

  // Calculate progress
  const getProgress = () => {
    const totalFacts = 100; // 10x10 table
    const memorizedCount = Object.values(memorizedFacts).filter(Boolean).length;
    return {
      memorized: memorizedCount,
      total: totalFacts,
      percentage: Math.round((memorizedCount / totalFacts) * 100)
    };
  };

  // Initialize achievements on component mount
  useEffect(() => {
    setAchievements(generateAchievements());
  }, [memorizedFacts]);

  // Get cell background color based on memorization status
  const getCellColor = (num1: number, num2: number): string => {
    if (isMemorized(num1, num2)) {
      return 'bg-green-200 border-green-400 text-green-800';
    }
    
    // Special colors for certain patterns
    if (num1 === num2) return 'bg-yellow-100 border-yellow-300'; // Perfect squares
    if (num1 === 1 || num2 === 1) return 'bg-blue-100 border-blue-300'; // Times 1
    if (num1 === 10 || num2 === 10) return 'bg-purple-100 border-purple-300'; // Times 10
    if (num1 === 5 || num2 === 5) return 'bg-pink-100 border-pink-300'; // Times 5
    
    return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
  };

  const progress = getProgress();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} p-4`}>
      <div className="max-w-7xl mx-auto">
        <div className={`${currentTheme.cardBg} rounded-3xl shadow-2xl p-6`}>
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex items-center gap-4 mb-4 lg:mb-0">
              {onBackToHome && (
                <button
                  onClick={() => {
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
                <Grid className={`w-8 h-8 ${currentTheme.secondary}`} />
                <div>
                  <h1 className={`text-3xl font-bold ${currentTheme.primary}`}>Multiplication Table</h1>
                  <p className={`text-lg ${currentTheme.secondary}`}>1 × 1 to 10 × 10</p>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="flex flex-wrap gap-3">
              {/* Theme Selector */}
              <select
                value={settings.theme}
                onChange={(e) => {
                  playSound('settingChange');
                  updateSettings(prev => ({...prev, theme: e.target.value as TableSettings['theme']}));
                }}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
              >
                {Object.entries(themes).map(([key, theme]) => (
                  <option key={key} value={key}>{theme.name}</option>
                ))}
              </select>

              {/* Toggle Buttons */}
              <button
                onClick={() => {
                  playSound('settingChange');
                  updateSettings(prev => ({...prev, soundEnabled: !prev.soundEnabled}));
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  settings.soundEnabled 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {settings.soundEnabled ? '🔊' : '🔇'} Sound
              </button>

              <button
                onClick={() => {
                  playSound('settingChange');
                  updateSettings(prev => ({...prev, showAnswers: !prev.showAnswers}));
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  settings.showAnswers 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {settings.showAnswers ? '👁️' : '🙈'} Answers
              </button>

              <button
                onClick={() => {
                  playSound('settingChange');
                  updateSettings(prev => ({...prev, gamificationEnabled: !prev.gamificationEnabled}));
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  settings.gamificationEnabled 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {settings.gamificationEnabled ? '🏆' : '📚'} Goals
              </button>

              <button
                onClick={clearAllMemorized}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Progress Bar and Stats */}
          <div className={`${currentTheme.headerBg} rounded-2xl p-4 mb-6`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Target className={`w-6 h-6 ${currentTheme.primary}`} />
                  <span className={`text-lg font-bold ${currentTheme.primary}`}>
                    Progress: {progress.memorized}/{progress.total} ({progress.percentage}%)
                  </span>
                </div>
                <div className="flex-1 min-w-48">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {progress.percentage === 100 && (
                <div className="flex items-center gap-2 text-yellow-600 animate-pulse">
                  <Trophy className="w-6 h-6" />
                  <span className="font-bold">MASTER COMPLETED!</span>
                </div>
              )}
            </div>
          </div>

          {/* Achievements Panel */}
          {settings.gamificationEnabled && (
            <div className="mb-6">
              <h2 className={`text-xl font-bold ${currentTheme.primary} mb-3 flex items-center gap-2`}>
                <Star className="w-5 h-5" />
                Achievements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {achievements.map(achievement => (
                  <div 
                    key={achievement.id}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      achievement.unlocked 
                        ? 'bg-yellow-100 border-yellow-400 text-yellow-800' 
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{achievement.icon}</span>
                      <span className="font-bold text-sm">{achievement.title}</span>
                      {achievement.unlocked && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <p className="text-xs mb-2">{achievement.description}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multiplication Table */}
          <div className="overflow-x-auto">
            <div className="min-w-fit">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`w-12 h-12 ${currentTheme.headerBg} border-2 border-gray-300 font-bold ${currentTheme.primary} text-xl`}>
                      ×
                    </th>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <th key={num} className={`w-16 h-12 ${currentTheme.headerBg} border-2 border-gray-300 font-bold ${currentTheme.primary} text-xl`}>
                        {num}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(row => (
                    <tr key={row}>
                      <th className={`w-12 h-16 ${currentTheme.headerBg} border-2 border-gray-300 font-bold ${currentTheme.primary} text-xl`}>
                        {row}
                      </th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(col => {
                        const product = row * col;
                        const memorized = isMemorized(row, col);
                        return (
                          <td 
                            key={col}
                            className={`w-16 h-16 border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${getCellColor(row, col)}`}
                            onClick={() => toggleMemorized(row, col)}
                          >
                            <div className="flex flex-col items-center justify-center h-full relative">
                              {memorized && (
                                <CheckCircle className="absolute top-1 right-1 w-4 h-4 text-green-600" />
                              )}
                              <div className="text-xs font-medium opacity-75">
                                {row}×{col}
                              </div>
                              {settings.showAnswers && (
                                <div className="text-lg font-bold">
                                  {product}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
            <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              How to Use:
            </h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Click on any cell to mark it as memorized ✅</li>
              <li>• Different colors represent different number patterns</li>
              <li>• Yellow cells = Perfect squares (1×1, 2×2, etc.)</li>
              <li>• Blue cells = Times 1, Pink cells = Times 5, Purple cells = Times 10</li>
              <li>• Track your progress and unlock achievements! 🏆</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Achievement Popup */}
      {showAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full transform animate-bounce">
            <div className="text-6xl mb-4">{showAchievement.icon}</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Achievement Unlocked!</h2>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{showAchievement.title}</h3>
            <p className="text-gray-600">{showAchievement.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplicationTable;