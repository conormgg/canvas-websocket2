
import { useRef, useEffect, useCallback } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { CanvasPersistenceUtils } from './whiteboard/canvasPersistenceUtils';
import { ObjectModificationHandlers } from './whiteboard/persistenceTypes';

export const useCanvasPersistence = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  id: WhiteboardId,
  isTeacherView: boolean
): ObjectModificationHandlers => {
  const persistenceUtilsRef = useRef<CanvasPersistenceUtils>(new CanvasPersistenceUtils());
  const lastUpdateTimeRef = useRef<number>(0);
  const updateQueueRef = useRef<boolean>(false);
  const MIN_UPDATE_INTERVAL = 800; // Increased minimum time between updates in ms
  const mountedRef = useRef<boolean>(true);
  const pendingModificationsRef = useRef<boolean>(false);
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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      persistenceUtilsRef.current.clearTimeout();
    };
  }, []);

  const handleObjectModified = useCallback((canvas: Canvas) => {
    if (!mountedRef.current) return;
    
    // Generate a state hash to prevent saving identical states
    const stateHash = generateCanvasStateHash(canvas);
    if (stateHash === lastSavedStateHashRef.current) {
      console.log('Skipping save - canvas state hash unchanged');
      return;
    }
    
    // Rate limit updates to prevent update storms
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < MIN_UPDATE_INTERVAL) {
      if (!updateQueueRef.current) {
        // Schedule a save for later if we're throttling
        updateQueueRef.current = true;
        pendingModificationsRef.current = true;
        setTimeout(() => {
          if (mountedRef.current && fabricRef.current && pendingModificationsRef.current) {
            const newHash = generateCanvasStateHash(fabricRef.current);
            lastSavedStateHashRef.current = newHash;
            persistenceUtilsRef.current.handleSyncedModification(fabricRef.current, id);
            updateQueueRef.current = false;
            pendingModificationsRef.current = false;
          }
        }, MIN_UPDATE_INTERVAL);
      }
      return;
    }
    
    lastUpdateTimeRef.current = now;
    lastSavedStateHashRef.current = stateHash;
    pendingModificationsRef.current = false;
    persistenceUtilsRef.current.handleSyncedModification(canvas, id);
  }, [id, fabricRef, generateCanvasStateHash]);

  const handleObjectAdded = useCallback((object: FabricObject) => {
    if (!mountedRef.current) return;
    
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Make sure the added object is selectable
    object.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true
    });
    
    // Mark that we have pending modifications
    pendingModificationsRef.current = true;
    
    // Rate limit updates
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < MIN_UPDATE_INTERVAL) {
      if (!updateQueueRef.current) {
        // Schedule a save for later if we're throttling
        updateQueueRef.current = true;
        setTimeout(() => {
          if (mountedRef.current && fabricRef.current && pendingModificationsRef.current) {
            const newHash = generateCanvasStateHash(fabricRef.current);
            lastSavedStateHashRef.current = newHash;
            persistenceUtilsRef.current.handleSyncedModification(fabricRef.current, id);
            updateQueueRef.current = false;
            pendingModificationsRef.current = false;
          }
        }, MIN_UPDATE_INTERVAL);
      }
      return;
    }
    
    lastUpdateTimeRef.current = now;
    const stateHash = generateCanvasStateHash(canvas);
    lastSavedStateHashRef.current = stateHash;
    pendingModificationsRef.current = false;
    persistenceUtilsRef.current.handleSyncedModification(canvas, id);
  }, [id, fabricRef, generateCanvasStateHash]);

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
  }, [id, handleObjectModified, fabricRef, generateCanvasStateHash]);

  return { handleObjectAdded, handleObjectModified };
};
