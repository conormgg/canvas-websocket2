
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
  const lastUpdateTimeRef = useRef<number>(0);
  const MIN_UPDATE_INTERVAL = 300; // Minimum time between updates in ms

  const handleObjectModified = useCallback((canvas: Canvas) => {
    // Rate limit updates to prevent update storms
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < MIN_UPDATE_INTERVAL) {
      return; // Skip this update if it's too soon
    }
    lastUpdateTimeRef.current = now;
    
    persistenceUtilsRef.current.handleSyncedModification(canvas, id);
  }, [id]);

  const handleObjectAdded = useCallback((object: FabricObject) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Make sure the added object is selectable
    object.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true
    });
    
    // Rate limit updates
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < MIN_UPDATE_INTERVAL) {
      return; // Skip this update if it's too soon
    }
    lastUpdateTimeRef.current = now;
    
    persistenceUtilsRef.current.handleSyncedModification(canvas, id);
  }, [id, fabricRef]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Use a single handler for all canvas events to reduce event handler overhead
    const handleCanvasChanged = () => {
      handleObjectModified(canvas);
    };

    // Throttle events that might fire very rapidly
    let isDrawing = false;
    let pendingDrawUpdate = false;
    
    const handleDrawingEvents = () => {
      if (isDrawing && !pendingDrawUpdate) {
        pendingDrawUpdate = true;
        // Wait until the user pauses drawing before saving
        setTimeout(() => {
          handleCanvasChanged();
          pendingDrawUpdate = false;
        }, MIN_UPDATE_INTERVAL);
      }
    };

    const handlePathCreated = () => {
      console.log(`Path created on canvas ${id}, queuing save`);
      // Only save when drawing is finished, not during every path update
      handleCanvasChanged();
    };

    const handleMouseDown = () => {
      if (canvas.isDrawingMode) {
        isDrawing = true;
      }
    };

    const handleMouseUp = () => {
      if (canvas.isDrawingMode && isDrawing) {
        isDrawing = false;
        handleCanvasChanged();
      }
    };

    const handleObjectRemoved = () => {
      console.log(`Object removed from canvas ${id}, queuing save`);
      handleCanvasChanged();
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
    };
  }, [id, handleObjectModified, fabricRef]);

  return { handleObjectAdded, handleObjectModified };
};
