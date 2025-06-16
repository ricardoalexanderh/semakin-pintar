import { useEffect, useState, useCallback } from 'react';

export interface GameStateEvent {
  gameId: string;
  isPlaying: boolean;
}

// Custom hook for managing global game state
export const useGameState = () => {
  const [gameStates, setGameStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleGameStateChange = (event: CustomEvent<GameStateEvent>) => {
      const { gameId, isPlaying } = event.detail;
      setGameStates(prev => ({
        ...prev,
        [gameId]: isPlaying
      }));
    };

    window.addEventListener('gameStateChange', handleGameStateChange as EventListener);
    
    return () => {
      window.removeEventListener('gameStateChange', handleGameStateChange as EventListener);
    };
  }, []);

  const updateGameState = useCallback((gameId: string, isPlaying: boolean) => {
    const event = new CustomEvent<GameStateEvent>('gameStateChange', {
      detail: { gameId, isPlaying }
    });
    window.dispatchEvent(event);
  }, []);

  const isAnyGamePlaying = useCallback(() => {
    return Object.values(gameStates).some(isPlaying => isPlaying);
  }, [gameStates]);

  return {
    gameStates,
    updateGameState,
    isAnyGamePlaying
  };
};