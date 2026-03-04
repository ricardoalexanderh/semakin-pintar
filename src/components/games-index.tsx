import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Grid3X3, X, Divide, Shapes, Play, Home, /*Search,*/ Rocket, Filter, ArrowUpDown } from 'lucide-react';
import { trackButtonClick } from '../utils/analytics';
import FloatingButtons from './floating-buttons';
import Breadcrumb from './breadcrumb';

// Import logo
import logo from '/logo.png';

interface Game {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  available: boolean;
  gradient: string;
  path: string;
  difficulty: string;
  duration: string;
  category: string;
}

const GamesIndex: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Custom SVG icon for Math Drop
  /*const MathDropIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="5" fill="#ec4899" opacity="0.9">
        <animate attributeName="cy" values="8;40;8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="24" cy="12" r="5" fill="#a855f7" opacity="0.7">
        <animate attributeName="cy" values="12;44;12" dur="2.3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="36" cy="6" r="5" fill="#8b5cf6" opacity="0.8">
        <animate attributeName="cy" values="6;38;6" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <text x="12" y="13" textAnchor="middle" className="text-xs font-bold fill-white">+</text>
      <text x="24" y="17" textAnchor="middle" className="text-xs font-bold fill-white">×</text>
      <text x="36" y="11" textAnchor="middle" className="text-xs font-bold fill-white">=</text>
    </svg>
  );*/

  //TODO: Update new games
  const games: Game[] = [
    {
      id: 'mental-arithmetic',
      name: 'Mental Arithmetic',
      description: 'Train your brain with fun calculations',
      longDescription: 'Improve your mental math skills with progressive difficulty levels, customizable settings, and optional voice guidance. Perfect for building cognitive abilities.',
      icon: <Calculator className="w-8 h-8" />,
      available: true,
      gradient: 'from-purple-500 to-indigo-500',
      path: '/games/mental-arithmetic',
      difficulty: 'Beginner to Expert',
      duration: '5-15 minutes',
      category: 'Mental Math Games'
    },
    {
      id: 'multiplication-table',
      name: 'Multiplication Table',
      description: 'Master multiplication tables 1-10',
      longDescription: 'Interactive multiplication table practice with progress tracking, achievements, and gamification. Memorize facts from 1×1 to 10×10 systematically.',
      icon: <Grid3X3 className="w-8 h-8" />,
      available: true,
      gradient: 'from-teal-500 to-cyan-500',
      path: '/games/multiplication-table',
      difficulty: 'Elementary',
      duration: '10-20 minutes',
      category: 'Math Foundation'
    },
    {
      id: 'mental-multiplication',
      name: 'Mental Multiplication',
      description: 'Advanced multiplication practice',
      longDescription: 'Challenge yourself with larger numbers and complex multiplication problems. Build speed and accuracy in mental calculations.',
      icon: <X className="w-8 h-8" />,
      available: true,
      gradient: 'from-yellow-500 to-orange-400',
      path: '/games/mental-multiplication',
      difficulty: 'Beginner to Expert',
      duration: '5-15 minutes',
      category: 'Mental Math Games'
    },
    {
      id: 'mental-division',
      name: 'Mental Division',
      description: 'Master division skills',
      longDescription: 'Practice mental division with various difficulty levels. Develop strong foundational skills for advanced mathematics.',
      icon: <Divide className="w-8 h-8" />,
      available: true,
      gradient: 'from-emerald-500 to-teal-500',
      path: '/games/mental-division',
      difficulty: 'Beginner to Expert',
      duration: '5-15 minutes',
      category: 'Mental Math Games'
    },
    /*{
      id: 'patterns',
      name: 'Patterns',
      description: 'Discover and complete patterns',
      longDescription: 'Enhance pattern recognition skills through engaging visual and logical sequence challenges. Perfect for developing analytical thinking.',
      icon: <Shapes className="w-8 h-8" />,
      available: false,
      gradient: 'from-purple-500 to-pink-400',
      path: '/games/patterns',
      difficulty: 'Elementary',
      duration: '5-15 minutes'
    },*/
    /*{
      id: 'patterns-detective',
      name: 'Patterns Detective',
      description: 'Solve pattern puzzles',
      longDescription: 'Develop computational thinking skills through pattern recognition. Train your brain to identify sequences, relationships, and logical rules in numbers.',
      icon: <Search className="w-8 h-8" />,
      available: true,
      gradient: 'from-purple-500 to-blue-500',
      path: '/games/patterns-detective',
      difficulty: 'Beginner to Expert',
      duration: '5-15 minutes',
      category: 'Cognitive Skills'
    },*/
    {
      id: 'rocket-math',
      name: 'Rocket Math',
      description: 'Space math adventure',
      longDescription: 'Fly your rocket through space while solving math problems! Navigate through asteroid fields while practicing mental arithmetic for an exciting learning experience.',
      icon: <Rocket className="w-8 h-8" />,
      available: true,
      gradient: 'from-blue-600 to-purple-600',
      path: '/games/rocket-math',
      difficulty: 'Elementary to Advanced',
      duration: '5-20 minutes',
      category: 'Fun Math Games'
    },
    {
      id: 'mathcha-cafe',
      name: 'Mathcha Cafe',
      description: 'Serve customers with math skills',
      longDescription: 'Run your own matcha cafe! Serve customers by solving math problems including addition, subtraction, budgets, and discounts. Master the art of tea service through mindful mathematics.',
      icon: <span className="text-2xl">🍵</span>,
      available: true,
      gradient: 'from-green-500 to-amber-500',
      path: '/games/mathcha-cafe',
      difficulty: 'Beginner to Expert',
      duration: '10-25 minutes',
      category: 'Fun Math Games'
    },
    {
      id: 'sort-attack',
      name: 'Sort Attack',
      description: 'Sort numbers with adjacent swaps',
      longDescription: 'Race the clock to sort scrambled numbers using only adjacent swaps. Minimize your moves, use hints wisely, and keep the timer alive by completing rounds. A fast-paced logic challenge!',
      icon: <ArrowUpDown className="w-8 h-8" />,
      available: true,
      gradient: 'from-cyan-500 to-blue-500',
      path: '/games/sort-attack',
      difficulty: 'Easy to Hard',
      duration: '2-10 minutes',
      category: 'Fun Math Games'
    },
    {
      id: 'math-flip',
      name: 'Math Flip',
      description: 'Card-matching math challenge',
      longDescription: 'Flip cards to match equations with their answers before the timer runs out! Survive as many rounds as possible — correct matches add time, wrong flips cost it. Progressive difficulty with addition, multiplication, division, and squares.',
      icon: <span className="text-2xl">🃏</span>,
      available: true,
      gradient: 'from-emerald-600 to-teal-500',
      path: '/games/math-flip',
      difficulty: 'Beginner to Expert',
      duration: '3-15 minutes',
      category: 'Fun Math Games'
    },
    {
      id: 'mirror-dash',
      name: 'Mirror Dash',
      description: 'Train your brain with dual-focus reflexes',
      longDescription: 'Control two ships at once across mirrored lanes! Navigate both sides simultaneously — dodge obstacles, grab power-ups, and make split-second decisions. Sharpens focus, reaction time, and multitasking.',
      icon: <span className="text-2xl">🪞</span>,
      available: true,
      gradient: 'from-purple-600 to-pink-500',
      path: '/games/mirror-dash',
      difficulty: 'Intermediate to Expert',
      duration: '2-10 minutes',
      category: 'Brain Training'
    },
    /*{
      id: 'math-drop',
      name: 'Math Drop',
      description: 'Puzzle math with falling blocks',
      longDescription: 'Puyo Puyo-style puzzle game with math equations! Match colors, numbers, and solve equations to clear pieces. Features special power-ups, chain reactions, and progressive difficulty.',
      icon: <MathDropIcon />,
      available: true,
      gradient: 'from-pink-500 to-purple-500',
      path: '/games/math-drop',
      difficulty: 'Beginner to Expert',
      duration: '10-30 minutes',
      category: 'Fun Math Games'
    }*/
  ];

  // Group games by category
  const gamesByCategory = games.reduce((acc, game) => {
    if (!acc[game.category]) {
      acc[game.category] = [];
    }
    acc[game.category].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  const categoryOrder = ['Mental Math Games', 'Fun Math Games', 'Math Foundation', 'Reflex & Decision', 'Cognitive Skills', 'Brain Training'];
  const allCategories = ['All', ...categoryOrder];

  // Filter games based on selected category
  const filteredGamesByCategory = selectedCategory === 'All' 
    ? gamesByCategory 
    : { [selectedCategory]: gamesByCategory[selectedCategory] || [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb with Home Icon */}
        <div className="mb-4 flex items-center gap-3">
          <Link
            to="/"
            onClick={() => trackButtonClick('home-icon', 'breadcrumb')}
            className="text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100 sm:hidden"
          >
            <Home className="w-5 h-5" />
          </Link>
          <Breadcrumb />
        </div>

        {/* Header */}
        <div className="mb-8">

          {/* Website Logo */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                {/* Simple Logo Container - No decorative elements */}
                <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[260px] md:h-[260px] flex items-center justify-center">
                  {/* Logo Image - Clean and simple */}
                  <div className="w-full h-full mx-auto relative">
                    <img
                      src={logo}
                      alt="Semakin Pintar Logo - Free Educational Games Platform"
                      className="w-full h-full object-contain rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-purple-800 mb-4">
              Educational Games & Learning Tools Collection
            </h1>
            <p className="text-lg md:text-xl text-purple-600 max-w-3xl mx-auto">
              Discover our collection of free educational games designed to make learning fun and engaging.
              Perfect for kids, students, and anyone looking to sharpen their cognitive skills.
            </p>
          </div>
        </div>

        {/* Floating Buttons */}
        <FloatingButtons
          pageTitle="Educational Games & Learning Tools Collection - Semakin Pintar"
          pageDescription="Discover our collection of free educational games including mental arithmetic, multiplication tables, and brain training games."
          pageUrl="https://www.semakinpintar.com/games"
          hashtags={['education', 'kids', 'math', 'learning', 'games', 'free', 'collection']}
        />

        {/* Category Filter */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">Filter by Category</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    trackButtonClick(`filter-${category.toLowerCase().replace(/\s+/g, '-')}`, 'category-filter');
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-purple-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {selectedCategory !== 'All' && (
              <div className="mt-4 text-sm text-purple-600">
                Showing {gamesByCategory[selectedCategory]?.length || 0} game(s) in "{selectedCategory}"
              </div>
            )}
          </div>
        </div>


        {/* Games by Category */}
        {(selectedCategory === 'All' ? categoryOrder : [selectedCategory]).map((category) => {
          const categoryGames = filteredGamesByCategory[category];
          if (!categoryGames || categoryGames.length === 0) return null;

          return (
            <div key={category} className="mb-12">
              {/* Category Header */}
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-purple-800 mb-2">
                  {category}
                </h2>
              </div>

              {/* Games Grid for this category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryGames.map((game) => (
                  <div
                    key={game.id}
                    className={`bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden border-2 flex flex-col h-full ${game.available ? 'border-gray-200 hover:border-purple-300' : 'border-gray-200 opacity-75'
                      }`}
                  >
                    {/* Game Header - Fixed height */}
                    <div className={`bg-gradient-to-r ${game.gradient} p-6 text-white relative`}>
                      {!game.available && (
                        <div className="absolute top-3 right-3 bg-orange-400 text-white text-xs font-bold px-2 py-1 rounded-md border border-orange-500 transform rotate-12">
                          Coming Soon
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        {game.icon}
                        <div>
                          <h3 className="text-xl font-bold">{game.name}</h3>
                          <p className="text-sm opacity-90">{game.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Game Content - Flexible area */}
                    <div className="p-6 flex flex-col flex-1">
                      {/* Description - Flexible content */}
                      <div className="flex-1">
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {game.longDescription}
                        </p>
                      </div>

                      {/* Game Details - Fixed position above button */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Difficulty:</span>
                          <span className="font-medium text-gray-700">{game.difficulty}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium text-gray-700">{game.duration}</span>
                        </div>
                      </div>

                      {/* Action Button - Always at bottom */}
                      <div className="mt-auto">
                        {game.available ? (
                          <Link
                            to={game.path}
                            onClick={() => trackButtonClick(`play-${game.id}`, 'games-index')}
                            className={`w-full bg-gradient-to-r ${game.gradient} text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 group`}
                          >
                            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Play Now
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="w-full bg-gray-300 text-gray-500 font-bold py-3 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Shapes className="w-5 h-5" />
                            Coming Soon
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GamesIndex;