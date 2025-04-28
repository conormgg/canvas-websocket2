
import { useRef, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      
      const { error } = await supabase
        .from('whiteboard_objects')
        .insert({
          board_id: boardId,
          object_data: canvasData
        });
        
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
    }, 1000);
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
    
    const handleCanvasModified = () => {
      console.log(`Canvas ${id} modified, saving state`);
      debouncedSave(canvas, id);
      
      if (id.startsWith('teacher')) {
        const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
        debouncedSave(canvas, studentBoardId);
      }
    };
    
    canvas.on('object:modified', handleCanvasModified);
    
    return () => {
      canvas.off('object:modified', handleCanvasModified);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id, fabricRef, isTeacherView]);

  return { handleObjectAdded };
};
