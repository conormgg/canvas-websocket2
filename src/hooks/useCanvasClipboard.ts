
import { Canvas, util, FabricObject } from "fabric";
import { useEffect } from "react";
import { useInternalClipboard } from "./clipboard/useInternalClipboard";
import { useExternalClipboard } from "./clipboard/useExternalClipboard";
import { clipboardUtils } from "@/utils/clipboardUtils";

export const useCanvasClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const {
    clipboardDataRef,
    handleCanvasClick,
    handleCopy,
    calculatePastePosition,
    awaitingPlacementRef,
  } = useInternalClipboard(fabricRef);

  // Pass proper arguments to useExternalClipboard
  useExternalClipboard(fabricRef, clipboardDataRef);

  /* ------------------------------------------------------------- */
  /*  Paste handler for internal objects                           */
  /* ------------------------------------------------------------- */
  const pasteInternal = (internalData: any[]) => {
    const canvas = fabricRef.current;
    if (!canvas || !internalData?.length) {
      return;
    }

    const toEnliven = [...internalData];

    util
      .enlivenObjects(toEnliven)
      .then((objects: FabricObject[]) => {
        objects.forEach((obj: any) => {
          if (typeof obj !== "object") return;
          const originalLeft = typeof obj.left === "number" ? obj.left : 0;
          const originalTop = typeof obj.top === "number" ? obj.top : 0;
          const { left, top } = calculatePastePosition(
            originalLeft,
            originalTop
          );

          if (typeof obj.set === "function") {
            obj.set({ left, top, evented: true });
            canvas.add(obj);
            if (typeof obj.setCoords === "function") obj.setCoords();
          }
        });

        clipboardUtils.selectPastedObjects(canvas, objects);
        canvas.requestRenderAll();
      })
      .catch((err) => {
        console.error("Paste failed:", err);
      });
  };

  /* Attach click handler, etc. (rest of hook unchanged) */
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.on("mouse:down", handleCanvasClick as any);
    return () => {
      canvas.off("mouse:down", handleCanvasClick as any);
    };
  }, [fabricRef, handleCanvasClick]);

  return { pasteInternal };
};
