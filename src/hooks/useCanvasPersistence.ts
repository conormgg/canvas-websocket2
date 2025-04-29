
import { useRef, useEffect, useCallback } from 'react';
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

// Optimize by only sending the differences, but for now we'll just implement better debouncing
export const useCanvasPersistence = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  id: WhiteboardId,
  isTeacherView: boolean
) => {
  const saveTimeoutRef = useRef<number | null>(null);
  const lastSavedStateRef = useRef<string | null>(null);

  // More aggressive debounce timeout - wait longer before saving
  const DEBOUNCE_TIMEOUT = 500; // Increased from 200ms to 500ms

  const saveCanvasState = useCallback(async (canvas: Canvas, boardId: WhiteboardId) => {
    if (!canvas) return;
    
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
      if (canvasDataString === lastSavedStateRef.current) {
        console.log(`Canvas state unchanged for ${boardId}, skipping save`);
        return;
      }
      
      console.log(`Saving canvas state for ${boardId}`);
      lastSavedStateRef.current = canvasDataString;
      
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
  }, []);

  const debouncedSave = useCallback((canvas: Canvas, boardId: WhiteboardId) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      saveCanvasState(canvas, boardId);
    }, DEBOUNCE_TIMEOUT);
  }, [saveCanvasState]);

  const handleObjectModified = useCallback((canvas: Canvas) => {
    console.log(`Canvas ${id} modified, queuing save`);
    debouncedSave(canvas, id);
    
    // Handle two-way sync for board 2
    if (id === "teacher2") {
      debouncedSave(canvas, "student2");
    } else if (id === "student2") {
      debouncedSave(canvas, "teacher2");
    } else if (id === "teacher1") {
      debouncedSave(canvas, "student1");
    }
  }, [id, debouncedSave]);

  const handleObjectAdded = useCallback((object: FabricObject) => {
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
  }, [id, debouncedSave, fabricRef]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Use a single handler for all canvas events to reduce event handler overhead
    const handleCanvasChanged = () => {
      handleObjectModified(canvas);
    };

    // Throttle events that might fire very rapidly
    let isDrawing = false;
    let pendingDrawUpdate = false;
    
    const handleDrawingEvents = () => {
      if (isDrawing && !pendingDrawUpdate) {
        pendingDrawUpdate = true;
        // Wait until the user pauses drawing before saving
        setTimeout(() => {
          handleCanvasChanged();
          pendingDrawUpdate = false;
        }, 300);
      }
    };

    const handlePathCreated = () => {
      console.log(`Path created on canvas ${id}, queuing save`);
      // Only save when drawing is finished, not during every path update
      handleCanvasChanged();
    };

    const handleMouseDown = () => {
      if (canvas.isDrawingMode) {
        isDrawing = true;
      }
    };

    const handleMouseUp = () => {
      if (canvas.isDrawingMode && isDrawing) {
        isDrawing = false;
        handleCanvasChanged();
      }
    };

    const handleObjectRemoved = () => {
      console.log(`Object removed from canvas ${id}, queuing save`);
      handleCanvasChanged();
    };
    
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
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id, handleObjectModified, fabricRef]);

  return { handleObjectAdded, handleObjectModified };
};
