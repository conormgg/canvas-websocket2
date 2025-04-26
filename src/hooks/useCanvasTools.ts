
import { Canvas } from 'fabric';
import { toast } from 'sonner';
import { createCustomCursor, applyCursorToCanvas } from '@/utils/cursorUtils';

export const useCanvasTools = () => {
  const updateCursorAndNotify = (canvas: Canvas, tool: string, thickness: number) => {
    if (tool === "draw") {
      const cursor = createCustomCursor({ size: thickness, color: canvas.freeDrawingBrush.color as string });
      applyCursorToCanvas(canvas, cursor);
      toast("Draw mode enabled. Click and drag to draw!");
    } else if (tool === "eraser") {
      const cursor = createCustomCursor({ size: thickness * 2, isEraser: true });
      applyCursorToCanvas(canvas, cursor);
      toast("Eraser mode enabled. Click and drag to erase!");
    } else if (tool === "select") {
      applyCursorToCanvas(canvas, 'default');
      canvas.hoverCursor = 'move';
      toast("Select mode enabled. Click objects to select them!");
    }
  };

  return { updateCursorAndNotify };
};
