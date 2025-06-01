import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import Breadcrumb from './breadcrumb';
import FloatingButtons from './floating-buttons';

interface GamesLayoutProps {
  children: React.ReactNode;
}

const GamesLayout: React.FC<GamesLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen relative">
      {/* Top Navigation Bar - Enhanced */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-3 sm:p-4">
            {/* Left side - Back button and Breadcrumb */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Back button */}
              <Link
                to="/games"
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium bg-gray-100 hover:bg-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Games</span>
                <span className="sm:hidden">Back</span>
              </Link>
              
              {/* Separator - Hidden on mobile */}
              <div className="hidden md:block w-px h-6 bg-gray-300"></div>
              
              {/* Breadcrumb - Enhanced for mobile */}
              <div className="min-w-0 flex-1">
                <Breadcrumb />
              </div>
            </div>

            {/* Right side - Home button on mobile */}
            <div className="flex-shrink-0 sm:hidden">
              <Link
                to="/"
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-lg text-sm"
              >
                <Home className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <FloatingButtons
        pageTitle="Educational Game - Semakin Pintar"
        pageDescription="Play this amazing educational game to improve your math skills!"
        pageUrl={typeof window !== 'undefined' ? window.location.href : 'https://www.semakinpintar.com'}
        hashtags={['education', 'kids', 'math', 'learning', 'games', 'free', 'brain-training']}
      />
      
      {/* Main Content with proper top padding */}
      <main className="pt-16 sm:pt-20">
        {children}
      </main>
    </div>
  );
};

export default GamesLayout;