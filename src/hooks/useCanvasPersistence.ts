
import { useRef, useEffect, useCallback } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { ObjectModificationHandlers } from './whiteboard/persistenceTypes';
import { useModificationQueue } from './whiteboard/useModificationQueue';
import { useCanvasEventHandlers } from './whiteboard/useCanvasEventHandlers';
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
    
    // Create event handlers
    const eventHandlers = useCanvasEventHandlers({
      onStateChange: (canvas) => handleObjectModified(canvas)
    });
    
    // Initialize state comparison
    eventHandlers.initializeStateComparison(canvas);
    
    // Attach optimized event handlers
    canvas.on('object:modified', () => eventHandlers.handleCanvasChanged(canvas));
    canvas.on('path:created', () => eventHandlers.handlePathCreated(canvas));
    canvas.on('mouse:down', () => eventHandlers.handleMouseDown(canvas));
    canvas.on('mouse:up', () => eventHandlers.handleMouseUp(canvas));
    canvas.on('object:removed', () => eventHandlers.handleObjectRemoved(canvas));
    canvas.on('object:added', eventHandlers.handleObjectAddedToCanvas);
    
    return () => {
      canvas.off('object:modified');
      canvas.off('path:created');
      canvas.off('mouse:down');
      canvas.off('mouse:up');
      canvas.off('object:removed');
      canvas.off('object:added');
      eventHandlers.cleanupTimeouts();
    };
  }, [id, handleObjectModified, fabricRef]);

  return { handleObjectAdded, handleObjectModified };
};
