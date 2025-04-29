import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WhiteboardObject } from './persistenceTypes';

export class CanvasStateManager {
  private lastSavedState: string | null = null;

  constructor() {
    this.lastSavedState = null;
  }

  setLastSavedState(state: string | null): void {
    this.lastSavedState = state;
  }

  getLastSavedState(): string | null {
    return this.lastSavedState;
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
      
      // Skip saving if the state hasn't changed
      if (canvasDataString === this.lastSavedState) {
        console.log(`Canvas state unchanged for ${boardId}, skipping save`);
        return false;
      }
      
      console.log(`Saving canvas state for ${boardId}`);
      this.lastSavedState = canvasDataString;
      
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
    if (sourceId === "teacher2" && targetId === "student2") {
      this.saveCanvasState(canvas, targetId);
    } else if (sourceId === "student2" && targetId === "teacher2") {
      this.saveCanvasState(canvas, targetId);
    } else if (sourceId === "teacher1" && targetId === "student1") {
      this.saveCanvasState(canvas, targetId);
    }
  }

  async clearCanvasData(boardId: WhiteboardId): Promise<boolean> {
    try {
      console.log(`Clearing whiteboard data for ${boardId}`);
      
      // For board 2, delete both teacher2 and student2 content
      const query = (boardId === "teacher2" || boardId === "student2") 
        ? supabase
            .from('whiteboard_objects')
            .delete()
            .in('board_id', ['teacher2', 'student2'])
        : supabase
            .from('whiteboard_objects')
            .delete()
            .eq('board_id', boardId);
      
      const { error } = await query;
      
      if (error) {
        console.error('Error clearing canvas data:', error);
        toast.error('Failed to clear whiteboard data');
        return false;
      } else {
        console.log(`Canvas data cleared successfully for ${boardId}`);
        toast.success('Whiteboard data cleared successfully');
        return true;
      }
    } catch (err) {
      console.error('Failed to clear canvas data:', err);
      toast.error('Failed to clear whiteboard data');
      return false;
    }
  }
}
