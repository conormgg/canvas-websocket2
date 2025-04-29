
import { useRef, useEffect } from 'react';
import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { CanvasPersistenceUtils } from './whiteboard/canvasPersistenceUtils';
import { ObjectModificationHandlers } from './whiteboard/persistenceTypes';
import { useUpdateThrottling } from './whiteboard/persistence/updateThrottler';
import { useCanvasStateHash } from './whiteboard/persistence/canvasStateHash';
import { createObjectHandlers } from './whiteboard/persistence/objectHandlers';

export const useCanvasPersistence = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  id: WhiteboardId,
  isTeacherView: boolean
): ObjectModificationHandlers => {
  const persistenceUtilsRef = useRef<CanvasPersistenceUtils>(new CanvasPersistenceUtils());
  const MIN_UPDATE_INTERVAL = 800; // Increased minimum time between updates in ms
  
  // Get throttling helpers
  const {
    mountedRef,
    shouldThrottleUpdate,
    scheduleUpdate,
    recordUpdate,
    pendingModificationsRef
  } = useUpdateThrottling({ minUpdateInterval: MIN_UPDATE_INTERVAL });
  
  // Get state hash helpers
  const {
    generateCanvasStateHash,
    isStateChanged,
    updateStateHash
  } = useCanvasStateHash();
  
  // Create object handlers
  const { handleObjectAdded, handleObjectModified } = createObjectHandlers({
    fabricRef,
    boardId: id,
    persistenceUtils: persistenceUtilsRef.current,
    isStateChanged,
    updateStateHash,
    shouldThrottleUpdate,
    scheduleUpdate,
    recordUpdate
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      persistenceUtilsRef.current.clearTimeout();
    };
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !mountedRef.current) return;
    
    // Use a single handler for all canvas events to reduce event handler overhead
    const handleCanvasChanged = () => {
      if (!mountedRef.current) return;
      pendingModificationsRef.current = true;
      handleObjectModified(canvas);
    };

    // Throttle events that might fire very rapidly
    let isDrawing = false;
    let pendingDrawUpdate = false;
    
    const handleDrawingEvents = () => {
      if (!mountedRef.current) return;
      
      if (isDrawing && !pendingDrawUpdate) {
        pendingDrawUpdate = true;
        pendingModificationsRef.current = true;
        // Wait until the user pauses drawing before saving
        setTimeout(() => {
          if (mountedRef.current) {
            handleCanvasChanged();
            pendingDrawUpdate = false;
          }
        }, MIN_UPDATE_INTERVAL);
      }
    };

    const handlePathCreated = () => {
      if (!mountedRef.current) return;
      
      console.log(`Path created on canvas ${id}, queuing save`);
      pendingModificationsRef.current = true;
      // Only save when drawing is finished, not during every path update
      handleCanvasChanged();
    };

    const handleMouseDown = () => {
      if (!mountedRef.current) return;
      
      if (canvas.isDrawingMode) {
        isDrawing = true;
      }
    };

    const handleMouseUp = () => {
      if (!mountedRef.current) return;
      
      if (canvas.isDrawingMode && isDrawing) {
        isDrawing = false;
        pendingModificationsRef.current = true;
        handleCanvasChanged();
      }
    };

    const handleObjectRemoved = () => {
      if (!mountedRef.current) return;
      
      console.log(`Object removed from canvas ${id}, queuing save`);
      pendingModificationsRef.current = true;
      handleCanvasChanged();
    };
    
    const handleObjectAddedToCanvas = (e: any) => {
      if (!mountedRef.current) return;
      
      if (e.target) {
        e.target.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true
        });
      }
      
      pendingModificationsRef.current = true;
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
  }, [id, handleObjectModified, fabricRef, MIN_UPDATE_INTERVAL]);

  return { handleObjectAdded, handleObjectModified };
};
