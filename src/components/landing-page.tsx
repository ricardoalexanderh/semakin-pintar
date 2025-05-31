import React from 'react';
import { Calculator, Brain, Gamepad2, Star, Zap, Trophy } from 'lucide-react';

// Import logo (replace with your actual logo file)
import logo from '/logo.png';

interface Game {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    available: boolean;
    gradient: string;
    onClick: () => void;
}

interface LandingPageProps {
    onGameSelect: (gameId: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGameSelect }) => {
    const games: Game[] = [
        {
            id: 'mental-arithmetic-game',
            name: 'Mental Arithmetic Game',
            description: 'Train your brain with fun calculations',
            icon: <Calculator className="w-12 h-12" />,
            available: true,
            gradient: 'from-purple-500 to-indigo-500',
            onClick: () => onGameSelect('mental-arithmetic-game')
        },
        {
            id: 'brain-trainer',
            name: 'Brain Trainer',
            description: 'Memory and logic puzzles',
            icon: <Brain className="w-12 h-12" />,
            available: false,
            gradient: 'from-teal-500 to-cyan-500',
            onClick: () => { }
        },
        {
            id: 'quick-quiz',
            name: 'Quick Quiz',
            description: 'Fast-paced trivia challenges',
            icon: <Zap className="w-12 h-12" />,
            available: false,
            gradient: 'from-yellow-500 to-orange-400',
            onClick: () => { }
        },
        {
            id: 'puzzle-master',
            name: 'Puzzle Master',
            description: 'Solve challenging puzzles',
            icon: <Gamepad2 className="w-12 h-12" />,
            available: false,
            gradient: 'from-emerald-500 to-teal-500',
            onClick: () => { }
        },
        {
            id: 'star-challenge',
            name: 'Star Challenge',
            description: 'Collect stars and unlock levels',
            icon: <Star className="w-12 h-12" />,
            available: false,
            gradient: 'from-purple-500 to-pink-400',
            onClick: () => { }
        },
        {
            id: 'champion-mode',
            name: 'Champion Mode',
            description: 'Compete for the highest score',
            icon: <Trophy className="w-12 h-12" />,
            available: false,
            gradient: 'from-orange-500 to-red-400',
            onClick: () => { }
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-purple-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header with Logo */}
                <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
                    {/* Logo */}
                    <div className="mb-6 md:mb-8 flex justify-center">
                        <div className="relative">
                            {/* Logo Background Circle - Responsive sizes */}
                            <div className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[420px] md:h-[420px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-orange-50 to-purple-50 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden border-4 border-white">
                                {/* Decorative Elements matching logo style - Responsive */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-8 left-8 md:top-16 md:left-16 w-8 h-8 md:w-16 md:h-16 bg-purple-400 rounded-lg rotate-12"></div>
                                    <div className="absolute top-12 right-10 md:top-24 md:right-20 w-6 h-6 md:w-12 md:h-12 bg-teal-400 rounded-full"></div>
                                    <div className="absolute bottom-12 left-12 md:bottom-24 md:left-24 w-10 h-10 md:w-20 md:h-20 bg-yellow-400 rounded-lg -rotate-12"></div>
                                    <div className="absolute bottom-10 right-8 md:bottom-20 md:right-16 w-7 h-7 md:w-14 md:h-14 bg-orange-400 rounded-full"></div>
                                    <div className="absolute top-1/3 right-1/4 w-5 h-5 md:w-10 md:h-10 bg-red-400 rounded-lg rotate-45"></div>
                                </div>

                                {/* Main Logo Content */}
                                <div className="text-center z-10">
                                    {/* Logo Image Placeholder - Responsive */}
                                    <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80 mx-auto mb-4 md:mb-6 relative">                                        
                                        {
                                            <img
                                                src={logo}
                                                alt="Semakin Pintar Logo"
                                                className="w-full h-full object-contain rounded-2xl shadow-lg"
                                            />
                                        }
                                    </div>                                    
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Website Description */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl max-w-6xl mx-auto border border-purple-100">
                        <h2 className="text-2xl md:text-3xl font-bold text-purple-700 mb-4">
                            Welcome to Your Learning Adventure! 🚀
                        </h2>
                        <div className="text-base md:text-lg text-gray-700 leading-relaxed space-y-4">
                            <p>
                                <strong>Hi, I'm a father of three and passionate coder.</strong> This journey started when I watched my youngest child light up while solving math problems. That spark has inspired me to create educational games that turn learning into play, combining my coding skills with real parent insights.
                            </p>
                            <p>
                                <strong>Discover a world where education meets excitement.</strong> From mental arithmetic challenges to brain training puzzles, our collection helps children and adults develop cognitive skills while having fun. Whether you're supporting your child's learning journey or sharpening your own mind, these games are designed to challenge and inspire.
                            </p>
                            <p>
                                <strong>Love what we're building?</strong> If these games bring joy to your family's learning time, consider supporting our mission by <button
                                    onClick={() => {
                                        const donateSection = document.getElementById('donate-section');
                                        donateSection?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="inline text-purple-600 hover:text-purple-800 underline font-semibold transition-colors"
                                >
                                    buying me a coffee
                                </button> using the buttons below. Your support helps me create new games regularly and keep this project growing! ☕️✨
                            </p>
                        </div>
                    </div>
                </div>

                {/* Games Section */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-purple-100">
                    <h3 className="text-xl md:text-2xl font-bold text-purple-700 mb-6 text-center">Choose Your Game</h3>

                    {/* Games Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                        {games.map((game) => (
                            <div key={game.id} className="relative group">
                                {/* Game Icon */}
                                <button
                                    onClick={game.onClick}
                                    disabled={!game.available}
                                    className={`w-full aspect-square rounded-3xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 flex flex-col items-center justify-center p-3 md:p-4 text-white font-bold relative overflow-hidden ${game.available
                                            ? `bg-gradient-to-br ${game.gradient} hover:shadow-2xl active:scale-95`
                                            : 'bg-gray-300 cursor-not-allowed opacity-60'
                                        }`}
                                >
                                    {/* Shine Effect */}
                                    {game.available && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    )}

                                    {/* Icon */}
                                    <div className="mb-2 md:mb-3 relative z-10">
                                        {game.icon}
                                    </div>

                                    {/* Game Name */}
                                    <div className="text-xs md:text-sm font-bold text-center leading-tight relative z-10">
                                        {game.name}
                                    </div>

                                    {/* Coming Soon Badge - Diagonal Ribbon */}
                                    {!game.available && (
                                        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
                                            <div className="bg-orange-400 text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-md shadow-lg border border-orange-500 transform rotate-12 origin-center">
                                                Soon
                                            </div>
                                        </div>
                                    )}
                                </button>

                                {/* Game Description Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                    <div className="bg-purple-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                                        {game.description}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-800"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Featured Game Highlight - Mobile Responsive */}
                    <div className="mt-8 p-4 md:p-6 bg-gradient-to-r from-purple-100 to-teal-100 rounded-2xl border-2 border-purple-200">
                        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                    <Calculator className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <div>
                                    <h4 className="text-lg md:text-xl font-bold text-purple-700">Featured: Mental Arithmetic Game</h4>
                                    <p className="text-sm md:text-base text-teal-700">Start your learning journey with our most popular game!</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onGameSelect('mental-arithmetic-game')}
                                className="bg-gradient-to-r from-purple-500 to-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                            >
                                Play Now →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-purple-700/80">
                    <p className="text-base md:text-lg mb-8">
                        More games coming soon! Stay tuned for new adventures. ✨
                    </p>
                </div>

                {/* Donate Section */}
                <div id="donate-section" className="mt-12 mb-8">
                    <div className="bg-gradient-to-r from-purple-100 to-orange-100 rounded-3xl p-6 md:p-8 shadow-xl border border-purple-200 max-w-2xl mx-auto">
                        <div className="text-center">
                            <h3 className="text-xl md:text-2xl font-bold text-purple-700 mb-4">☕️ Support Our Mission</h3>
                            <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed">
                                Your support helps me dedicate more time to creating educational games that make learning fun for families worldwide. Every contribution, no matter the size, helps keep this project growing!
                            </p>

                            {/* Donate Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                {/* Buy Me a Coffee Button */}
                                <a
                                    href="https://saweria.co/semakinpintar"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 md:px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-orange-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
                                >
                                    ☕️ Buy Me a Coffee - Indonesia
                                </a>
                            </div>

                            {/* Additional Message */}
                            <p className="text-xs md:text-sm text-gray-600 mt-4 italic">
                                Thank you for believing in educational technology that makes a difference! 🙏
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;