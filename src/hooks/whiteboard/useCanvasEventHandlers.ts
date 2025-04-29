import { Canvas, FabricObject } from 'fabric';
import { useCallback, useState, useRef } from 'react';
import { useDrawingThrottle } from './useDrawingThrottle';

// Extract the state comparison logic into a non-hook function
const compareCanvasStates = (() => {
  let lastSavedState: string | null = null;
  
  return {
    hasStateChanged: (canvas: Canvas): boolean => {
      try {
        // Use type assertion to fix TypeScript error while preserving functionality
        const currentState = JSON.stringify((canvas.toJSON as any)(['id']));
        
        // If state is unchanged, return false to skip save
        if (currentState === lastSavedState) {
          return false;
        }
        
        // Update the saved state and return true to indicate change
        lastSavedState = currentState;
        return true;
      } catch (err) {
        console.error('Error comparing canvas states:', err);
        // Default to saving if we can't compare
        return true;
      }
    },
    setInitialState: (canvas: Canvas) => {
      try {
        // Use type assertion to fix TypeScript error while preserving functionality
        lastSavedState = JSON.stringify((canvas.toJSON as any)(['id']));
      } catch (err) {
        console.error('Error capturing initial canvas state:', err);
      }
    },
    forceStateUpdate: () => {
      // Modify the saved state to force next comparison to detect a change
      if (lastSavedState) {
        try {
          const state = JSON.parse(lastSavedState);
          state.timestamp = Date.now(); // Add or update timestamp
          lastSavedState = JSON.stringify(state);
        } catch (err) {
          console.error('Error forcing state update:', err);
          lastSavedState = null;
        }
      }
    },
    getLastSavedState: () => lastSavedState
  };
})();

export interface CanvasEventOptions {
  onStateChange: (canvas: Canvas) => void;
}

export const useCanvasEventHandlers = ({ onStateChange }: CanvasEventOptions) => {
  const { 
    handleDrawingStart, 
    handleDrawingEnd, 
    shouldUpdateWhileDrawing, 
    scheduleUpdateAfterDrawing,
    cleanupTimeouts
  } = useDrawingThrottle({ minUpdateInterval: 500 });
  
  // Use the non-hook state comparison function
  const handleCanvasChanged = useCallback((canvas: Canvas) => {
    if (compareCanvasStates.hasStateChanged(canvas)) {
      onStateChange(canvas);
    }
  }, [onStateChange]);
  
  const handlePathCreated = useCallback((canvas: Canvas) => {
    console.log(`Path created on canvas, queuing save`);
    // Only save when drawing is finished, not during every path update
    if (compareCanvasStates.hasStateChanged(canvas)) {
      handleCanvasChanged(canvas);
    }
  }, [handleCanvasChanged]);
  
  const handleMouseDown = useCallback((canvas: Canvas) => {
    if (canvas.isDrawingMode) {
      handleDrawingStart();
    }
  }, [handleDrawingStart]);
  
  const handleMouseUp = useCallback((canvas: Canvas) => {
    if (canvas.isDrawingMode) {
      handleDrawingEnd();
      if (compareCanvasStates.hasStateChanged(canvas)) {
        handleCanvasChanged(canvas);
      }
    }
  }, [handleDrawingEnd, handleCanvasChanged]);
  
  const handleDrawingEvents = useCallback((canvas: Canvas) => {
    if (shouldUpdateWhileDrawing()) {
      scheduleUpdateAfterDrawing(() => {
        if (compareCanvasStates.hasStateChanged(canvas)) {
          handleCanvasChanged(canvas);
        }
      });
    }
  }, [shouldUpdateWhileDrawing, scheduleUpdateAfterDrawing, handleCanvasChanged]);
  
  const handleObjectRemoved = useCallback((canvas: Canvas) => {
    console.log(`Object removed from canvas, queuing save`);
    if (compareCanvasStates.hasStateChanged(canvas)) {
      handleCanvasChanged(canvas);
    }
  }, [handleCanvasChanged]);
  
  const handleObjectAddedToCanvas = useCallback((e: any) => {
    if (e.target) {
      e.target.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true
      });
    }
  }, []);
  
  // Initialize the state comparison on first render
  useCallback((canvas: Canvas) => {
    compareCanvasStates.setInitialState(canvas);
  }, []);
  
  return {
    handleCanvasChanged,
    handlePathCreated,
    handleMouseDown,
    handleMouseUp,
    handleDrawingEvents,
    handleObjectRemoved,
    handleObjectAddedToCanvas,
    cleanupTimeouts,
    initializeStateComparison: (canvas: Canvas) => {
      compareCanvasStates.setInitialState(canvas);
    }
  };
};
