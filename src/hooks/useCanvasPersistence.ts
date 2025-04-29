
import { useRef, useEffect, useCallback } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { ObjectModificationHandlers } from './whiteboard/persistenceTypes';
import { useModificationQueue } from './whiteboard/useModificationQueue';
import { createDrawingThrottle } from './whiteboard/useDrawingThrottle';
import { useCanvasPersistenceManager } from './whiteboard/useCanvasPersistenceManager';

/**
 * Hook for handling canvas object modifications and persistence
 */
export const useCanvasPersistence = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  id: WhiteboardId,
  isTeacherView: boolean
): ObjectModificationHandlers => {
  const { queueModification } = useModificationQueue();
  const { saveCanvasState } = useCanvasPersistenceManager(id, isTeacherView);
  
  // Queue a modification to save canvas state
  const handleObjectModified = useCallback((canvas: Canvas) => {
    queueModification(() => {
      saveCanvasState(canvas);
    });
  }, [id, queueModification, saveCanvasState]);

  const handleObjectAdded = useCallback((object: FabricObject) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    queueModification(() => {
      // Make sure the added object is selectable
      object.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true
      });
      
      saveCanvasState(canvas);
    });
  }, [id, fabricRef, queueModification, saveCanvasState]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Create event handlers - using the non-hook implementation
    const drawingThrottle = createDrawingThrottle();
    
    // Track the previous state to detect changes
    let previousState = "";
    
    // Initialize state comparison
    const initializeStateComparison = () => {
      try {
        if (canvas) {
          previousState = JSON.stringify((canvas.toJSON as any)());
        }
      } catch (err) {
        console.error("Error initializing canvas state:", err);
      }
    };
    
    // Check if the canvas state has changed
    const hasStateChanged = () => {
      try {
        if (!canvas) return false;
        
        const currentState = JSON.stringify((canvas.toJSON as any)());
        const hasChanged = currentState !== previousState;
        
        if (hasChanged) {
          previousState = currentState;
        }
        
        return hasChanged;
      } catch (err) {
        console.error("Error comparing canvas states:", err);
        return true; // Assume changed on error to be safe
      }
    };
    
    // Handle canvas changes
    const handleCanvasChanged = () => {
      if (hasStateChanged()) {
        handleObjectModified(canvas);
      }
    };
    
    // Initialize state comparison
    initializeStateComparison();
    
    // Handle path creation
    const handlePathCreated = () => {
      if (drawingThrottle.shouldUpdateWhileDrawing()) {
        handleObjectModified(canvas);
        drawingThrottle.scheduleUpdateAfterDrawing(() => {
          handleObjectModified(canvas);
        });
      }
    };
    
    // Handle mouse events
    const handleMouseDown = () => {
      drawingThrottle.handleDrawingStart();
    };
    
    const handleMouseUp = () => {
      drawingThrottle.handleDrawingEnd();
      // Always save changes on mouse up
      handleCanvasChanged();
    };
    
    // Handle object removals
    const handleObjectRemoved = () => {
      handleCanvasChanged();
    };
    
    // Handle object additions
    const handleObjectAddedToCanvas = (e: any) => {
      if (e.target) {
        handleObjectAdded(e.target);
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
      canvas.off('object:modified');
      canvas.off('path:created');
      canvas.off('mouse:down');
      canvas.off('mouse:up');
      canvas.off('object:removed');
      canvas.off('object:added');
      drawingThrottle.cleanupTimeouts();
    };
  }, [id, handleObjectModified, handleObjectAdded, fabricRef]);

  return { handleObjectAdded, handleObjectModified };
};
