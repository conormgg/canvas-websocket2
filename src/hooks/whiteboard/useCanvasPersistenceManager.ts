
import { useRef } from 'react';
import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { CanvasStateManager } from './CanvasStateManager';
import { CanvasSyncManager } from './CanvasSyncManager';
import { useSyncContext } from '@/context/SyncContext';

/**
 * Hook for managing canvas state persistence and synchronization
 */
export const useCanvasPersistenceManager = (
  boardId: WhiteboardId, 
  isTeacherView: boolean
) => {
  const stateManagerRef = useRef<CanvasStateManager>(new CanvasStateManager());
  const syncManagerRef = useRef<CanvasSyncManager>(new CanvasSyncManager());
  const { sendObjectToStudents } = useSyncContext();
  
  /**
   * Save canvas state and trigger sync if needed
   */
  const saveCanvasState = async (canvas: Canvas): Promise<boolean> => {
    // Track original state before saving
    const originalState = stateManagerRef.current.getLastSavedState();
    
    // Save to the current board
    const saveResult = await stateManagerRef.current.saveCanvasState(canvas, boardId);
    
    // If this is a teacher board and the state changed, sync to student's board
    if (saveResult && isTeacherView && originalState !== stateManagerRef.current.getLastSavedState()) {
      const canvasData = (canvas.toJSON as any)();
      // Use the SyncContext to handle whiteboard sync based on active sync settings
      sendObjectToStudents(canvasData, boardId);
    }
    
    return saveResult;
  };

  /**
   * Synchronize state between two boards
   */
  const syncBoardState = (canvas: Canvas, sourceId: WhiteboardId, targetId: WhiteboardId): void => {
    stateManagerRef.current.syncBoardState(canvas, sourceId, targetId);
  };
  
  return {
    saveCanvasState,
    syncBoardState,
    getStateManager: () => stateManagerRef.current
  };
};
