import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/landing-page';
import MentalArithmeticGame from './components/mental-arithmetic-game';
import MultiplicationTable from './components/multiplication-table';
import GamesIndex from './components/games-index';
import GamesLayout from './components/games-layout';
import SEOHead from './components/seo-head';
import { trackPageView, initGA } from './utils/analytics';
import './App.css';

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

function App() {
  useEffect(() => {
    // Initialize Google Analytics    
    initGA('G-X6GWD0Y9Y4');
  }, []);

  return (
    <Router>
      <PageTracker />
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<HomePage />} />
        
        {/* Games Routes */}
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
        
        {/* Redirect old routes for backward compatibility */}
        <Route path="/mental-arithmetic-game" element={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <p>Redirecting to new URL...</p>
            <script>{`window.location.href = '/games/mental-arithmetic';`}</script>
          </div>
        } />
        
        <Route path="/multiplication-table" element={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <p>Redirecting to new URL...</p>
            <script>{`window.location.href = '/games/multiplication-table';`}</script>
          </div>
        } />
        
        {/* 404 Page */}
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
    </Router>
  );
}

export default App;