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
    }, 200);
  };

  const handleObjectModified = (canvas: Canvas) => {
    console.log(`Canvas ${id} modified, saving state`);
    debouncedSave(canvas, id);
    
    // Handle two-way sync for board 2
    if (id === "teacher2") {
      debouncedSave(canvas, "student2");
    } else if (id === "student2") {
      debouncedSave(canvas, "teacher2");
    } else if (id === "teacher1") {
      debouncedSave(canvas, "student1");
    }
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
    
    debouncedSave(canvas, id);
    
    // Handle two-way sync for board 2
    if (id === "teacher2") {
      debouncedSave(canvas, "student2");
    } else if (id === "student2") {
      debouncedSave(canvas, "teacher2");
    } else if (id === "teacher1") {
      debouncedSave(canvas, "student1");
    }
  };

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Save canvas state whenever objects are modified
    const handleCanvasModified = () => {
      handleObjectModified(canvas);
    };

    // Save when drawing paths are created
    const handlePathCreated = () => {
      console.log(`Path created on canvas ${id}, saving state`);
      debouncedSave(canvas, id);
      
      if (id.startsWith('teacher')) {
        const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
        debouncedSave(canvas, studentBoardId);
      }
    };

    // Save when mouse is released while in drawing mode
    const handleMouseUp = () => {
      if (canvas.isDrawingMode) {
        debouncedSave(canvas, id);
        
        if (id.startsWith('teacher')) {
          const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
          debouncedSave(canvas, studentBoardId);
        }
      }
    };

    // Save when objects are removed
    const handleObjectRemoved = () => {
      console.log(`Object removed from canvas ${id}, saving state`);
      debouncedSave(canvas, id);
      
      if (id.startsWith('teacher')) {
        const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
        debouncedSave(canvas, studentBoardId);
      }
    };
    
    // Ensure objects are selectable when they're added to canvas
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
    
    canvas.on('object:modified', handleCanvasModified);
    canvas.on('path:created', handlePathCreated);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('object:added', handleObjectAddedToCanvas);
    
    return () => {
      canvas.off('object:modified', handleCanvasModified);
      canvas.off('path:created', handlePathCreated);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:added', handleObjectAddedToCanvas);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id, fabricRef, isTeacherView]);

  return { handleObjectAdded, handleObjectModified };
};
