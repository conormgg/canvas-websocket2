
import { Canvas } from 'fabric';

interface CursorOptions {
  size: number;
  color?: string;
  isEraser?: boolean;
}

export const createCustomCursor = ({ size, color = 'black', isEraser = false }: CursorOptions) => {
  const svg = isEraser
    ? `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" stroke="${color}" stroke-width="1" fill="transparent"/>
      </svg>`
    : `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>
      </svg>`;
  
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const cursorHotspot = Math.floor(size / 2);
  
  return `url(${url}) ${cursorHotspot} ${cursorHotspot}, auto`;
};

// Helper function to directly apply cursor to canvas
export const applyCursorToCanvas = (canvas: Canvas | null, cursor: string) => {
  if (!canvas) return;
  
  // Apply to all relevant canvas properties
  canvas.defaultCursor = cursor;
  canvas.freeDrawingCursor = cursor;
  
  // Directly apply to canvas DOM elements for more reliable cursor changes
  if (canvas.wrapperEl) canvas.wrapperEl.style.cursor = cursor;
  if (canvas.upperCanvasEl) canvas.upperCanvasEl.style.cursor = cursor;
  if (canvas.lowerCanvasEl) canvas.lowerCanvasEl.style.cursor = cursor;
};

