import { Canvas, util, FabricObject } from "fabric";
import { useCallback } from "react";
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
    lastCopyTimeRef,
    activeBoard
  } = useInternalClipboard(fabricRef);

  // Get all external clipboard functionality
  const { 
    handleExternalPaste, 
    tryExternalPaste: rawTryExternalPaste, 
    addImageFromBlob,
    lastExternalCopyTimeRef 
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

    // Compare timestamps to determine which clipboard is more recent
    const internalTime = lastCopyTimeRef.current || 0;
    const externalTime = lastExternalCopyTimeRef.current || 0;
    
    console.log("Clipboard timestamps - Internal:", internalTime, "External:", externalTime);
    
    // If internal clipboard is more recent and has data, use it
    if (internalTime > externalTime && clipboardDataRef.current && clipboardDataRef.current.length) {
      console.log("Using internal clipboard data (more recent) for paste");
      pasteInternal(clipboardDataRef.current);
    } else {
      // Otherwise try external paste (which will check if there's external data)
      console.log("Trying external paste (more recent or no internal data)");
      rawTryExternalPaste();
    }
  }, [rawTryExternalPaste, clipboardDataRef, fabricRef, lastCopyTimeRef, lastExternalCopyTimeRef, isActiveBoard, startPasteOperation]);

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

  // Add a centralized paste event handler
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
        
        // Compare timestamps to determine which clipboard is more recent
        const internalTime = lastCopyTimeRef.current || 0;
        const externalTime = lastExternalCopyTimeRef.current || 0;
        
        console.log("Clipboard timestamps - Internal:", internalTime, "External:", externalTime);
        
        // If internal clipboard is more recent and has data, use it
        if (internalTime > externalTime && clipboardDataRef.current && clipboardDataRef.current.length) {
          console.log("Using internal clipboard data (more recent) for paste");
          pasteInternal(clipboardDataRef.current);
        } else {
          // Otherwise try external paste
          console.log("Trying external paste (more recent or no internal data)");
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
  }, [tryExternalPaste, clipboardDataRef, pasteInternal, fabricRef, rawTryExternalPaste, lastCopyTimeRef, lastExternalCopyTimeRef, isActiveBoard, startPasteOperation]);

  return { 
    pasteInternal,
    tryExternalPaste,
    addImageFromBlob
  };
};
