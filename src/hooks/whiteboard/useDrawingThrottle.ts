
// Convert useDrawingThrottle from a hook to a non-hook module
export interface DrawingThrottleOptions {
  minUpdateInterval?: number;
}

// Create a factory function instead of a hook
export const createDrawingThrottle = (options: DrawingThrottleOptions = {}) => {
  const { minUpdateInterval = 500 } = options;
  
  let isDrawing = false;
  let pendingDrawUpdate = false;
  let lastUpdateTime = 0;
  let updateTimeout: number | null = null;
  
  const handleDrawingStart = () => {
    isDrawing = true;
  };
  
  const handleDrawingEnd = () => {
    isDrawing = false;
    
    // Clear any pending timeout
    if (updateTimeout !== null) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
    
    pendingDrawUpdate = false;
  };
  
  const shouldUpdateWhileDrawing = () => {
    if (!isDrawing || pendingDrawUpdate) return false;
    
    const now = Date.now();
    
    // Skip updates coming too quickly
    if (now - lastUpdateTime < minUpdateInterval) {
      return false;
    }
    
    pendingDrawUpdate = true;
    lastUpdateTime = now;
    
    // Clear existing timeout
    if (updateTimeout !== null) {
      clearTimeout(updateTimeout);
    }
    
    return true;
  };
  
  const scheduleUpdateAfterDrawing = (callback: () => void) => {
    // Wait until the user pauses drawing before saving
    updateTimeout = window.setTimeout(() => {
      callback();
      pendingDrawUpdate = false;
      updateTimeout = null;
    }, minUpdateInterval);
  };
  
  const cleanupTimeouts = () => {
    if (updateTimeout !== null) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
  };
  
  return {
    isDrawing: () => isDrawing,
    handleDrawingStart,
    handleDrawingEnd,
    shouldUpdateWhileDrawing,
    scheduleUpdateAfterDrawing,
    cleanupTimeouts
  };
};
