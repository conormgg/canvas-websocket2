
import { Canvas } from 'fabric';
import { toast } from 'sonner';

export const useCanvasTools = () => {
  const updateCursorAndNotify = (canvas: Canvas, tool: string, thickness: number) => {
    if (tool === "draw") {
      // For draw tool, use a small dot cursor
      const dotSize = thickness;
      const dot = `
        <svg width="${dotSize}" height="${dotSize}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${dotSize/2}" cy="${dotSize/2}" r="${dotSize/2}" fill="black"/>
        </svg>`;
      
      const svgBlob = new Blob([dot], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      
      // Set the hotspot to the center of the dot
      const cursorHotspot = Math.floor(dotSize / 2);
      canvas.defaultCursor = `url(${url}) ${cursorHotspot} ${cursorHotspot}, auto`;
      
      toast("Draw mode enabled. Click and drag to draw!");
    } else if (tool === "eraser") {
      const eraserSize = thickness * 2; // Double the ink thickness for eraser
      
      // Create an SVG circle for the eraser cursor
      const circle = `
        <svg width="${eraserSize}" height="${eraserSize}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${eraserSize/2}" cy="${eraserSize/2}" r="${eraserSize/2 - 1}" 
                  stroke="black" stroke-width="1" fill="transparent"/>
        </svg>`;
      
      // Convert SVG to data URL for cursor
      const svgBlob = new Blob([circle], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      
      // Set the hotspot to the center of the circle
      const cursorHotspot = Math.floor(eraserSize / 2);
      canvas.defaultCursor = `url(${url}) ${cursorHotspot} ${cursorHotspot}, auto`;
      
      toast("Eraser mode enabled. Click and drag to erase!");
    } else if (tool === "select") {
      canvas.defaultCursor = 'default';
      toast("Select mode enabled. Click objects to select them!");
    }
  };

  return { updateCursorAndNotify };
};
