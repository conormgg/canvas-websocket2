
import { useRef, useEffect, useCallback } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { CanvasPersistenceUtils } from './whiteboard/canvasPersistenceUtils';
import { ObjectModificationHandlers } from './whiteboard/persistenceTypes';

// Optimize by only sending the differences, but for now we'll just implement better debouncing
export const useCanvasPersistence = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  id: WhiteboardId,
  isTeacherView: boolean
): ObjectModificationHandlers => {
  const persistenceUtilsRef = useRef<CanvasPersistenceUtils>(new CanvasPersistenceUtils());
  const isProcessingModification = useRef<boolean>(false);
  const modificationQueue = useRef<Array<() => void>>([]);
  const lastSavedState = useRef<string | null>(null);
  
  // Process the next modification in queue
  const processNextModification = useCallback(() => {
    if (modificationQueue.current.length === 0) {
      isProcessingModification.current = false;
      return;
    }
    
    const nextModification = modificationQueue.current.shift();
    if (nextModification) {
      try {
        nextModification();
      } finally {
        // Schedule next processing with a small delay to prevent UI freeze
        setTimeout(processNextModification, 10);
      }
    } else {
      isProcessingModification.current = false;
    }
  }, []);

  // Queue a modification and process if not already processing
  const queueModification = useCallback((modification: () => void) => {
    modificationQueue.current.push(modification);
    
    if (!isProcessingModification.current) {
      isProcessingModification.current = true;
      // Remove argument when calling processNextModification
      processNextModification();
    }
  }, [processNextModification]);

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

  const handleObjectModified = useCallback((canvas: Canvas) => {
    // Skip if no actual change happened
    if (!hasStateChanged(canvas)) {
      console.log(`Skipping save - no change detected on ${id}`);
      return;
    }
    
    queueModification(() => {
      persistenceUtilsRef.current.handleSyncedModification(canvas, id);
    });
  }, [id, queueModification, hasStateChanged]);

  const handleObjectAdded = useCallback((object: FabricObject) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Skip if no actual change happened
    if (!hasStateChanged(canvas)) {
      console.log(`Skipping save after add - no change detected on ${id}`);
      return;
    }
    
    queueModification(() => {
      // Make sure the added object is selectable
      object.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true
      });
      
      persistenceUtilsRef.current.handleSyncedModification(canvas, id);
    });
  }, [id, fabricRef, queueModification, hasStateChanged]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Initial state snapshot
    try {
      // Use type assertion to fix TypeScript error while preserving functionality
      lastSavedState.current = JSON.stringify((canvas.toJSON as any)(['id']));
    } catch (err) {
      console.error('Error capturing initial canvas state:', err);
    }
    
    // Use a single handler for all canvas events to reduce event handler overhead
    const handleCanvasChanged = () => {
      handleObjectModified(canvas);
    };

    // Throttle events that might fire very rapidly
    let isDrawing = false;
    let pendingDrawUpdate = false;
    let lastUpdateTime = 0;
    let updateTimeout: number | null = null;
    const MIN_UPDATE_INTERVAL = 500; // Increase to 500ms to reduce frequency
    
    const handleDrawingEvents = () => {
      if (isDrawing && !pendingDrawUpdate) {
        const now = Date.now();
        
        // Skip updates coming too quickly
        if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
          return;
        }
        
        pendingDrawUpdate = true;
        lastUpdateTime = now;
        
        // Clear existing timeout
        if (updateTimeout !== null) {
          clearTimeout(updateTimeout);
        }
        
        // Wait until the user pauses drawing before saving
        updateTimeout = window.setTimeout(() => {
          if (hasStateChanged(canvas)) {
            handleCanvasChanged();
          }
          pendingDrawUpdate = false;
          updateTimeout = null;
        }, MIN_UPDATE_INTERVAL);
      }
    };

    const handlePathCreated = () => {
      console.log(`Path created on canvas ${id}, queuing save`);
      // Only save when drawing is finished, not during every path update
      if (hasStateChanged(canvas)) {
        handleCanvasChanged();
      }
    };

    const handleMouseDown = () => {
      if (canvas.isDrawingMode) {
        isDrawing = true;
      }
    };

    const handleMouseUp = () => {
      if (canvas.isDrawingMode && isDrawing) {
        isDrawing = false;
        if (hasStateChanged(canvas)) {
          handleCanvasChanged();
        }
      }
    };

    const handleObjectRemoved = () => {
      console.log(`Object removed from canvas ${id}, queuing save`);
      if (hasStateChanged(canvas)) {
        handleCanvasChanged();
      }
    };
    
    const handleObjectAddedToCanvas = (e: any) => {
      if (e.target) {
        e.target.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true
        });
      }
    };
    
    // Attach optimized event handlers
    canvas.on('object:modified', handleCanvasChanged);
    canvas.on('path:created', handlePathCreated);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('object:added', handleObjectAddedToCanvas);
    
    return () => {
      canvas.off('object:modified', handleCanvasChanged);
      canvas.off('path:created', handlePathCreated);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:added', handleObjectAddedToCanvas);
      persistenceUtilsRef.current.clearTimeout();
      
      // Clear any pending timeouts
      if (updateTimeout !== null) {
        clearTimeout(updateTimeout);
      }
    };
  }, [id, handleObjectModified, fabricRef, hasStateChanged]);

  return { handleObjectAdded, handleObjectModified };
};
