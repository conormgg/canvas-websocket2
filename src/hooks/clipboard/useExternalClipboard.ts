
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

  const tryExternalPaste = useCallback(() => {
    toast("Accessing clipboard...");
    
    const isActiveBoard = window.__wbActiveBoard === fabricRef.current?.upperCanvasEl;
    if (!isActiveBoard) return;
    
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
  }, [fabricRef, posRef, addImageFromBlob]);

  const handleExternalPaste = useCallback((e: ClipboardEvent) => {
    const isActiveBoard = 
      fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
      window.__wbActiveBoardId === boardIdRef.current;
    
    if (!isActiveBoard) return;

    if (internalClipboardRef.current && internalClipboardRef.current.length) {
      return;
    }

    const canvas = fabricRef.current;
    if (!canvas) return;

    e.preventDefault();

    const blob = clipboardAccess.getImageFromClipboardEvent(e);
    if (blob) {
      const pointer = canvas.getPointer(e as any);
      const pastePoint: SimplePoint = pointer || posRef.current || { x: canvas.width! / 2, y: canvas.height! / 2 };
      addImageFromBlob(blob, pastePoint);
    } else {
      toast("No image found in clipboard data");
    }
  }, [fabricRef, internalClipboardRef, boardIdRef, posRef, addImageFromBlob]);

  return { handleExternalPaste, tryExternalPaste, addImageFromBlob };
};
