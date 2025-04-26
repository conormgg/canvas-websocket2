import { Canvas, util, Point, FabricObject } from "fabric";
import { RefObject } from "react";
import { toast } from "sonner";
import { ensureObjectsSelectable, pasteImageBlobToCanvas } from "@/utils/clipboardUtils";

export const useInternalPasteHandler = (canvas: Canvas | null, internalClipboardData: any[] | null, position: Point | null) => {
  const handleInternalPaste = async () => {
    if (!canvas || !internalClipboardData || !position) {
      return;
    }
    
    try {
      const objects = await util.enlivenObjects(internalClipboardData);
      if (!objects.length) return;

      let minL = Infinity, minT = Infinity;
      objects.forEach((o: any) => {
        if (typeof o.left === "number" && o.left < minL) minL = o.left;
        if (typeof o.top === "number" && o.top < minT) minT = o.top;
      });
      
      if (!isFinite(minL)) minL = 0;
      if (!isFinite(minT)) minT = 0;

      objects.forEach((o: any) => {
        const dx = typeof o.left === "number" ? o.left - minL : 0;
        const dy = typeof o.top === "number" ? o.top - minT : 0;
        
        o.set({
          left: position.x + dx,
          top: position.y + dy,
          selectable: true,
          evented: true,
        });
        
        canvas.add(o);
        if (typeof o.setCoords === "function") o.setCoords();
      });
      
      canvas.renderAll();
      ensureObjectsSelectable(canvas); // Make sure all objects remain selectable
    } catch (err) {
      console.error("Internal paste failed", err);
    }
  };

  return handleInternalPaste;
};

export const useSystemPasteHandler = (canvas: Canvas | null, position: Point | null) => {
  const handleSystemPaste = async () => {
    if (!canvas || !position) {
      console.log("Cannot paste from system: missing data", {
        hasCanvas: !!canvas,
        pastePosition: position
      });
      return;
    }
    
    console.log("Pasting system clipboard at position:", position);
    
    try {
      const clipboardItems = await navigator.clipboard.read();
      let imageFound = false;
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            imageFound = true;
            const blob = await clipboardItem.getType(type);
            await pasteImageBlobToCanvas(canvas, blob, position);
            break;
          }
        }
        if (imageFound) break;
      }
      
      if (!imageFound) {
        toast.error("No image content found in system clipboard");
      }
    } catch (err) {
      console.error("System paste error:", err);
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        toast.error(`System paste failed: ${err.message}`);
      } else {
        toast.error("System clipboard access denied");
      }
    }
  };

  return handleSystemPaste;
};
