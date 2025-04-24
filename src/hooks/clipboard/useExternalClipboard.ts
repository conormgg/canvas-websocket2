
import { Canvas } from "fabric";
import { useCallback } from "react";
import { toast } from "sonner";
import { useImagePaste, SimplePoint } from "./useImagePaste";
import { usePositionTracking } from "./usePositionTracking";
import { clipboardAccess } from "@/utils/clipboardAccess";

export const useExternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  internalClipboardRef: React.MutableRefObject<any[] | null> = { current: null }
) => {
  const { addImageFromBlob } = useImagePaste(fabricRef);
  const { posRef, boardIdRef } = usePositionTracking(fabricRef);

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

    if (internalClipboardRef.current && internalClipboardRef.current.length) {
      console.log("Using internal clipboard data, ignoring external paste");
      return;
    }

    const canvas = fabricRef.current;
    if (!canvas) return;

    e.preventDefault();
    e.stopPropagation();  // Add this to prevent multiple boards from handling the same event

    const blob = clipboardAccess.getImageFromClipboardEvent(e);
    if (blob) {
      const pointer = canvas.getPointer(e as any);
      const pastePoint: SimplePoint = pointer || posRef.current || { x: canvas.width! / 2, y: canvas.height! / 2 };
      console.log("Pasting external image at position:", pastePoint);
      addImageFromBlob(blob, pastePoint);
    } else {
      console.log("No image found in clipboard data");
      toast("No image found in clipboard data");
    }
  }, [fabricRef, internalClipboardRef, posRef, addImageFromBlob, isActiveBoard]);

  return { handleExternalPaste, tryExternalPaste, addImageFromBlob };
};
