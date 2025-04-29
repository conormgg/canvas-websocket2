
import { useRef, useEffect, useCallback } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { CanvasPersistenceUtils } from './whiteboard/canvasPersistenceUtils';
import { ObjectModificationHandlers } from './whiteboard/persistenceTypes';
import { useModificationQueue } from './whiteboard/useModificationQueue';
import { useCanvasStateComparison } from './whiteboard/useCanvasStateComparison';
import { useCanvasEventHandlers } from './whiteboard/useCanvasEventHandlers';

// Optimize by only sending the differences, but for now we'll just implement better debouncing
export const useCanvasPersistence = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  id: WhiteboardId,
  isTeacherView: boolean
): ObjectModificationHandlers => {
  const persistenceUtilsRef = useRef<CanvasPersistenceUtils>(new CanvasPersistenceUtils());
  const { queueModification } = useModificationQueue();
  const { hasStateChanged, setInitialState } = useCanvasStateComparison();
  
  // Queue a modification to save canvas state
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
    setInitialState(canvas);
    
    // Setup canvas event handlers
    const eventHandlers = useCanvasEventHandlers({
      onStateChange: (canvas) => handleObjectModified(canvas)
    });
    
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
      persistenceUtilsRef.current.clearTimeout();
      eventHandlers.cleanupTimeouts();
    };
  }, [id, handleObjectModified, fabricRef, setInitialState]);

  return { handleObjectAdded, handleObjectModified };
};
