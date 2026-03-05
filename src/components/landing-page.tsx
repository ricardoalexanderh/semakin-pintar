import React from 'react';
import { Link } from 'react-router-dom';
import { Shapes, Rocket, /*Grid3X3,*/ Lightbulb, Puzzle, Mail, ExternalLink, Layers, Search, Target, Workflow, ArrowUpDown } from 'lucide-react';
import { trackButtonClick, trackDonationClick } from '../utils/analytics';
import FloatingButtons from './floating-buttons';

// Import logo
import logo from '/logo.png';

interface Game {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    available: boolean;
    gradient: string;
    path: string;
}

interface LandingPageProps {
  // No props needed anymore since we use React Router directly
}

    // Custom animated SVG icons for all games
    /*const MathDropIcon = () => (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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


const LandingPage: React.FC<LandingPageProps> = () => {
    //TODO: Update new games
    const games: Game[] = [        
        /*{
            id: 'multiplication-table',
            name: 'Multiplication Table',
            description: 'Memorize multiplication tables',
            icon: <Grid3X3 className="w-12 h-12" />,
            available: true,
            gradient: 'from-teal-500 to-cyan-500',
            path: '/games/multiplication-table'
        },*/
        /*{
            id: 'math-drop',
            name: 'Math Drop',
            description: 'Puzzle math with falling blocks',
            icon: <MathDropIcon />,
            available: true,
            gradient: 'from-pink-500 to-purple-500',
            path: '/games/math-drop'
        },*/
        {
            id: 'mirror-dash',
            name: 'Mirror Dash',
            description: 'Train your brain with dual-focus reflexes',
            icon: <svg className="w-12 h-12" viewBox="0 0 32 32" fill="none"><path d="M8 6L4 18L8 14L12 18Z" fill="currentColor" opacity="0.9"/><path d="M24 6L20 18L24 14L28 18Z" fill="currentColor" opacity="0.9"/><line x1="16" y1="2" x2="16" y2="30" stroke="currentColor" opacity="0.3" strokeWidth="1" strokeDasharray="2 2"/></svg>,
            available: true,
            gradient: 'from-purple-600 to-pink-500',
            path: '/games/mirror-dash'
        },
        {
            id: 'sort-attack',
            name: 'Sort Attack',
            description: 'Sort numbers with adjacent swaps before time runs out',
            icon: <ArrowUpDown className="w-12 h-12" />,
            available: true,
            gradient: 'from-cyan-500 to-blue-500',
            path: '/games/sort-attack'
        },
        {
            id: 'math-flip',
            name: 'Math Flip',
            description: 'Card-matching math challenge',
            icon: <span className="text-3xl">🃏</span>,
            available: true,
            gradient: 'from-emerald-600 to-teal-500',
            path: '/games/math-flip'
        },
        {
            id: 'mathcha-cafe',
            name: 'Mathcha Cafe',
            description: 'Serve customers with math skills',
            icon: <span className="text-3xl">🍵</span>,
            available: true,
            gradient: 'from-green-500 to-amber-500',
            path: '/games/mathcha-cafe'
        },
        /*{
            id: 'patterns-detective',
            name: 'Patterns Detective',
            description: 'Solve pattern puzzles',
            icon: <Search className="w-12 h-12" />,
            available: true,
            gradient: 'from-purple-500 to-pink-400',
            path: '/games/patterns-detective'
        },*/
        {
            id: 'rocket-math',
            name: 'Rocket Math',
            description: 'Space math adventure',
            icon: <Rocket className="w-12 h-12" />,
            available: true,
            gradient: 'from-blue-600 to-purple-600',
            path: '/games/rocket-math'
        },
        {
            id: 'pair-shift',
            name: 'Pair Shift',
            description: 'Slide pairs of cards to sort them',
            icon: <span className="text-3xl font-black" style={{ letterSpacing: '-2px' }}>⇌</span>,
            available: true,
            gradient: 'from-orange-500 to-yellow-500',
            path: '/games/pair-shift'
        },
        {
            id: 'stack-climber',
            name: 'Stack Climber',
            description: 'Jump on correct blocks to climb higher',
            icon: <span className="text-5xl">🧗</span>,
            available: true,
            gradient: 'from-violet-600 to-indigo-500',
            path: '/games/stack-climber'
        },
        /*{
            id: 'mental-division',
            name: 'Mental Division',
            description: 'Perfect your division abilities',
            icon: <Divide className="w-12 h-12" />,
            available: true,
            gradient: 'from-emerald-500 to-teal-500',
            path: '/games/mental-division'
        },*/
        /*{
            id: 'patterns',
            name: 'Patterns',
            description: 'Discover and complete patterns',
            icon: <Shapes className="w-12 h-12" />,
            available: false,
            gradient: 'from-purple-500 to-pink-400',
            path: '/games/patterns'
        },*/        
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-purple-100 p-4 overflow-x-hidden">
            <div className="max-w-4xl mx-auto">
                {/* Header with Logo */}
                <header className="text-center mb-8 pt-4 md:pt-8">
                    {/* Logo */}
                    <div className="mb-6 md:mb-8 flex justify-center">
                        <div className="relative">
                            {/* Logo Background Circle - Responsive sizes */}
                            <div className="w-[260px] h-[260px] sm:w-[350px] sm:h-[350px] md:w-[420px] md:h-[420px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-orange-50 to-purple-50 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden border-4 border-white max-w-[calc(100vw-2rem)]">
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
                                    <div className="w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80 mx-auto mb-4 md:mb-6 relative">                                        
                                        <img
                                            src={logo}
                                            alt="Semakin Pintar Logo - Free Educational Games Platform"
                                            className="w-full h-full object-contain rounded-2xl shadow-lg"
                                        />
                                    </div>                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Floating Buttons */}
                <FloatingButtons
                    pageTitle="Semakin Pintar - Free Educational Games for Kids & Family Learning"
                    pageDescription="Discover our collection of free educational games designed to make learning fun and engaging. Perfect for kids, students, and families!"
                    pageUrl="https://www.semakinpintar.com"
                    hashtags={['education', 'kids', 'math', 'learning', 'games', 'free', 'family']}
                />

                {/* Website Description */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl max-w-6xl mx-auto border border-purple-100 mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-purple-700 mb-4">
                        Welcome to Your Learning Adventure! 🚀
                    </h1>
                    <div className="text-base md:text-lg text-gray-700 leading-relaxed space-y-4">
                        <p>
                            <strong>Hi, I'm a father of three and passionate coder.</strong> This journey started when I watched my youngest child light up while solving math problems. That spark has inspired me to create educational games that turn learning into play, combining my coding skills with real parent insights.
                        </p>
                        <p>
                            <strong>Discover a world where education meets excitement.</strong> From mental arithmetic challenges to brain training puzzles, our collection helps children and adults develop cognitive skills while having fun. Through interactive gameplay, we naturally build <button
                                onClick={() => {
                                    trackButtonClick('scroll-to-computational-thinking', 'description');
                                    const computationalSection = document.querySelector('[data-section="computational-thinking"]');
                                    computationalSection?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="inline text-purple-600 hover:text-purple-800 underline font-semibold transition-colors"
                            >
                                computational thinking skills
                            </button>—the foundation of problem-solving that's essential in today's digital world. Whether you're supporting your child's learning journey or sharpening your own mind, these games are designed to challenge and inspire.
                        </p>
                        <p>
                            <strong>Love what we're building?</strong> If these games bring joy to your family's learning time, consider supporting our mission by <button
                                onClick={() => {
                                    trackButtonClick('scroll-to-donate', 'description');
                                    const donateSection = document.getElementById('donate-section');
                                    donateSection?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="inline text-purple-600 hover:text-purple-800 underline font-semibold transition-colors"
                            >
                                buying me a coffee
                            </button> using the buttons below. Your support helps me create new games regularly and keep this project growing! Want to chat or need custom development? <button
                                onClick={() => {
                                    trackButtonClick('scroll-to-contact', 'description');
                                    const contactSection = document.querySelector('[data-section="contact"]');
                                    contactSection?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="inline text-purple-600 hover:text-purple-800 underline font-semibold transition-colors"
                            >
                                Contact me here
                            </button>!
                        </p>
                    </div>
                </section>

                {/* Games Section */}
                <section className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-purple-100 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                        <h2 className="text-xl md:text-2xl font-bold text-purple-700 text-center sm:text-left">Explore New Games & Learning Tools</h2>
                        <Link
                            to="/games"
                            onClick={() => trackButtonClick('view-all-games', 'games-section-header')}
                            className="bg-gradient-to-r from-purple-500 to-teal-500 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 text-sm justify-center sm:justify-start"
                        >
                            View All Games
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Games Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                        {games.map((game) => (
                            <article key={game.id} className="relative group">
                                {/* Game Icon */}
                                {game.available ? (
                                    <Link
                                        to={game.path}
                                        onClick={() => {
                                            trackButtonClick(`game-${game.id}`, 'games-grid');
                                        }}
                                        className={`w-full aspect-square rounded-3xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 flex flex-col items-center justify-center p-3 md:p-4 text-white font-bold relative overflow-hidden bg-gradient-to-br ${game.gradient} hover:shadow-2xl active:scale-95 block`}
                                    >
                                        {/* Shine Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                                        {/* Icon */}
                                        <div className="mb-2 md:mb-3 relative z-10">
                                            {game.icon}
                                        </div>

                                        {/* Game Name */}
                                        <div className="text-xs md:text-sm font-bold text-center leading-tight relative z-10">
                                            {game.name}
                                        </div>
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full aspect-square rounded-3xl shadow-lg transition-all duration-300 flex flex-col items-center justify-center p-3 md:p-4 text-white font-bold relative overflow-hidden bg-gray-300 cursor-not-allowed opacity-60"
                                    >
                                        {/* Icon */}
                                        <div className="mb-2 md:mb-3 relative z-10">
                                            {game.icon}
                                        </div>

                                        {/* Game Name */}
                                        <div className="text-xs md:text-sm font-bold text-center leading-tight relative z-10">
                                            {game.name}
                                        </div>

                                        {/* Coming Soon Badge */}
                                        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
                                            <div className="bg-orange-400 text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-md shadow-lg border border-orange-500 transform rotate-12 origin-center">
                                                Soon
                                            </div>
                                        </div>
                                    </button>
                                )}

                                {/* Game Description Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                    <div className="bg-purple-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                                        {game.description}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-800"></div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Featured Game Highlight - Mobile Responsive */}
                    {/* Previous featured game - Mental Arithmetic
                    <div className="mt-8 p-4 md:p-6 bg-gradient-to-r from-purple-100 to-teal-100 rounded-2xl border-2 border-purple-200">
                        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                    <Calculator className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-purple-700">Featured: Mental Arithmetic Game</h3>
                                    <p className="text-sm md:text-base text-teal-700">Start your learning journey with our most popular game!</p>
                                </div>
                            </div>
                            <Link
                                to="/games/mental-arithmetic"
                                onClick={() => {
                                    trackButtonClick('featured-mental-arithmetic', 'featured-section');
                                }}
                                className="bg-gradient-to-r from-purple-500 to-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto text-center block"
                            >
                                Play Now →
                            </Link>
                        </div>
                    </div>
                    */}
                    
                    {/* Previous featured game - Mathcha Cafe
                    <div className="mt-8 p-4 md:p-6 bg-gradient-to-r from-green-100 to-amber-100 rounded-2xl border-2 border-green-200">
                        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <div className="bg-gradient-to-r from-green-500 to-amber-500 text-white w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                    <span className="text-2xl md:text-3xl">🍵</span>
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-green-700">Featured: Mathcha Cafe</h3>
                                    <p className="text-sm md:text-base text-amber-700">Serve customers with math skills in this cozy cafe management!</p>
                                </div>
                            </div>
                            <Link
                                to="/games/mathcha-cafe"
                                onClick={() => {
                                    trackButtonClick('featured-mathcha-cafe', 'featured-section');
                                }}
                                className="bg-gradient-to-r from-green-500 to-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto text-center block"
                            >
                                Play Now →
                            </Link>
                        </div>
                    </div>
                    */}
                    
                    {/* Previous featured game - Mathcha Cafe
                    <div className="mt-8 p-4 md:p-6 bg-gradient-to-r from-green-100 to-amber-100 rounded-2xl border-2 border-green-200">
                        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <div className="bg-gradient-to-r from-green-500 to-amber-500 text-white w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                    <span className="text-2xl">🍵</span>
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-green-700">Featured: Mathcha Cafe</h3>
                                    <p className="text-sm md:text-base text-amber-700">Run your own matcha cafe! Serve customers by solving math problems.</p>
                                </div>
                            </div>
                            <Link
                                to="/games/mathcha-cafe"
                                onClick={() => {
                                    trackButtonClick('featured-mathcha-cafe', 'featured-section');
                                }}
                                className="bg-gradient-to-r from-green-500 to-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto text-center block"
                            >
                                Play Now →
                            </Link>
                        </div>
                    </div>
                    */}

                    <div className="mt-8 p-4 md:p-6 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-2xl border-2 border-violet-200">
                        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <div className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                    <span className="text-2xl md:text-3xl">🧗</span>
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-violet-700">New: Stack Climber</h3>
                                    <p className="text-sm md:text-base text-indigo-700">Jump on the correct blocks to launch yourself higher and higher! Apply number rules to survive.</p>
                                </div>
                            </div>
                            <Link
                                to="/games/stack-climber"
                                onClick={() => {
                                    trackButtonClick('featured-stack-climber', 'featured-section');
                                }}
                                className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-6 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto text-center block"
                            >
                                Play Now →
                            </Link>
                        </div>
                    </div>

                    {/* More Games Coming Soon */}
                    <div className="mt-6 text-center text-purple-700/80">
                        <p className="text-base md:text-lg">
                            More games coming soon! Stay tuned for new adventures. ✨
                        </p>
                    </div>
                </section>

                {/* Computational Thinking Section */}
                <section data-section="computational-thinking" className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-purple-100 mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-6 text-center flex items-center justify-center gap-3">
                        <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
                        Why Computational Thinking Matters
                        <Puzzle className="w-6 h-6 md:w-8 md:h-8 text-teal-500" />
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        {/* Text Content */}
                        <div className="space-y-4 text-gray-700">
                            <p className="text-base md:text-lg leading-relaxed">
                                <strong>Computational thinking</strong> isn't just about coding—it's a superpower for solving any problem! It teaches us to break down complex challenges into smaller, manageable pieces using four key skills.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-sm font-bold">1</span>
                                    </div>
                                    <p><strong>Decomposition:</strong> Breaking big problems into smaller, manageable parts</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-sm font-bold">2</span>
                                    </div>
                                    <p><strong>Pattern Recognition:</strong> Finding similarities and connections in data</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-sm font-bold">3</span>
                                    </div>
                                    <p><strong>Abstraction:</strong> Focusing on important details while ignoring irrelevant ones</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-sm font-bold">4</span>
                                    </div>
                                    <p><strong>Algorithm Design:</strong> Creating step-by-step solutions and instructions</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Graphic */}
                        <div className="flex justify-center">
                            <div className="relative w-48 h-48 md:w-64 md:h-64 mx-4">
                                {/* Central Brain */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-xl">
                                    <Shapes className="w-16 h-16 md:w-20 md:h-20 text-white" />
                                </div>

                                {/* Orbiting Elements - Icons for 4 CT skills */}
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                                    <Layers className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute top-1/2 right-0 md:-right-4 transform -translate-y-1/2 md:translate-y-1/2 translate-x-2 md:translate-x-0 w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg animate-pulse delay-150">
                                    <Search className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center shadow-lg animate-pulse delay-300">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute top-1/2 left-0 md:-left-4 transform -translate-y-1/2 md:translate-y-1/2 -translate-x-2 md:translate-x-0 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-lg flex items-center justify-center shadow-lg animate-pulse delay-500">
                                    <Workflow className="w-6 h-6 text-white" />
                                </div>

                                {/* Connecting Lines */}
                                <div className="absolute inset-0 opacity-30">
                                    <svg className="w-full h-full" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="35" fill="none" stroke="url(#gradient1)" strokeWidth="2" strokeDasharray="5,5" className="animate-spin" style={{animationDuration: '10s'}} />
                                        <defs>
                                            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#8B5CF6" />
                                                <stop offset="100%" stopColor="#06B6D4" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                        <p className="text-center text-gray-700 font-medium">
                            🎯 Our games naturally develop these skills through fun challenges and interactive play!
                        </p>
                    </div>
                </section>

                {/* Contact Section */}
                <section data-section="contact" className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-purple-100 mb-8">
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-4 flex items-center justify-center gap-3">
                            <Mail className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                            Let's Connect!
                        </h2>
                        <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                            <p className="text-base md:text-lg leading-relaxed">
                                <strong>Got questions about our games? Ideas for new features?</strong> I'd love to hear from you! As a fellow parent and tech enthusiast, I'm always excited to chat about education, coding, or anything that sparks curiosity.
                            </p>
                            <p className="text-base md:text-lg leading-relaxed">
                                <strong>Need custom software development?</strong> Whether it's educational apps, business applications, mobile apps, AI-powered solutions, consulting services, or solving unique challenges with code, I'm here to help bring your digital dreams to life! From web platforms to intelligent automation and strategic technology guidance, let's build something amazing together. 🚀
                            </p>
                            
                            {/* Contact Button */}
                            <div className="pt-4">
                                <a
                                    href="mailto:ricardoalexanderh@gmail.com?subject=Hello from Semakin Pintar!"
                                    onClick={() => trackButtonClick('contact-ricardo', 'contact-section')}
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Mail className="w-5 h-5" />
                                    Say Hello to Ricardo Alexander
                                </a>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-4 italic">
                                Always happy to help! 😊
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center mb-8 text-purple-700/80">
                </footer>

                {/* Donate Section */}
                <section id="donate-section" className="mb-8">
                    <div className="bg-gradient-to-r from-purple-100 to-orange-100 rounded-3xl p-6 md:p-8 shadow-xl border border-purple-200 max-w-2xl mx-auto">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-4">☕️ Support Our Mission</h2>
                            <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed">
                                Your support helps me dedicate more time to creating educational games that make learning fun for families worldwide. Every contribution, no matter the size, helps keep this project growing!
                            </p>

                            {/* Donate Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">                                
                                {/* Buy Me a Coffee Button - Indonesia */}
                                <a
                                    href="https://saweria.co/semakinpintar"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackDonationClick('saweria')}
                                    className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 md:px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-orange-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
                                >
                                    ☕️ Buy Me a Coffee - Indonesia (Rp.)
                                </a>

                                {/* Buy Me a Coffee Button - International */}
                                <a
                                    href="https://ko-fi.com/semakinpintar"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackDonationClick('kofi')}
                                    className="bg-gradient-to-r from-red-400 to-pink-400 text-white px-4 md:px-6 py-3 rounded-xl font-bold hover:from-red-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
                                >
                                    ☕️ Buy Me a Coffee - International ($)
                                </a>
                            </div>

                            {/* Additional Message */}
                            <p className="text-xs md:text-sm text-gray-600 mt-4 italic">
                                Thank you for believing in educational technology that makes a difference! 🙏
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default LandingPage;