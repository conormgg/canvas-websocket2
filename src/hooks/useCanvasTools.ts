
import { Canvas } from 'fabric';
import { toast } from 'sonner';

export const useCanvasTools = () => {
  const updateCursorAndNotify = (canvas: Canvas, tool: string, thickness: number) => {
    if (tool === "draw") {
      canvas.defaultCursor = 'crosshair';
      toast("Draw mode enabled. Click and drag to draw!");
    } else if (tool === "eraser") {
      // Create a circular cursor for the eraser
      const cursorSize = thickness * 2;
      const circle = `
        <svg height="${cursorSize}" width="${cursorSize}" style="position: absolute; top: ${-cursorSize/2}px; left: ${-cursorSize/2}px;">
          <circle cx="${cursorSize/2}" cy="${cursorSize/2}" r="${cursorSize/2}" stroke="black" stroke-width="1" fill="rgba(255,255,255,0.5)"/>
        </svg>`;
      const cursor = `url('data:image/svg+xml;utf8,${encodeURIComponent(circle)}') ${cursorSize/2} ${cursorSize/2}, auto`;
      canvas.defaultCursor = cursor;
      toast("Eraser mode enabled. Click and drag to erase!");
    } else {
      canvas.defaultCursor = 'default';
      toast("Select mode enabled. Click objects to select them!");
    }
  };

  return { updateCursorAndNotify };
};
