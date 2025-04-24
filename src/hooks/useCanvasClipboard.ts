
import { Canvas, util, FabricObject } from "fabric";
import { useEffect, useCallback } from "react";
import { useInternalClipboard } from "./clipboard/useInternalClipboard";
import { useExternalClipboard } from "./clipboard/useExternalClipboard";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { toast } from "sonner";

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

  // Get all external clipboard functionality
  const { handleExternalPaste, tryExternalPaste: rawTryExternalPaste, addImageFromBlob } = useExternalClipboard(fabricRef, clipboardDataRef);

  // Wrap the external paste function with additional handling
  const tryExternalPaste = useCallback(() => {
    // If there's internal clipboard data, clear it so external paste takes precedence
    if (clipboardDataRef.current && clipboardDataRef.current.length) {
      const shouldClearInternal = true; // Set to false if you want internal data to have priority
      
      if (shouldClearInternal) {
        console.log("Clearing internal clipboard data to allow external paste");
        clipboardDataRef.current = null;
      } else {
        toast.info("Using internal clipboard data (copied objects)");
        return; // Skip external paste and let internal paste handle it
      }
    }
    
    rawTryExternalPaste();
  }, [rawTryExternalPaste, clipboardDataRef]);

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

  /* Attach click handler, etc. */
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.on("mouse:down", handleCanvasClick as any);
    return () => {
      canvas.off("mouse:down", handleCanvasClick as any);
    };
  }, [fabricRef, handleCanvasClick]);

  // Add a global paste event handler to enhance paste detection
  useEffect(() => {
    const handlePaste = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // If we don't have internal clipboard data, try external paste
        if (!clipboardDataRef.current || clipboardDataRef.current.length === 0) {
          e.preventDefault();
          tryExternalPaste();
        }
      }
    };
    
    document.addEventListener('keydown', handlePaste);
    return () => document.removeEventListener('keydown', handlePaste);
  }, [tryExternalPaste, clipboardDataRef]);

  return { 
    pasteInternal,
    tryExternalPaste,
    addImageFromBlob
  };
};
