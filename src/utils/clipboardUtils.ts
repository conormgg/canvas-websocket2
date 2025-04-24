
import { FabricObject, Canvas } from "fabric";
import { toast } from "sonner";

/**
 * Helper functions for clipboard operations
 */
export const clipboardUtils = {
  /**
   * Copy objects to clipboard
   */
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

  /**
   * Calculate paste position based on original position and viewport transform
   */
  calculatePastePosition: (
    canvas: Canvas,
    originalLeft: number,
    originalTop: number
  ) => {
    if (!canvas) return { left: originalLeft, top: originalTop };
    
    const vpt = canvas.viewportTransform;
    if (!vpt) return { left: originalLeft, top: originalTop };
    
    // Can implement more complex paste positioning logic here if needed
    return {
      left: originalLeft,
      top: originalTop,
    };
  },

  /**
   * Select objects after paste
   */
  selectPastedObjects: (canvas: Canvas, objects: FabricObject[]) => {
    if (!canvas || !objects.length) return;
    
    if (objects.length === 1) {
      canvas.setActiveObject(objects[0]);
    } else if (objects.length > 1) {
      // @ts-ignore - Fabric.js typing issue
      const selection = new fabric.ActiveSelection(objects, { canvas });
      canvas.setActiveObject(selection);
    }
    
    canvas.requestRenderAll();
  }
};
