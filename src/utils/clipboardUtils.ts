
import { FabricObject, Canvas } from "fabric";
import { toast } from "sonner";

export const clipboardUtils = {
  copyObjectsToClipboard: (
    canvas: Canvas,
    clipboardDataRef: React.MutableRefObject<any[] | null>
  ) => {
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return false;

    clipboardDataRef.current = activeObjects.map((obj) =>
      obj.toObject(["left", "top", "scaleX", "scaleY", "angle"])
    );
    
    toast.success("Object copied");
    return true;
  },

  calculatePastePosition: (
    canvas: Canvas,
    originalLeft: number,
    originalTop: number
  ) => {
    if (!canvas || !canvas.viewportTransform) {
      return { left: originalLeft, top: originalTop };
    }
    
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
      const selection = new fabric.ActiveSelection(objects, { canvas });
      canvas.setActiveObject(selection);
    }
    
    canvas.requestRenderAll();
  }
};
