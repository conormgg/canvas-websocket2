
import { Canvas } from 'fabric';
import { useCallback, useRef } from 'react';

export const useCanvasStateComparison = () => {
  const lastSavedState = useRef<string | null>(null);

  // Check if the state is actually different before saving
  const hasStateChanged = useCallback((canvas: Canvas): boolean => {
    try {
      // Use type assertion to fix TypeScript error while preserving functionality
      const currentState = JSON.stringify((canvas.toJSON as any)(['id']));
      if (currentState === lastSavedState.current) {
        return false;
      }
      lastSavedState.current = currentState;
      return true;
    } catch (err) {
      console.error('Error comparing canvas states:', err);
      return true; // Default to saving if we can't compare
    }
  }, []);

  const setInitialState = useCallback((canvas: Canvas) => {
    try {
      // Use type assertion to fix TypeScript error while preserving functionality
      lastSavedState.current = JSON.stringify((canvas.toJSON as any)(['id']));
    } catch (err) {
      console.error('Error capturing initial canvas state:', err);
    }
  }, []);

  return {
    hasStateChanged,
    setInitialState,
    getLastSavedState: () => lastSavedState.current
  };
};
