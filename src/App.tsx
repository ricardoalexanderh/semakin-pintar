import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/landing-page';
import MentalArithmeticGame from './components/mental-arithmetic-game';
import MentalDivisionGame from './components/mental-division-game';
import MentalMultiplicationGame from './components/mental-multiplication-game';
import MultiplicationTable from './components/multiplication-table';
import GamesIndex from './components/games-index';
import GamesLayout from './components/games-layout';
import SEOHead from './components/seo-head';
import { trackPageView, initGA, setupPWAAnalytics } from './utils/analytics';
import './App.css';
import PWARouteHandler from './components/pwa-route-handler';
import InstallBanner from './components/install-banner';
import UpdateNotification from './components/update-notification';
import OfflineStatus from './components/offline-status';
import PatternsDetectiveGame from './components/patterns-detective';
import RocketMathGame from './components/rocket-math/rocket-math';
import { MathchaCafe } from './components/mathcha-cafe';
import MathDropGame from './components/math-drop';
import SortAttack from './components/sort-attack';
import MathFlipGame from './components/math-flip';

// Component to handle page tracking and SEO
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    trackPageView(location.pathname);

    // Scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location]);

  return null;
};

// Home page component with SEO
const HomePage = () => {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Semakin Pintar",
    "description": "Free educational games platform featuring mental arithmetic, multiplication tables, and brain training games",
    "url": "https://www.semakinpintar.com",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  };

  return (
    <>
      <SEOHead
        title="Semakin Pintar - Free Educational Games for Kids & Family Learning"
        description="Free educational games platform featuring mental arithmetic, multiplication tables, and brain training games. Perfect for kids learning math and families practicing together."
        keywords="educational games, mental math, multiplication table, kids learning, brain training, math practice, cognitive skills, family learning, free educational apps, children education"
        canonicalUrl="https://www.semakinpintar.com"
        ogTitle="Semakin Pintar - Free Educational Games for Kids & Family Learning"
        ogDescription="Free educational games platform featuring mental arithmetic, multiplication tables, and brain training games. Perfect for kids learning math and families practicing together."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={websiteJsonLd}
      />
      <LandingPage />
    </>
  );
};

// Games Index page with SEO
const GamesIndexPage = () => {
  const gamesJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Educational Games Collection",
    "description": "Discover our collection of free educational games including mental arithmetic, multiplication tables, and brain training games.",
    "url": "https://www.semakinpintar.com/games",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "Game",
          "position": 1,
          "name": "Mental Arithmetic Game",
          "url": "https://www.semakinpintar.com/games/mental-arithmetic"
        },
        {
          "@type": "Game",
          "position": 2,
          "name": "Multiplication Table",
          "url": "https://www.semakinpintar.com/games/multiplication-table"
        },
        {
          "@type": "Game",
          "position": 3,
          "name": "Mental Division Game",
          "url": "https://www.semakinpintar.com/games/mental-division"
        },
        {
          "@type": "Game",
          "position": 4,
          "name": "Mental Multiplication Game",
          "url": "https://www.semakinpintar.com/games/mental-multiplication"
        },
        {
          "@type": "Game",
          "position": 5,
          "name": "Patterns Detective Game",
          "url": "https://www.semakinpintar.com/games/patterns-detective"
        },
        {
          "@type": "Game",
          "position": 6,
          "name": "Rocket Math Game",
          "url": "https://www.semakinpintar.com/games/rocket-math"
        },
        {
          "@type": "Game",
          "position": 7,
          "name": "Mathca Cafe Game",
          "url": "https://www.semakinpintar.com/games/mathcha-cafe"
        },
        {
          "@type": "Game",
          "position": 8,
          "name": "Math Drop Game",
          "url": "https://www.semakinpintar.com/games/math-drop"
        },
        {
          "@type": "Game",
          "position": 9,
          "name": "Sort Attack",
          "url": "https://www.semakinpintar.com/games/sort-attack"
        }
      ]
    }
  };

  return (
    <>
      <SEOHead
        title="Semakin Pintar | Educational Games Collection - Free Learning Games"
        description="Discover our collection of educational games including mental arithmetic, multiplication tables, and brain training games. Perfect for kids and families learning together."
        keywords="educational games collection, math games, learning games, kids education, brain training, mental arithmetic, multiplication table"
        canonicalUrl="https://www.semakinpintar.com/games"
        ogTitle="Semakin Pintar | Educational Games Collection - Free Learning Games"
        ogDescription="Discover our collection of free educational games including mental arithmetic, multiplication tables, and brain training games."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gamesJsonLd}
      />
      <GamesIndex />
    </>
  );
};

// Mental Arithmetic Game page with SEO
const MentalArithmeticPage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Mental Arithmetic Game",
    "description": "Train your brain with fun mental arithmetic calculations. Improve cognitive skills through progressive difficulty levels.",
    "url": "https://www.semakinpintar.com/games/mental-arithmetic",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEOHead
        title="Mental Arithmetic Game - Brain Training & Math Practice | Semakin Pintar"
        description="Train your brain with our free mental arithmetic game. Progressive difficulty levels, customizable settings, and speech support. Perfect for kids and adults learning math."
        keywords="mental arithmetic, brain training, math practice, cognitive skills, mental math game, arithmetic training, educational games, kids math"
        canonicalUrl="https://www.semakinpintar.com/games/mental-arithmetic"
        ogTitle="Mental Arithmetic Game - Brain Training & Math Practice"
        ogDescription="Train your brain with our free mental arithmetic game. Progressive difficulty levels and customizable settings."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <MentalArithmeticGame />
    </>
  );
};

// Multiplication Table page with SEO  
const MultiplicationTablePage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Multiplication Table",
    "description": "Interactive multiplication table from 1x1 to 10x10. Track progress, unlock achievements, and memorize multiplication facts.",
    "url": "https://www.semakinpintar.com/games/multiplication-table",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEOHead
        title="Multiplication Table 1-10 - Interactive Learning Tool | Semakin Pintar"
        description="Master multiplication tables with our interactive tool. Track progress, unlock achievements, and memorize facts from 1x1 to 10x10. Perfect for kids learning multiplication."
        keywords="multiplication table, times table, multiplication facts, kids multiplication, math memorization, interactive multiplication, learning multiplication"
        canonicalUrl="https://www.semakinpintar.com/games/multiplication-table"
        ogTitle="Multiplication Table 1-10 - Interactive Learning Tool"
        ogDescription="Master multiplication tables with our interactive tool. Track progress and unlock achievements."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <MultiplicationTable />
    </>
  );
};

// Mental Division Game page with SEO
const MentalDivisionPage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Mental Division Game",
    "description": "Train your brain with fun mental division calculations. Improve cognitive skills through progressive difficulty levels.",
    "url": "https://www.semakinpintar.com/games/mental-division",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEOHead
        title="Mental Division Game - Brain Training & Math Practice | Semakin Pintar"
        description="Train your brain with our free mental division game. Progressive difficulty levels, customizable settings, and speech support. Perfect for kids and adults learning math."
        keywords="mental division, brain training, math practice, cognitive skills, mental math game, arithmetic training, educational games, kids math"
        canonicalUrl="https://www.semakinpintar.com/games/mental-division"
        ogTitle="Mental Division Game - Brain Training & Math Practice"
        ogDescription="Train your brain with our free mental division game. Progressive difficulty levels and customizable settings."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <MentalDivisionGame />
    </>
  );
};

// Mental Division Game page with SEO
const MentalMultiplicationPage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Mental Division Game",
    "description": "Train your brain with fun mental multiplication calculations. Improve cognitive skills through progressive difficulty levels.",
    "url": "https://www.semakinpintar.com/games/mental-multiplication",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEOHead
        title="Mental Division Game - Brain Training & Math Practice | Semakin Pintar"
        description="Train your brain with our free mental multiplication game. Progressive difficulty levels, customizable settings, and speech support. Perfect for kids and adults learning math."
        keywords="mental multiplication, brain training, math practice, cognitive skills, mental math game, arithmetic training, educational games, kids math"
        canonicalUrl="https://www.semakinpintar.com/games/mental-multiplication"
        ogTitle="Mental Division Game - Brain Training & Math Practice"
        ogDescription="Train your brain with our free mental multiplication game. Progressive difficulty levels and customizable settings."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <MentalMultiplicationGame />
    </>
  );
};

// Rocket Math Game page with SEO
const RocketMathPage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Rocket Math Game",
    "description": "Space-themed math adventure game combining rocket navigation with mental arithmetic practice. Fly through space while solving math problems.",
    "url": "https://www.semakinpintar.com/games/rocket-math",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEOHead
        title="Rocket Math Game - Space Math Adventure & Brain Training | Semakin Pintar"
        description="Space-themed math adventure game! Fly your rocket through space while solving math problems. Navigate through asteroid fields with mental arithmetic practice."
        keywords="rocket math, space math game, math adventure, mental arithmetic, brain training, educational games, kids math, space game, flying game"
        canonicalUrl="https://www.semakinpintar.com/games/rocket-math"
        ogTitle="Rocket Math Game - Space Math Adventure & Brain Training"
        ogDescription="Space-themed math adventure game! Fly your rocket through space while solving math problems."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <RocketMathGame />
    </>
  );
};

// Patterns Detective Game page with SEO
const PatternsDetectivePage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Patterns Detective Game",
    "description": "Train computational thinking skills through pattern recognition. Improve logical reasoning and problem-solving abilities with progressive difficulty levels.",
    "url": "https://www.semakinpintar.com/games/patterns-detective",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
  
  return (
    <>
      <SEOHead
        title="Patterns Detective Game - Computational Thinking & Pattern Recognition | Semakin Pintar"
        description="Train your computational thinking with our free patterns detective game. Develop pattern recognition, logical reasoning, and problem-solving skills through interactive gameplay."
        keywords="pattern recognition, computational thinking, logical reasoning, problem solving, educational games, kids learning, math patterns, sequence games, brain training"
        canonicalUrl="https://www.semakinpintar.com/games/patterns-detective"
        ogTitle="Patterns Detective Game - Computational Thinking & Pattern Recognition"
        ogDescription="Train your computational thinking with our free patterns detective game. Develop pattern recognition and logical reasoning skills."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <PatternsDetectiveGame />
    </>
  );
};

// Mathcha Cafe Game page with SEO
const MathchaCafePage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Mathcha Cafe Game",
    "description": "Serve customers by solving math problems in this cafe-themed educational game. Practice addition, subtraction, budgeting, and discounts.",
    "url": "https://www.semakinpintar.com/games/mathcha-cafe",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
  
  return (
    <>
      <SEOHead
        title="Mathcha Cafe Game - Math Cafe Management & Problem Solving | Semakin Pintar"
        description="Run a math cafe! Serve customers by solving addition, subtraction, budgeting, and discount problems. Fun educational game with progressive difficulty levels."
        keywords="mathcha cafe, math cafe game, cafe math, addition subtraction, budgeting math, discount problems, educational games, kids math, restaurant math"
        canonicalUrl="https://www.semakinpintar.com/games/mathcha-cafe"
        ogTitle="Mathcha Cafe Game - Math Cafe Management & Problem Solving"
        ogDescription="Run a math cafe! Serve customers by solving addition, subtraction, budgeting, and discount problems."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <MathchaCafe />
    </>
  );
};

// Math Flip Game page with SEO
const MathFlipPage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Math Flip Game",
    "description": "Educational card-matching game where players flip cards to pair math equations with their correct answers. Race against a shared countdown timer across multiple rounds.",
    "url": "https://www.semakinpintar.com/games/math-flip",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEOHead
        title="Math Flip Game - Card Matching Math Puzzle | Semakin Pintar"
        description="Flip cards to match math equations with their answers! Race against a countdown timer across multiple rounds. Progressive difficulty with addition, multiplication, division, and more."
        keywords="math flip, card matching game, math equations, educational card game, memory game math, math puzzle, kids math game, equation matching"
        canonicalUrl="https://www.semakinpintar.com/games/math-flip"
        ogTitle="Math Flip Game - Card Matching Math Puzzle"
        ogDescription="Flip cards to match math equations with their answers! Race against a countdown timer across multiple rounds."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <MathFlipGame />
    </>
  );
};

// Math Drop Game page with SEO
const MathDropPage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Math Drop Game",
    "description": "Puyo Puyo-style puzzle game with math equations. Match colors, numbers, and solve equations to clear pieces and level up.",
    "url": "https://www.semakinpintar.com/games/math-drop",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
  
  return (
    <>
      <SEOHead
        title="Math Drop Game - Puzzle Math & Equation Solving | Semakin Pintar"
        description="Play our Puyo Puyo-style math puzzle game! Match colors, numbers, and solve equations to clear pieces. Progressive difficulty with special power-ups and chain reactions."
        keywords="math drop, puzzle math, equation solving, math puzzle game, puyo puyo math, number matching, color matching, brain training, educational puzzle"
        canonicalUrl="https://www.semakinpintar.com/games/math-drop"
        ogTitle="Math Drop Game - Puzzle Math & Equation Solving"
        ogDescription="Play our Puyo Puyo-style math puzzle game! Match colors, numbers, and solve equations to clear pieces."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <MathDropGame />
    </>
  );
};

// Sort Attack page with SEO
const SortAttackPage = () => {
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "Sort Attack",
    "description": "Sort scrambled numbers using only adjacent swaps. Race the clock to complete rounds, minimize your moves, and use hints wisely.",
    "url": "https://www.semakinpintar.com/games/sort-attack",
    "genre": "Educational",
    "gamePlatform": "Web Browser",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEOHead
        title="Sort Attack - Logic Sorting Puzzle Game | Semakin Pintar"
        description="Sort scrambled numbers using only adjacent swaps. Race the clock, minimize your moves, and use hints wisely. A fast-paced logic and algorithmic thinking challenge!"
        keywords="sorting puzzle, logic game, algorithm thinking, brain training, adjacent swaps, number sorting, sorting algorithm, educational games, kids logic, puzzle game"
        canonicalUrl="https://www.semakinpintar.com/games/sort-attack"
        ogTitle="Sort Attack - Logic Sorting Puzzle Game"
        ogDescription="Sort scrambled numbers using only adjacent swaps. Race the clock and keep the timer alive by completing rounds."
        ogImage="https://www.semakinpintar.com/logo.png"
        jsonLd={gameJsonLd}
      />
      <SortAttack />
    </>
  );
};

function App() {
  useEffect(() => {
    // Initialize Google Analytics    
    initGA('G-X6GWD0Y9Y4');
    
    // Setup all PWA analytics tracking - this handles all PWA events
    const cleanupPWAAnalytics = setupPWAAnalytics();

    // Return cleanup function
    return cleanupPWAAnalytics;
  }, []);

  return (
    <Router>
      <PWARouteHandler defaultRoute="/games">
        <PageTracker />
        
        {/* PWA Components */}
        <OfflineStatus />
        <UpdateNotification />        
        <InstallBanner />
        
        {/* Your existing Routes component */}
        <Routes>
          {/* All your existing routes remain exactly the same */}
          <Route path="/" element={<HomePage />} />
          <Route path="/games" element={<GamesIndexPage />} />
          <Route path="/games/mental-arithmetic" element={
            <GamesLayout>
              <MentalArithmeticPage />
            </GamesLayout>
          } />
          <Route path="/games/multiplication-table" element={
            <GamesLayout>
              <MultiplicationTablePage />
            </GamesLayout>
          } />  
          <Route path="/games/mental-division" element={
            <GamesLayout>
              <MentalDivisionPage />
            </GamesLayout>
          } />     
          <Route path="/games/mental-multiplication" element={
            <GamesLayout>
              <MentalMultiplicationPage />
            </GamesLayout>
          } />   
          <Route path="/games/patterns-detective" element={
            <GamesLayout>
              <PatternsDetectivePage />
            </GamesLayout>
          } />
          <Route path="/games/rocket-math" element={
            <GamesLayout>
              <RocketMathPage />
            </GamesLayout>
          } />
          <Route path="/games/mathcha-cafe" element={
            <GamesLayout>
              <MathchaCafePage />
            </GamesLayout>
          } />
          <Route path="/games/math-drop" element={
            <GamesLayout>
              <MathDropPage />
            </GamesLayout>
          } />
          <Route path="/games/sort-attack" element={
            <GamesLayout>
              <SortAttackPage />
          <Route path="/games/math-flip" element={
            <GamesLayout>
              <MathFlipPage />
            </GamesLayout>
          } />
          <Route path="*" element={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/" style={{ color: '#8B5CF6', textDecoration: 'underline' }}>
                Go back to home
              </a>
            </div>
          } />
        </Routes>
      </PWARouteHandler>
    </Router>
  );
}

export default App;