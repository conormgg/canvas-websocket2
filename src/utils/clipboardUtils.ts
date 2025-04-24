
import { FabricObject, Canvas, ActiveSelection } from "fabric";
import { toast } from "sonner";

export const clipboardUtils = {
  copyObjectsToClipboard: (
    canvas: Canvas,
    clipboardDataRef: React.MutableRefObject<any[] | null>
  ) => {
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) {
      console.log("No active objects to copy");
      return false;
    }

    // Use toObject with additional parameters to ensure all properties are copied
    clipboardDataRef.current = activeObjects.map((obj) => obj.toObject(['objectType', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'flipX', 'flipY', 'opacity', 'stroke', 'strokeWidth', 'fill', 'paintFirst', 'globalCompositeOperation']));
    
    const sourceBoard = canvas.lowerCanvasEl?.dataset.boardId;
    console.log(`Objects copied from board: ${sourceBoard}`);
    console.log("Copied objects data:", clipboardDataRef.current);
    return true;
  },

  calculatePastePosition: (
    canvas: Canvas,
    originalLeft: number,
    originalTop: number
  ) => {
    if (!canvas || !canvas.viewportTransform) {
      console.log("Invalid canvas for paste position calculation");
      return { left: originalLeft, top: originalTop };
    }
    
    console.log("Calculating paste position for board:", canvas.lowerCanvasEl?.dataset.boardId);
    return {
      left: originalLeft + 10, // Add a small offset each time
      top: originalTop + 10,
    };
  },

  selectPastedObjects: (canvas: Canvas, objects: FabricObject[]) => {
    if (!canvas || !objects.length) return;
    
    if (objects.length === 1) {
      canvas.setActiveObject(objects[0]);
    } else {
      const selection = new ActiveSelection(objects, { canvas });
      canvas.setActiveObject(selection);
    }
    
    canvas.requestRenderAll();
    console.log("Objects pasted and selected on board:", canvas.lowerCanvasEl?.dataset.boardId);
  }
};
