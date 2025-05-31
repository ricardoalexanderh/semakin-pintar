import { useEffect, useState } from 'react';
import LandingPage from './components/landing-page';
import MentalArithmeticGame from './components/mental-arithmetic-game';
import MultiplicationTable from './components/multiplication-table';
import './App.css';

type AppState = 'landing-page' | 'mental-arithmetic-game' | 'multiplication-table';

function App() {
  const [currentView, setCurrentView] = useState<AppState>('landing-page');

  const handleGameSelect = (gameId: string) => {
    if (gameId === 'mental-arithmetic-game') {
      setCurrentView('mental-arithmetic-game');
    } else if (gameId === 'multiplication-table') {
      setCurrentView('multiplication-table');
    }
  };

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleBackToHome = () => {
    setCurrentView('landing-page');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'mental-arithmetic-game':
        return <MentalArithmeticGame onBackToHome={handleBackToHome} />;
      case 'multiplication-table':
        return <MultiplicationTable onBackToHome={handleBackToHome} />;
      case 'landing-page':
      default:
        return <LandingPage onGameSelect={handleGameSelect} />;
    }
  };

  return (
    <>
      {renderCurrentView()}
    </>
  );
}

export default App;