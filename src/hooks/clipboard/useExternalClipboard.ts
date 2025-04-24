
import { Canvas } from "fabric";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useImagePaste, SimplePoint } from "./useImagePaste";
import { usePositionTracking } from "./usePositionTracking";
import { clipboardAccess } from "@/utils/clipboardAccess";

// Define a more specific props interface for the hook
interface UseExternalClipboardProps {
  clipboardDataRef: React.MutableRefObject<any[] | null>;
  selectedPositionRef: React.MutableRefObject<any | null>;
  lastExternalCopyTimeRef: React.MutableRefObject<number>;
  isActiveBoard: (canvas: Canvas) => boolean;
  startPasteOperation: () => boolean;
}

export const useExternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  internalClipboardRef: React.MutableRefObject<any[] | null> = { current: null }
) => {
  const { addImageFromBlob } = useImagePaste(fabricRef);
  const { posRef, boardIdRef } = usePositionTracking(fabricRef);
  const lastExternalCopyTimeRef = useRef<number>(0); // Track when external copy occurs

  // Function to check if this is the active board
  const isActiveBoard = useCallback(() => {
    const canvasId = fabricRef.current?.lowerCanvasEl?.dataset.boardId;
    const activeElementId = window.__wbActiveBoardId;
    const activeCanvasEl = window.__wbActiveBoard;
    
    const upperCanvasIsActive = fabricRef.current?.upperCanvasEl === activeCanvasEl;
    const lowerCanvasIsActive = fabricRef.current?.lowerCanvasEl === activeCanvasEl;
    const idMatches = canvasId === activeElementId;
    
    console.log("Is active board check:", {
      upperCanvasIsActive,
      lowerCanvasIsActive,
      idMatches,
      canvasId,
      activeElementId
    });
    
    return upperCanvasIsActive || lowerCanvasIsActive || idMatches;
  }, [fabricRef]);

  const tryExternalPaste = useCallback(() => {
    toast("Accessing clipboard...");
    
    if (!isActiveBoard()) {
      console.log("Board not active, skipping paste");
      return;
    }
    
    clipboardAccess.readClipboard().then((blob) => {
      if (blob) {
        // When accessing external clipboard content, update the timestamp
        lastExternalCopyTimeRef.current = Date.now();
        console.log("External clipboard accessed at:", lastExternalCopyTimeRef.current);
        
        const canvas = fabricRef.current;
        if (!canvas) return;
        
        if (posRef.current) {
          addImageFromBlob(blob, posRef.current);
        } else {
          const center: SimplePoint = { x: canvas.width! / 2, y: canvas.height! / 2 };
          addImageFromBlob(blob, center);
        }
      }
    });
  }, [fabricRef, posRef, addImageFromBlob, isActiveBoard]);

  const handleExternalPaste = useCallback((e: ClipboardEvent) => {
    if (!isActiveBoard()) {
      console.log("Board not active, ignoring paste event");
      return;
    }

    const canvas = fabricRef.current;
    if (!canvas) return;

    e.preventDefault();
    e.stopPropagation();  // Add this to prevent multiple boards from handling the same event

    const blob = clipboardAccess.getImageFromClipboardEvent(e);
    if (blob) {
      // When accessing external clipboard content, update the timestamp
      lastExternalCopyTimeRef.current = Date.now();
      console.log("External clipboard accessed from event at:", lastExternalCopyTimeRef.current);
      
      const pointer = canvas.getPointer(e as any);
      const pastePoint: SimplePoint = pointer || posRef.current || { x: canvas.width! / 2, y: canvas.height! / 2 };
      console.log("Pasting external image at position:", pastePoint);
      addImageFromBlob(blob, pastePoint);
    } else {
      console.log("No image found in clipboard data");
      toast("No image found in clipboard data");
    }
  }, [fabricRef, posRef, addImageFromBlob, isActiveBoard]);

  return { 
    handleExternalPaste, 
    tryExternalPaste, 
    addImageFromBlob: useCallback((canvas: Canvas, blob: Blob, position: SimplePoint) => {
      if (canvas !== fabricRef.current) return;
      addImageFromBlob(blob, position);
    }, [addImageFromBlob, fabricRef]),
    lastExternalCopyTimeRef
  };
};
