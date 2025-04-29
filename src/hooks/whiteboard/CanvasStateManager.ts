
import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WhiteboardObject } from './persistenceTypes';

/**
 * Manages canvas state persistence with optimized saving and retry mechanisms
 */
export class CanvasStateManager {
  private lastSavedState: string | null = null;
  private pendingSaves: Map<WhiteboardId, boolean> = new Map();
  private saveRetryCount: Map<WhiteboardId, number> = new Map();
  private lastSyncTime: number = 0;
  private lastSyncPair: string = '';
  private lastSavedBoardId: WhiteboardId | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly SYNC_COOLDOWN = 500; // ms

  constructor() {
    this.lastSavedState = null;
  }

  setLastSavedState(state: string | null): void {
    this.lastSavedState = state;
  }

  getLastSavedState(): string | null {
    return this.lastSavedState;
  }

  /**
   * Save canvas state to the database with retry mechanism
   */
  async saveCanvasState(canvas: Canvas, boardId: WhiteboardId): Promise<boolean> {
    if (!canvas) return false;
    
    // If we're already saving this board, mark it as pending and return
    if (this.pendingSaves.get(boardId)) {
      console.log(`Save already in progress for ${boardId}, marking as pending`);
      this.pendingSaves.set(boardId, true);
      return false;
    }
    
    this.pendingSaves.set(boardId, true);
    
    try {
      // Ensure all objects are selectable and interactive before saving
      canvas.getObjects().forEach(obj => {
        obj.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true
        });
      });
      
      // Using the Fabric.js v6 compatible way to get JSON with type assertion
      const canvasData = (canvas.toJSON as any)();
      const canvasDataString = JSON.stringify(canvasData);
      
      // Skip saving if the state hasn't changed
      if (canvasDataString === this.lastSavedState && boardId === this.lastSavedBoardId) {
        console.log(`Canvas state unchanged for ${boardId}, skipping save`);
        this.pendingSaves.set(boardId, false);
        return false;
      }
      
      console.log(`Saving canvas state for ${boardId}`);
      this.lastSavedState = canvasDataString;
      this.lastSavedBoardId = boardId;
      
      return await this.persistToDatabase(canvasData, boardId);
    } catch (err) {
      console.error('Failed to save canvas state:', err);
      this.pendingSaves.set(boardId, false);
      return false;
    }
  }

  /**
   * Persist canvas data to the database with retry logic
   */
  private async persistToDatabase(canvasData: any, boardId: WhiteboardId): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whiteboard_objects')
        .insert({
          board_id: boardId,
          object_data: canvasData
        } as WhiteboardObject);
        
      if (error) {
        console.error('Error saving canvas state:', error);
        return await this.handleSaveError(boardId);
      } else {
        console.log(`Canvas state saved for ${boardId}`);
        this.saveRetryCount.set(boardId, 0);
        this.pendingSaves.set(boardId, false);
        return true;
      }
    } catch (err) {
      console.error('Database error while saving canvas state:', err);
      return await this.handleSaveError(boardId);
    }
  }

  /**
   * Handle save errors with exponential backoff retry
   */
  private async handleSaveError(boardId: WhiteboardId): Promise<boolean> {
    // Increment retry count for this board
    const retryCount = (this.saveRetryCount.get(boardId) || 0) + 1;
    this.saveRetryCount.set(boardId, retryCount);
    
    if (retryCount <= this.MAX_RETRIES) {
      console.log(`Retrying save for ${boardId} (attempt ${retryCount}/${this.MAX_RETRIES})`);
      this.pendingSaves.set(boardId, false);
      // Return false now, but schedule a retry with exponential backoff
      setTimeout(() => {
        // Just trigger another save attempt if we have a canvas reference
        if (window.__wbActiveBoardId === boardId && window.__wbActiveBoard) {
          const canvas = window.__wbActiveBoard;
          const fabricCanvas = canvas.__canvas;
          if (fabricCanvas) {
            this.saveCanvasState(fabricCanvas, boardId);
          }
        }
      }, 500 * Math.pow(2, retryCount - 1));
      return false;
    } else {
      toast.error('Failed to save whiteboard state');
      this.saveRetryCount.set(boardId, 0);
      this.pendingSaves.set(boardId, false);
      return false;
    }
  }

  /**
   * Synchronize state between two boards
   */
  syncBoardState(canvas: Canvas, sourceId: WhiteboardId, targetId: WhiteboardId): void {
    // Prevent recursive syncing
    if (this.isCurrentlySyncing(sourceId, targetId)) {
      console.log(`Preventing recursive sync from ${sourceId} to ${targetId}`);
      return;
    }
    
    if (sourceId === "teacher2" && targetId === "student2") {
      this.saveCanvasState(canvas, targetId);
    } else if (sourceId === "student2" && targetId === "teacher2") {
      this.saveCanvasState(canvas, targetId);
    } else if (sourceId === "teacher1" && targetId === "student1") {
      this.saveCanvasState(canvas, targetId);
    }
  }
  
  /**
   * Check if we're currently in the middle of syncing between these boards
   */
  private isCurrentlySyncing(sourceId: WhiteboardId, targetId: WhiteboardId): boolean {
    const now = Date.now();
    const syncPair = `${sourceId}-${targetId}`;
    
    if (syncPair === this.lastSyncPair && (now - this.lastSyncTime < this.SYNC_COOLDOWN)) {
      return true;
    }
    
    this.lastSyncTime = now;
    this.lastSyncPair = syncPair;
    return false;
  }
}
