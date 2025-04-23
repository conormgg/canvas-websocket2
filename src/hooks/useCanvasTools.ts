
import { Canvas } from 'fabric';
import { toast } from 'sonner';
import { createCustomCursor } from '@/utils/cursorUtils';

export const useCanvasTools = () => {
  const updateCursorAndNotify = (canvas: Canvas, tool: string, thickness: number) => {
    if (tool === "draw") {
      const cursor = createCustomCursor({ size: thickness });
      canvas.freeDrawingCursor = cursor;
      canvas.defaultCursor = cursor;
      canvas.wrapperEl.style.cursor = cursor;
      toast("Draw mode enabled. Click and drag to draw!");
    } else if (tool === "eraser") {
      const cursor = createCustomCursor({ size: thickness * 2, isEraser: true });
      canvas.freeDrawingCursor = cursor;
      canvas.defaultCursor = cursor;
      canvas.wrapperEl.style.cursor = cursor;
      toast("Eraser mode enabled. Click and drag to erase!");
    } else if (tool === "select") {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.wrapperEl.style.cursor = 'default';
      toast("Select mode enabled. Click objects to select them!");
    }
  };

  return { updateCursorAndNotify };
};

