
import { useRef, useCallback } from 'react';

export interface DrawingThrottleOptions {
  minUpdateInterval?: number;
}

export const useDrawingThrottle = (options: DrawingThrottleOptions = {}) => {
  const { minUpdateInterval = 500 } = options;
  
  const isDrawing = useRef<boolean>(false);
  const pendingDrawUpdate = useRef<boolean>(false);
  const lastUpdateTime = useRef<number>(0);
  const updateTimeout = useRef<number | null>(null);
  
  const handleDrawingStart = useCallback(() => {
    isDrawing.current = true;
  }, []);
  
  const handleDrawingEnd = useCallback(() => {
    isDrawing.current = false;
    
    // Clear any pending timeout
    if (updateTimeout.current !== null) {
      clearTimeout(updateTimeout.current);
      updateTimeout.current = null;
    }
    
    pendingDrawUpdate.current = false;
  }, []);
  
  const shouldUpdateWhileDrawing = useCallback(() => {
    if (!isDrawing.current || pendingDrawUpdate.current) return false;
    
    const now = Date.now();
    
    // Skip updates coming too quickly
    if (now - lastUpdateTime.current < minUpdateInterval) {
      return false;
    }
    
    pendingDrawUpdate.current = true;
    lastUpdateTime.current = now;
    
    // Clear existing timeout
    if (updateTimeout.current !== null) {
      clearTimeout(updateTimeout.current);
    }
    
    return true;
  }, [minUpdateInterval]);
  
  const scheduleUpdateAfterDrawing = useCallback((callback: () => void) => {
    // Wait until the user pauses drawing before saving
    updateTimeout.current = window.setTimeout(() => {
      callback();
      pendingDrawUpdate.current = false;
      updateTimeout.current = null;
    }, minUpdateInterval);
  }, [minUpdateInterval]);
  
  const cleanupTimeouts = useCallback(() => {
    if (updateTimeout.current !== null) {
      clearTimeout(updateTimeout.current);
      updateTimeout.current = null;
    }
  }, []);
  
  return {
    isDrawing: () => isDrawing.current,
    handleDrawingStart,
    handleDrawingEnd,
    shouldUpdateWhileDrawing,
    scheduleUpdateAfterDrawing,
    cleanupTimeouts
  };
};
