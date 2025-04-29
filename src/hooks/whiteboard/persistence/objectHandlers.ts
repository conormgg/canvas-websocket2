import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { CanvasPersistenceUtils } from '../canvasPersistenceUtils';

export interface ObjectHandlerConfig {
  fabricRef: React.MutableRefObject<Canvas | null>;
  boardId: WhiteboardId;
  persistenceUtils: CanvasPersistenceUtils;
  isStateChanged: (canvas: Canvas) => boolean;
  updateStateHash: (canvas: Canvas) => void;
  shouldThrottleUpdate: () => boolean;
  scheduleUpdate: (callback: () => void, fabricRef: React.MutableRefObject<Canvas | null>) => void;
  recordUpdate: () => void;
}

export const createObjectHandlers = (config: ObjectHandlerConfig) => {
  const {
    fabricRef,
    boardId,
    persistenceUtils,
    isStateChanged,
    updateStateHash,
    shouldThrottleUpdate,
    scheduleUpdate,
    recordUpdate,
  } = config;

  const handleObjectModified = (canvas: Canvas) => {
    // Skip save if canvas state hash unchanged
    if (!isStateChanged(canvas)) {
      console.log('Skipping save - canvas state hash unchanged');
      return;
    }
    
    // Rate limit updates to prevent update storms
    if (shouldThrottleUpdate()) {
      scheduleUpdate(() => {
        if (fabricRef.current) {
          updateStateHash(fabricRef.current);
          persistenceUtils.handleSyncedModification(fabricRef.current, boardId);
        }
      }, fabricRef);
      return;
    }
    
    recordUpdate();
    updateStateHash(canvas);
    persistenceUtils.handleSyncedModification(canvas, boardId);
  };

  const handleObjectAdded = (object: FabricObject) => {
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
    if (shouldThrottleUpdate()) {
      scheduleUpdate(() => {
        if (fabricRef.current) {
          updateStateHash(fabricRef.current);
          persistenceUtils.handleSyncedModification(fabricRef.current, boardId);
        }
      }, fabricRef);
      return;
    }
    
    recordUpdate();
    updateStateHash(canvas);
    persistenceUtils.handleSyncedModification(canvas, boardId);
  };

  return {
    handleObjectModified,
    handleObjectAdded
  };
};
