import { useRef, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WhiteboardObject {
  board_id: string;
  object_data: any;
  created_at?: string;
  updated_at?: string;
  id?: string;
}

export const useCanvasPersistence = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  id: WhiteboardId,
  isTeacherView: boolean
) => {
  const saveTimeoutRef = useRef<number | null>(null);

  const saveCanvasState = async (canvas: Canvas, boardId: WhiteboardId) => {
    if (!canvas) return;
    
    try {
      console.log(`Saving canvas state for ${boardId}`);
      const canvasData = canvas.toJSON();
      
      const { error } = await (supabase
        .from('whiteboard_objects') as any)
        .insert({
          board_id: boardId,
          object_data: canvasData
        } as WhiteboardObject);
        
      if (error) {
        console.error('Error saving canvas state:', error);
        toast.error('Failed to save whiteboard state');
      } else {
        console.log(`Canvas state saved for ${boardId}`);
      }
    } catch (err) {
      console.error('Failed to save canvas state:', err);
    }
  };

  const debouncedSave = (canvas: Canvas, boardId: WhiteboardId) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      saveCanvasState(canvas, boardId);
    }, 300); // Reduced from 1000ms to 300ms for more responsive saving
  };

  const handleObjectAdded = (object: FabricObject) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    debouncedSave(canvas, id);
    
    if ((id.startsWith("teacher")) && isTeacherView) {
      console.log(`${id} added object, sending to corresponding student board`);
      const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
      debouncedSave(canvas, studentBoardId);
    }
  };

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleObjectRemoved = async (e: any) => {
      if (id.startsWith('teacher') && isTeacherView) {
        try {
          await saveCanvasState(canvas, id);
          const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
          await saveCanvasState(canvas, studentBoardId);
        } catch (err) {
          console.error('Error saving canvas state after deletion:', err);
        }
      }
    };

    const handleCanvasModified = () => {
      console.log(`Canvas ${id} modified, saving state`);
      debouncedSave(canvas, id);
      
      if (id.startsWith('teacher')) {
        const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
        debouncedSave(canvas, studentBoardId);
      }
    };

    const handlePathCreated = () => {
      console.log(`Path created on canvas ${id}, saving state`);
      debouncedSave(canvas, id);
      
      if (id.startsWith('teacher')) {
        const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
        debouncedSave(canvas, studentBoardId);
      }
    };
    
    canvas.on('object:modified', handleCanvasModified);
    canvas.on('path:created', handlePathCreated);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('mouse:up', () => {
      if (canvas.isDrawingMode) {
        debouncedSave(canvas, id);
        
        if (id.startsWith('teacher')) {
          const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
          debouncedSave(canvas, studentBoardId);
        }
      }
    });
    
    return () => {
      canvas.off('object:modified', handleCanvasModified);
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:removed', handleObjectRemoved);
    };
  }, [id, fabricRef, isTeacherView]);

  return { handleObjectAdded };
};
