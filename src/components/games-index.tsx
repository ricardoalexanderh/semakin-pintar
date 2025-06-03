import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Grid3X3, X, Divide, Shapes, ImageIcon, Play, Home } from 'lucide-react';
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
}

const GamesIndex: React.FC = () => {
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
      duration: '5-15 minutes'
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
      duration: '10-20 minutes'
    },
    {
      id: 'mental-multiplication',
      name: 'Mental Multiplication',
      description: 'Advanced multiplication practice',
      longDescription: 'Challenge yourself with larger numbers and complex multiplication problems. Build speed and accuracy in mental calculations.',
      icon: <X className="w-8 h-8" />,
      available: false,
      gradient: 'from-yellow-500 to-orange-400',
      path: '/games/mental-multiplication',
      difficulty: 'Beginner to Expert',
      duration: '5-15 minutes'
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
      duration: '5-15 minutes'
    },
    {
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
    },
    {
      id: 'picture-algebra',
      name: 'Picture Algebra',
      description: 'Solve equations with pictures',
      longDescription: 'Learn algebraic thinking through visual puzzles and picture-based equations. Build foundational skills for advanced mathematics.',
      icon: <ImageIcon className="w-8 h-8" />,
      available: false,
      gradient: 'from-orange-500 to-red-400',
      path: '/games/picture-algebra',
      difficulty: 'Elementary',
      duration: '5-15 minutes'
    }
  ];

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

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className={`bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden border-2 flex flex-col h-full ${
                game.available ? 'border-gray-200 hover:border-purple-300' : 'border-gray-200 opacity-75'
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
                    <h2 className="text-xl font-bold">{game.name}</h2>
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
    </div>
  );
};

export default GamesIndex;