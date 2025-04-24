
import { Canvas, FabricObject, util, Point, ActiveSelection } from "fabric";

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

    const newClipboardData = activeObjects.map((obj) => obj.toObject([
      'objectType', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY',
      'angle', 'flipX', 'flipY', 'opacity', 'stroke', 'strokeWidth',
      'fill', 'paintFirst', 'globalCompositeOperation'
    ]));
    
    // Update clipboard data
    clipboardDataRef.current = newClipboardData;
    
    console.log("Internal clipboard updated with", newClipboardData.length, "objects");
    
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
      left: originalLeft + 10,
      top: originalTop + 10,
    };
  },

  selectPastedObjects: (canvas: Canvas, objects: any[]) => {
    if (!canvas || !objects.length) return;
    
    if (objects.length === 1) {
      canvas.setActiveObject(objects[0]);
    } else {
      const selection = new ActiveSelection(objects, { canvas });
      canvas.setActiveObject(selection);
    }
    
    canvas.requestRenderAll();
  },

  enlivenAndPasteObjects: async (canvas: Canvas, objectsData: any[], position: Point | null) => {
    if (!objectsData?.length) {
      console.log("No objects to paste");
      return;
    }

    console.log("Enlivening", objectsData.length, "objects for paste");
    const objects = await util.enlivenObjects(objectsData);
    
    objects.forEach((obj: any) => {
      if (typeof obj !== "object") return;
      
      const originalLeft = typeof obj.left === "number" ? obj.left : 0;
      const originalTop = typeof obj.top === "number" ? obj.top : 0;
      
      let pastePosition;
      if (position) {
        pastePosition = {
          left: position.x,
          top: position.y
        };
      } else {
        pastePosition = clipboardUtils.calculatePastePosition(canvas, originalLeft, originalTop);
      }

      if (typeof obj.set === "function") {
        obj.set({ 
          left: pastePosition.left, 
          top: pastePosition.top, 
          evented: true 
        });
        canvas.add(obj);
        if (typeof obj.setCoords === "function") obj.setCoords();
      }
    });

    clipboardUtils.selectPastedObjects(canvas, objects);
    canvas.requestRenderAll();
  }
};
