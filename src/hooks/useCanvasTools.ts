import { Canvas } from 'fabric';
import { toast } from 'sonner';
import { createCustomCursor } from '@/utils/cursorUtils';

export const useCanvasTools = () => {
  const lastToastTimestamp = {
    draw: 0,
    eraser: 0,
    select: 0,
  };

  const shouldShowToast = (tool: string): boolean => {
    const now = Date.now();
    const lastShown = lastToastTimestamp[tool as keyof typeof lastToastTimestamp] || 0;
    const timeSinceLastToast = now - lastShown;
    
    if (timeSinceLastToast > 2000) {
      lastToastTimestamp[tool as keyof typeof lastToastTimestamp] = now;
      return true;
    }
    return false;
  };

  const updateCursorAndNotify = (canvas: Canvas, tool: string, thickness: number) => {
    if (tool === "draw") {
      const cursor = createCustomCursor({ size: thickness });
      canvas.freeDrawingCursor = cursor;
      canvas.defaultCursor = cursor;
      canvas.wrapperEl.style.cursor = cursor;
      
      if (shouldShowToast('draw')) {
        toast("Draw mode enabled. Click and drag to draw!");
      }
    } else if (tool === "eraser") {
      const cursor = createCustomCursor({ size: thickness * 2, isEraser: true });
      canvas.freeDrawingCursor = cursor;
      canvas.defaultCursor = cursor;
      canvas.wrapperEl.style.cursor = cursor;
      
      if (shouldShowToast('eraser')) {
        toast("Eraser mode enabled. Click and drag to erase!");
      }
    } else if (tool === "select") {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.wrapperEl.style.cursor = 'default';
      
      if (shouldShowToast('select')) {
        toast("Select mode enabled. Click objects to select them!");
      }
    }
  };

  return { updateCursorAndNotify };
};
