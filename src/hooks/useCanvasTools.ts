
import { Canvas } from 'fabric';
import { toast } from 'sonner';

export const useCanvasTools = () => {
  const updateCursorAndNotify = (canvas: Canvas, tool: string, thickness: number) => {
    if (tool === "draw") {
      // For draw tool, use CSS cursor instead of SVG data URL
      canvas.defaultCursor = 'crosshair';
      canvas.freeDrawingCursor = 'crosshair';
      canvas.wrapperEl.style.cursor = 'crosshair';
      
      toast("Draw mode enabled. Click and drag to draw!");
    } else if (tool === "eraser") {
      // For eraser, use a simple CSS cursor instead of SVG data URL
      canvas.defaultCursor = 'cell';
      canvas.freeDrawingCursor = 'cell';
      canvas.wrapperEl.style.cursor = 'cell';
      
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
