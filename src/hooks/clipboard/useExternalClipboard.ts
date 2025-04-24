
import { Canvas, Image as FabricImage, Point } from "fabric";
import { useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

declare global {
  /* eslint-disable-next-line no-var */
  var __wbActiveBoard: HTMLElement | null | undefined;
}

export const useExternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  internalClipboardRef: React.MutableRefObject<any[] | null> = { current: null }
) => {
  /* -------- keep freshest click position -------- */
  const posRef = useRef<Point | null>(null);

  /* -------- mark this board as the active target -------- */
  useEffect(() => {
    const view = fabricRef.current?.upperCanvasEl;
    if (!view) return;
    const setActive = () => (window.__wbActiveBoard = view);
    view.addEventListener("pointerdown", setActive);
    return () => view.removeEventListener("pointerdown", setActive);
  }, [fabricRef.current]);

  /* Function to try pasting external clipboard content */
  const tryExternalPaste = useCallback(() => {
    toast("Accessing clipboard...");
    
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
            toast("No image found in clipboard");
          }
        })
        .catch((err) => {
          console.error("Clipboard access error:", err);
          toast.error("Could not access clipboard. Try clicking on the canvas first.");
        });
    } else {
      toast.error("Clipboard API not supported in this browser");
    }
  }, [fabricRef]);

  /* ------------------------------------------------------- */
  /*  DOM "paste" event handler – runs in every board        */
  /* ------------------------------------------------------- */
  const handleExternalPaste = useCallback((e: ClipboardEvent) => {
    /* 1️⃣  Only handle if this is the board user clicked last */
    if (fabricRef.current?.upperCanvasEl !== window.__wbActiveBoard) return;

    /* 2️⃣  Give priority to internal clipboard: if it has data,
           skip processing the external image.                 */
    if (internalClipboardRef.current && internalClipboardRef.current.length) {
      return; // internal handler will deal with this Ctrl‑V
    }

    /* Need a click first */
    const canvas = fabricRef.current;
    if (!canvas) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes("image")) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault(); // stop default
          const pointer = canvas.getPointer(e as any);
          posRef.current = pointer;
          addImageFromBlob(blob, pointer);
          break; // handle only one image
        }
      }
    }
  }, [fabricRef, internalClipboardRef]);

  /* -------- helper to drop FabricImage at point p -------- */
  const addImageFromBlob = useCallback((blob: Blob, p: Point) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (!url) return;
      FabricImage.fromURL(url).then((img) => {
        img.scale(0.5);
        img.set({
          left: p.x - ((img.width || 0) * (img.scaleX || 1)) / 2,
          top: p.y - ((img.height || 0) * (img.scaleY || 1)) / 2,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        toast.success("Image pasted successfully");
      });
    };
    reader.readAsDataURL(blob);
  }, [fabricRef]);
  
  // Register the paste event listener
  useEffect(() => {
    document.addEventListener("paste", handleExternalPaste);
    return () => document.removeEventListener("paste", handleExternalPaste);
  }, [handleExternalPaste]);

  return { handleExternalPaste, tryExternalPaste, addImageFromBlob };
};
