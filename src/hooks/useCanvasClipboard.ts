import { Canvas, util, FabricObject } from "fabric";
import { useCallback, useEffect } from "react";
import { useInternalClipboard } from "./clipboard/useInternalClipboard";
import { useExternalClipboard } from "./clipboard/useExternalClipboard";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { toast } from "sonner";
import { usePasteProgress } from "./clipboard/usePasteProgress";
import { useClipboardSource } from "./clipboard/useClipboardSource";
import { useClipboardContext } from "@/context/ClipboardContext";

export const useCanvasClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const { shouldUseInternalClipboard, isActiveBoard } = useClipboardSource(fabricRef);
  
  const {
    clipboardDataRef,
    handleCanvasClick,
    handleCopy,
    calculatePastePosition,
    selectedPositionRef,
    activeBoard
  } = useInternalClipboard(fabricRef);

  // Get all external clipboard functionality
  const { 
    handleExternalPaste, 
    tryExternalPaste: rawTryExternalPaste, 
    addImageFromBlob
  } = useExternalClipboard(fabricRef, clipboardDataRef);

  // Get paste progress tracking
  const { startPasteOperation } = usePasteProgress();

  // Wrap the external paste function with additional handling
  const tryExternalPaste = useCallback(() => {
    // Prevent duplicate paste operations
    if (!startPasteOperation()) return;
    
    // Check if this canvas is currently active
    if (!isActiveBoard()) {
      console.log("Canvas not active, ignoring paste request");
      return;
    }

    // Check if internal clipboard has data first
    if (clipboardDataRef.current && clipboardDataRef.current.length) {
      console.log("Using internal clipboard data for paste");
      pasteInternal(clipboardDataRef.current);
    } else {
      // If internal clipboard is empty, try external paste
      console.log("Internal clipboard is empty, trying external paste");
      rawTryExternalPaste();
    }
  }, [rawTryExternalPaste, clipboardDataRef, fabricRef, isActiveBoard, startPasteOperation]);

  /* ------------------------------------------------------------- */
  /*  Paste handler for internal objects                           */
  /* ------------------------------------------------------------- */
  const pasteInternal = useCallback((internalData: any[]) => {
    // Check if this canvas is active
    if (!isActiveBoard()) {
      console.log("Canvas not active, ignoring internal paste");
      return;
    }
    
    const canvas = fabricRef.current;
    if (!canvas || !internalData?.length) {
      return;
    }

    console.log("Pasting internal objects on active board:", window.__wbActiveBoardId);
    console.log("Object data to paste:", internalData);
    const toEnliven = [...internalData];

    util
      .enlivenObjects(toEnliven)
      .then((objects: FabricObject[]) => {
        objects.forEach((obj: any) => {
          if (typeof obj !== "object") return;
          const originalLeft = typeof obj.left === "number" ? obj.left : 0;
          const originalTop = typeof obj.top === "number" ? obj.top : 0;
          
          let pastePosition = { left: originalLeft, top: originalTop };
          
          // If we have a selected position (from a click), use that instead
          if (selectedPositionRef.current) {
            pastePosition = {
              left: selectedPositionRef.current.x,
              top: selectedPositionRef.current.y
            };
            // Add slight offset for multiple pastes
            selectedPositionRef.current.x += 10;
            selectedPositionRef.current.y += 10;
          } else {
            // Otherwise use the calculated paste position
            pastePosition = calculatePastePosition(
              canvas,
              originalLeft,
              originalTop
            );
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
        toast.success("Object pasted");
      })
      .catch((err) => {
        console.error("Paste failed:", err);
        toast.error("Failed to paste object");
      });
  }, [fabricRef, calculatePastePosition, selectedPositionRef, isActiveBoard]);

  /* Attach click handler, etc. */
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.on("mouse:down", handleCanvasClick as any);
    return () => {
      canvas.off("mouse:down", handleCanvasClick as any);
    };
  }, [fabricRef, handleCanvasClick]);

  useEffect(() => {
    const handlePaste = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        console.log("Ctrl+V detected, initiating paste operation");
        
        // Prevent duplicate paste operations
        if (!startPasteOperation()) return;
        
        // Check if this canvas is active
        if (!isActiveBoard()) {
          console.log("Canvas not active for keyboard paste");
          return;
        }
        
        e.preventDefault();
        
        // Check internal clipboard first
        if (clipboardDataRef.current && clipboardDataRef.current.length) {
          console.log("Using internal clipboard data for paste");
          pasteInternal(clipboardDataRef.current);
        } else {
          // Try external paste if internal clipboard is empty
          console.log("Internal clipboard is empty, trying external paste");
          rawTryExternalPaste();
        }
      }
    };
    
    document.addEventListener('keydown', handlePaste);
    console.log("Paste event listener added");
    
    return () => {
      document.removeEventListener('keydown', handlePaste);
      console.log("Paste event listener removed");
    };
  }, [tryExternalPaste, clipboardDataRef, pasteInternal, fabricRef, rawTryExternalPaste, isActiveBoard, startPasteOperation]);

  return { 
    pasteInternal,
    tryExternalPaste,
    addImageFromBlob
  };
};
