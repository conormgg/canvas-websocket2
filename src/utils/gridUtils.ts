
import { Canvas, Line } from "fabric";

export const createGrid = (canvas: Canvas, gridSize: number = 50) => {
  // Clear any existing grid lines
  const existingGrid = canvas.getObjects().filter(obj => {
    // @ts-ignore - Using custom data property which TypeScript doesn't recognize by default
    return obj.data?.isGrid;
  });
  existingGrid.forEach(obj => canvas.remove(obj));

  const width = canvas.width || window.innerWidth;
  const height = canvas.height || window.innerHeight;

  // Create vertical and horizontal grid lines
  for (let i = 0; i < width; i += gridSize) {
    const line = new Line([i, 0, i, height], {
      stroke: '#ddd',
      selectable: false,
      evented: false,
      // Add data as a custom property
      data: { isGrid: true }
    });
    canvas.add(line);
    canvas.sendObjectToBack(line);
  }

  for (let i = 0; i < height; i += gridSize) {
    const line = new Line([0, i, width, i], {
      stroke: '#ddd',
      selectable: false,
      evented: false,
      // Add data as a custom property
      data: { isGrid: true }
    });
    canvas.add(line);
    canvas.sendObjectToBack(line);
  }

  canvas.renderAll();
};

