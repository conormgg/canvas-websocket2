import { Canvas, util, FabricObject } from "fabric";
import { useEffect, useCallback, useRef } from "react";
import { useInternalClipboard } from "./clipboard/useInternalClipboard";
import { useExternalClipboard } from "./clipboard/useExternalClipboard";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { toast } from "sonner";

export const useCanvasClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  // Track if a paste operation is in progress to prevent duplicates
  const pasteInProgressRef = useRef(false);

  const {
    clipboardDataRef,
    handleCanvasClick,
    handleCopy,
    calculatePastePosition,
    selectedPositionRef
  } = useInternalClipboard(fabricRef);

  // Get all external clipboard functionality
  const { handleExternalPaste, tryExternalPaste: rawTryExternalPaste, addImageFromBlob } = useExternalClipboard(fabricRef, clipboardDataRef);

  // Wrap the external paste function with additional handling
  const tryExternalPaste = useCallback(() => {
    // Prevent duplicate paste operations
    if (pasteInProgressRef.current) return;
    
    pasteInProgressRef.current = true;
    setTimeout(() => { pasteInProgressRef.current = false; }, 300); // Reset after short timeout
    
    // Check if this canvas is currently active
    const isActiveBoard = 
      fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
      fabricRef.current?.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
      
    if (!isActiveBoard) {
      console.log("Canvas not active, ignoring paste request");
      return;
    }
    
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
  }, [rawTryExternalPaste, clipboardDataRef, fabricRef]);

  /* ------------------------------------------------------------- */
  /*  Paste handler for internal objects                           */
  /* ------------------------------------------------------------- */
  const pasteInternal = useCallback((internalData: any[]) => {
    // Check if this canvas is active
    const isActiveBoard = 
      fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
      fabricRef.current?.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
      
    if (!isActiveBoard) {
      console.log("Canvas not active, ignoring internal paste");
      return;
    }
    
    const canvas = fabricRef.current;
    if (!canvas || !internalData?.length) {
      return;
    }

    console.log("Pasting internal objects on active board:", window.__wbActiveBoardId);
    const toEnliven = [...internalData];

    util
      .enlivenObjects(toEnliven)
      .then((objects: FabricObject[]) => {
        objects.forEach((obj: any) => {
          if (typeof obj !== "object") return;
          const originalLeft = typeof obj.left === "number" ? obj.left : 0;
          const originalTop = typeof obj.top === "number" ? obj.top : 0;
          // Fix the calculatePastePosition call to include the canvas argument
          const { left, top } = calculatePastePosition(
            canvas,
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
  }, [fabricRef, calculatePastePosition]);

  /* Attach click handler, etc. */
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.on("mouse:down", handleCanvasClick as any);
    return () => {
      canvas.off("mouse:down", handleCanvasClick as any);
    };
  }, [fabricRef, handleCanvasClick]);

  // Add a centralized paste event handler
  useEffect(() => {
    const handlePaste = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Prevent duplicate paste operations
        if (pasteInProgressRef.current) return;
        pasteInProgressRef.current = true;
        setTimeout(() => { pasteInProgressRef.current = false; }, 300);
        
        // Check if this canvas is active
        const isActiveBoard = 
          fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
          fabricRef.current?.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
          
        if (!isActiveBoard) {
          console.log("Canvas not active for keyboard paste");
          return;
        }
        
        e.preventDefault();
        
        // If we have internal clipboard data, use that first
        if (clipboardDataRef.current && clipboardDataRef.current.length) {
          console.log("Using internal clipboard data for paste");
          pasteInternal(clipboardDataRef.current);
        } else {
          // Otherwise try external paste
          console.log("No internal data, trying external paste");
          tryExternalPaste();
        }
      }
    };
    
    document.addEventListener('keydown', handlePaste);
    return () => document.removeEventListener('keydown', handlePaste);
  }, [tryExternalPaste, clipboardDataRef, pasteInternal, fabricRef]);

  return { 
    pasteInternal,
    tryExternalPaste,
    addImageFromBlob
  };
};
