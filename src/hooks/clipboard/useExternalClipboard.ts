
import { Canvas, Point } from "fabric";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useImagePaste } from "./useImagePaste";
import { usePositionTracking } from "./usePositionTracking";

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
    
    if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
      navigator.clipboard.read()
        .then((clipboardItems) => {
          let foundImage = false;
          
          for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
              if (type.startsWith("image/")) {
                foundImage = true;
                clipboardItem.getType(type).then((blob) => {
                  const canvas = fabricRef.current;
                  if (!canvas) return;
                  
                  if (posRef.current) {
                    addImageFromBlob(blob, posRef.current);
                  } else {
                    const center = new Point(canvas.width! / 2, canvas.height! / 2);
                    addImageFromBlob(blob, center);
                  }
                });
                return;
              }
            }
          }
          
          if (!foundImage) {
            toast.error("No image found in clipboard");
          }
        })
        .catch((err) => {
          console.error("Clipboard access error:", err);
          toast.error("Could not access clipboard. Try clicking on the canvas first.");
        });
    } else {
      toast.error("Clipboard API not supported in this browser");
    }
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

    if (e.clipboardData?.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        if (e.clipboardData.items[i].type.indexOf("image") !== -1) {
          const blob = e.clipboardData.items[i].getAsFile();
          if (blob) {
            const pointer = canvas.getPointer(e as any) || posRef.current;
            const pastePoint = pointer || new Point(canvas.width! / 2, canvas.height! / 2);
            addImageFromBlob(blob, pastePoint);
            return;
          }
        }
      }
    }
    
    toast("No image found in clipboard data");
  }, [fabricRef, internalClipboardRef, boardIdRef, posRef, addImageFromBlob]);

  useEffect(() => {
    document.addEventListener('paste', handleExternalPaste);
    return () => document.removeEventListener('paste', handleExternalPaste);
  }, [handleExternalPaste]);

  return { handleExternalPaste, tryExternalPaste, addImageFromBlob };
};
