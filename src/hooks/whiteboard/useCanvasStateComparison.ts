import { Canvas } from 'fabric';
import { useCallback, useRef } from 'react';

/**
 * Hook for comparing canvas states to optimize persistence operations
 */
export const useCanvasStateComparison = () => {
  const lastSavedState = useRef<string | null>(null);

  /**
   * Check if the state is actually different before saving
   * Uses type assertion to fix TypeScript error while preserving functionality
   */
  const hasStateChanged = useCallback((canvas: Canvas): boolean => {
    try {
      // Use type assertion to fix TypeScript error while preserving functionality
      const currentState = JSON.stringify((canvas.toJSON as any)(['id']));
      
      // If state is unchanged, return false to skip save
      if (currentState === lastSavedState.current) {
        return false;
      }
      
      // Update the saved state and return true to indicate change
      lastSavedState.current = currentState;
      return true;
    } catch (err) {
      console.error('Error comparing canvas states:', err);
      // Default to saving if we can't compare
      return true;
    }
  }, []);

  /**
   * Set the initial state of the canvas to prevent unnecessary saves
   */
  const setInitialState = useCallback((canvas: Canvas) => {
    try {
      // Use type assertion to fix TypeScript error while preserving functionality
      lastSavedState.current = JSON.stringify((canvas.toJSON as any)(['id']));
    } catch (err) {
      console.error('Error capturing initial canvas state:', err);
    }
  }, []);

  /**
   * Force a state update to ensure next change will be saved
   */
  const forceStateUpdate = useCallback(() => {
    // Modify the saved state to force next comparison to detect a change
    if (lastSavedState.current) {
      try {
        const state = JSON.parse(lastSavedState.current);
        state.timestamp = Date.now(); // Add or update timestamp
        lastSavedState.current = JSON.stringify(state);
      } catch (err) {
        console.error('Error forcing state update:', err);
        lastSavedState.current = null;
      }
    }
  }, []);

  return {
    hasStateChanged,
    setInitialState,
    forceStateUpdate,
    getLastSavedState: () => lastSavedState.current
  };
};
