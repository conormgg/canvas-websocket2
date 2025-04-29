
import { Canvas } from 'fabric';
import { useCallback, useRef } from 'react';

export const useCanvasStateHash = () => {
  const lastSavedStateHashRef = useRef<string>('');
  
  // Function to generate a simple hash of the canvas state
  const generateCanvasStateHash = useCallback((canvas: Canvas): string => {
    try {
      const objects = canvas.getObjects();
      return `${objects.length}-${Date.now()}`;
    } catch (err) {
      return Date.now().toString();
    }
  }, []);
  
  const isStateChanged = useCallback((canvas: Canvas): boolean => {
    const stateHash = generateCanvasStateHash(canvas);
    return stateHash !== lastSavedStateHashRef.current;
  }, [generateCanvasStateHash]);
  
  const updateStateHash = useCallback((canvas: Canvas): void => {
    lastSavedStateHashRef.current = generateCanvasStateHash(canvas);
  }, [generateCanvasStateHash]);
  
  return {
    lastSavedStateHashRef,
    generateCanvasStateHash,
    isStateChanged,
    updateStateHash
  };
};
