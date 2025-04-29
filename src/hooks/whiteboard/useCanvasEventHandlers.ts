
import { Canvas, FabricObject } from 'fabric';
import { useCallback } from 'react';
import { useDrawingThrottle } from './useDrawingThrottle';
import { useCanvasStateComparison } from './useCanvasStateComparison';

export interface CanvasEventOptions {
  onStateChange: (canvas: Canvas) => void;
}

export const useCanvasEventHandlers = ({ onStateChange }: CanvasEventOptions) => {
  const { hasStateChanged } = useCanvasStateComparison();
  const { 
    handleDrawingStart, 
    handleDrawingEnd, 
    shouldUpdateWhileDrawing, 
    scheduleUpdateAfterDrawing,
    cleanupTimeouts
  } = useDrawingThrottle({ minUpdateInterval: 500 });
  
  const handleCanvasChanged = useCallback((canvas: Canvas) => {
    if (hasStateChanged(canvas)) {
      onStateChange(canvas);
    }
  }, [hasStateChanged, onStateChange]);
  
  const handlePathCreated = useCallback((canvas: Canvas) => {
    console.log(`Path created on canvas, queuing save`);
    // Only save when drawing is finished, not during every path update
    if (hasStateChanged(canvas)) {
      handleCanvasChanged(canvas);
    }
  }, [hasStateChanged, handleCanvasChanged]);
  
  const handleMouseDown = useCallback((canvas: Canvas) => {
    if (canvas.isDrawingMode) {
      handleDrawingStart();
    }
  }, [handleDrawingStart]);
  
  const handleMouseUp = useCallback((canvas: Canvas) => {
    if (canvas.isDrawingMode) {
      handleDrawingEnd();
      if (hasStateChanged(canvas)) {
        handleCanvasChanged(canvas);
      }
    }
  }, [handleDrawingEnd, hasStateChanged, handleCanvasChanged]);
  
  const handleDrawingEvents = useCallback((canvas: Canvas) => {
    if (shouldUpdateWhileDrawing()) {
      scheduleUpdateAfterDrawing(() => {
        if (hasStateChanged(canvas)) {
          handleCanvasChanged(canvas);
        }
      });
    }
  }, [shouldUpdateWhileDrawing, scheduleUpdateAfterDrawing, hasStateChanged, handleCanvasChanged]);
  
  const handleObjectRemoved = useCallback((canvas: Canvas) => {
    console.log(`Object removed from canvas, queuing save`);
    if (hasStateChanged(canvas)) {
      handleCanvasChanged(canvas);
    }
  }, [hasStateChanged, handleCanvasChanged]);
  
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
  
  return {
    handleCanvasChanged,
    handlePathCreated,
    handleMouseDown,
    handleMouseUp,
    handleDrawingEvents,
    handleObjectRemoved,
    handleObjectAddedToCanvas,
    cleanupTimeouts
  };
};
