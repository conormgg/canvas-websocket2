
import { Canvas, util, Point, FabricObject } from "fabric";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

export const useInternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  /* ------------------------------------------------------------- */
  /*  Local state                                                  */
  /* ------------------------------------------------------------- */
  const clipboardDataRef = useRef<any[] | null>(null);
  const [pastePosition, setPastePosition] = useState<Point | null>(null);
  const awaitingPlacementRef = useRef<boolean>(false);
  const placementPointRef = useRef<{ x: number; y: number } | null>(null);

  /* ------------------------------------------------------------- */
  /*  Sync with Global Clipboard (Ctrl+C / Ctrl+V)                  */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    const handleCopy = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c" && fabricRef.current) {
        const activeObjects = fabricRef.current.getActiveObjects();
        if (!activeObjects.length) return;

        clipboardDataRef.current = activeObjects.map((obj) =>
          obj.toObject(["left", "top", "scaleX", "scaleY", "angle"])
        );
        toast.success("Object copied");
      }
    };

    const handlePaste = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        awaitingPlacementRef.current = true;
        toast.info("Click to place pasted object");
      }
    };

    document.addEventListener("keydown", handleCopy);
    document.addEventListener("keydown", handlePaste);
    return () => {
      document.removeEventListener("keydown", handleCopy);
      document.removeEventListener("keydown", handlePaste);
    };
  }, [fabricRef]);

  /* ------------------------------------------------------------- */
  /*  Paste objects keeping their relative offsets                 */
  /* ------------------------------------------------------------- */
  const pasteAtPosition = (pos: { x: number; y: number } | null) => {
    if (!fabricRef.current || !clipboardDataRef.current?.length || !pos) return;

    const canvas = fabricRef.current;
    const toEnliven = [...clipboardDataRef.current];

    util
      .enlivenObjects(toEnliven, {
        callback: (objects: FabricObject[]) => {
          if (!objects.length) return;

          let minL = Infinity,
            minT = Infinity;
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
              left: pos.x + dx,
              top: pos.y + dy,
              evented: true,
            });
            canvas.add(o);
            if (typeof o.setCoords === "function") o.setCoords();
          });
          canvas.renderAll();
          toast.success("Pasted!");
        }
      })
      .catch((err) => {
        console.error("Paste failed", err);
        toast.error("Could not paste object.");
      });
  };

  /* ------------------------------------------------------------- */
  /*  Mouse-click placement handler                                */
  /* ------------------------------------------------------------- */
  const handleCanvasClick = (e: fabric.IEvent) => {
    if (!awaitingPlacementRef.current) return;
    awaitingPlacementRef.current = false;
    const pointer = fabricRef.current?.getPointer(e.e);
    if (pointer) pasteAtPosition(pointer);
  };

  // Export clipboard functions
  const handleCopy = () => {
    if (!fabricRef.current) return;
    
    const activeObjects = fabricRef.current.getActiveObjects();
    if (!activeObjects.length) return;

    clipboardDataRef.current = activeObjects.map((obj) =>
      obj.toObject(["left", "top", "scaleX", "scaleY", "angle"])
    );
    toast.success("Object copied");
  };

  const calculatePastePosition = (originalLeft: number, originalTop: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return { left: originalLeft, top: originalTop };

    const vpt = canvas.viewportTransform;
    if (!vpt) return { left: originalLeft, top: originalTop };

    return {
      left: originalLeft,
      top: originalTop,
    };
  };

  return {
    clipboardDataRef,
    pastePosition,
    setPastePosition,
    handleCanvasClick,
    handleCopy,
    calculatePastePosition,
    awaitingPlacementRef,
  };
};
