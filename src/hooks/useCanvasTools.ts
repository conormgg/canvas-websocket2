
import { Canvas } from 'fabric';
import { toast } from 'sonner';

export const useCanvasTools = () => {
  const updateCursorAndNotify = (canvas: Canvas, tool: string) => {
    if (tool === "draw") {
      canvas.defaultCursor = 'default';
      toast("Draw mode enabled. Hold Ctrl + click to draw!");
    } else if (tool === "eraser") {
      canvas.defaultCursor = 'crosshair';
      toast("Eraser mode enabled. Click and drag to erase!");
    } else {
      canvas.defaultCursor = 'default';
      toast("Select mode enabled. Click objects to select them!");
    }
  };

  return { updateCursorAndNotify };
};
