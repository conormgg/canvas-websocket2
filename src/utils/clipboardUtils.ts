
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

    clipboardDataRef.current = activeObjects.map((obj) =>
      obj.toObject(["left", "top", "scaleX", "scaleY", "angle"])
    );
    
    const sourceBoard = canvas.lowerCanvasEl?.dataset.boardId;
    console.log(`Objects copied from board: ${sourceBoard}`);
    toast.success("Object copied");
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
      left: originalLeft,
      top: originalTop,
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
