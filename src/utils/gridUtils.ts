
import { Canvas } from "fabric";

export const createGrid = (canvas: Canvas, gridSize: number = 50) => {
  // Clear any existing grid lines
  const existingGrid = canvas.getObjects().filter(obj => obj.data?.isGrid);
  existingGrid.forEach(obj => canvas.remove(obj));

  const width = canvas.width || window.innerWidth;
  const height = canvas.height || window.innerHeight;

  // Create vertical and horizontal grid lines
  for (let i = 0; i < width; i += gridSize) {
    const line = new fabric.Line([i, 0, i, height], {
      stroke: '#ddd',
      selectable: false,
      evented: false,
      data: { isGrid: true }
    });
    canvas.add(line);
    canvas.sendToBack(line);
  }

  for (let i = 0; i < height; i += gridSize) {
    const line = new fabric.Line([0, i, width, i], {
      stroke: '#ddd',
      selectable: false,
      evented: false,
      data: { isGrid: true }
    });
    canvas.add(line);
    canvas.sendToBack(line);
  }

  canvas.renderAll();
};
