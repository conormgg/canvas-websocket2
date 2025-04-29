
import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WhiteboardObject } from './persistenceTypes';

export class CanvasStateManager {
  private lastSavedState: string | null = null;
  private statesByBoardId: Map<string, string> = new Map();

  constructor() {
    this.lastSavedState = null;
  }

  setLastSavedState(state: string | null): void {
    this.lastSavedState = state;
  }

  getLastSavedState(): string | null {
    return this.lastSavedState;
  }

  getBoardState(boardId: WhiteboardId): string | null {
    return this.statesByBoardId.get(boardId) || null;
  }

  setBoardState(boardId: WhiteboardId, state: string): void {
    this.statesByBoardId.set(boardId, state);
  }

  async saveCanvasState(canvas: Canvas, boardId: WhiteboardId): Promise<boolean> {
    if (!canvas) return false;
    
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
      
      const canvasData = canvas.toJSON();
      const canvasDataString = JSON.stringify(canvasData);
      
      // Get board-specific saved state
      const lastBoardState = this.getBoardState(boardId);
      
      // Skip saving if the state hasn't changed
      if (canvasDataString === lastBoardState) {
        console.log(`Canvas state unchanged for ${boardId}, skipping save`);
        return false;
      }
      
      console.log(`Saving canvas state for ${boardId}`);
      this.setBoardState(boardId, canvasDataString);
      
      const { error } = await (supabase
        .from('whiteboard_objects') as any)
        .insert({
          board_id: boardId,
          object_data: canvasData
        } as WhiteboardObject);
        
      if (error) {
        console.error('Error saving canvas state:', error);
        toast.error('Failed to save whiteboard state');
        return false;
      } else {
        console.log(`Canvas state saved for ${boardId}`);
        return true;
      }
    } catch (err) {
      console.error('Failed to save canvas state:', err);
      return false;
    }
  }

  syncBoardState(canvas: Canvas, sourceId: WhiteboardId, targetId: WhiteboardId): void {
    console.log(`Syncing state from ${sourceId} to ${targetId}`);
    
    // Create a deep copy of the canvas data to avoid reference issues
    const canvasData = JSON.parse(JSON.stringify(canvas.toJSON()));
    
    // For critical teacher1->student1 path, add extra logging and reliability measures
    const isTeacher1ToStudent1 = sourceId === 'teacher1' && targetId === 'student1';
    if (isTeacher1ToStudent1) {
      console.log(`CRITICAL SYNC PATH: ${sourceId} -> ${targetId} with data:`, canvasData);
    }
    
    // Insert the state into the target board immediately
    (supabase
      .from('whiteboard_objects') as any)
      .insert({
        board_id: targetId,
        object_data: canvasData
      } as WhiteboardObject)
      .then(({ error }) => {
        if (error) {
          console.error(`Error syncing from ${sourceId} to ${targetId}:`, error);
          toast.error(`Failed to sync from ${sourceId} to ${targetId}`);
          
          if (isTeacher1ToStudent1) {
            // For critical path, try one more time after a short delay
            setTimeout(() => {
              console.log(`Retrying critical sync from ${sourceId} to ${targetId}`);
              (supabase
                .from('whiteboard_objects') as any)
                .insert({
                  board_id: targetId,
                  object_data: canvasData
                } as WhiteboardObject)
                .then(({ error }) => {
                  if (error) {
                    console.error(`Retry failed for sync from ${sourceId} to ${targetId}:`, error);
                  } else {
                    console.log(`Retry succeeded for sync from ${sourceId} to ${targetId}`);
                  }
                });
            }, 500);
          }
        } else {
          console.log(`Successfully synced state from ${sourceId} to ${targetId}`);
        }
      });
  }
}
