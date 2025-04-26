
import { Canvas } from 'fabric';
import { toast } from 'sonner';
import { createCustomCursor, applyCursorToCanvas } from '@/utils/cursorUtils';

export const useCanvasTools = () => {
  const updateCursorAndNotify = (canvas: Canvas, tool: string, thickness: number) => {
    if (!canvas) return;
    
    console.log(`Updating cursor for tool: ${tool} with thickness: ${thickness}`);
    
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
    
    // Force cursor update by triggering a mouse move event
    const canvasEl = canvas.upperCanvasEl;
    if (canvasEl) {
      const fakeEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true
      });
      canvasEl.dispatchEvent(fakeEvent);
    }
  };

  return { updateCursorAndNotify };
};
