
import { Canvas, Image as FabricImage, Point } from "fabric";
import { useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

declare global {
  /* eslint-disable-next-line no-var */
  var __wbActiveBoard: HTMLElement | null | undefined;
  var __wbActiveBoardId: string | null | undefined;
}

export const useExternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  internalClipboardRef: React.MutableRefObject<any[] | null> = { current: null }
) => {
  /* -------- keep freshest click position -------- */
  const posRef = useRef<Point | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const boardIdRef = useRef<string | null>(null);
  
  // Store the ID of this board's canvas for comparison
  useEffect(() => {
    if (fabricRef.current) {
      // Store a reference to this specific board's ID
      boardIdRef.current = fabricRef.current.lowerCanvasEl.dataset.boardId || null;
    }
  }, [fabricRef.current]);

  /* -------- track when user clicked on canvas -------- */
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    const handleCanvasClick = () => {
      lastClickTimeRef.current = Date.now();
      
      // Store last clicked position
      const pointer = canvas.getPointer({ clientX: 0, clientY: 0 } as any);
      posRef.current = pointer;
    };
    
    canvas.on('mouse:down', handleCanvasClick);
    return () => canvas.off('mouse:down', handleCanvasClick);
  }, [fabricRef.current]);

  /* Function to try pasting external clipboard content */
  const tryExternalPaste = useCallback(() => {
    toast("Accessing clipboard...");
    
    // Only proceed if this hook instance belongs to the active board
    const isActiveBoard = window.__wbActiveBoard === fabricRef.current?.upperCanvasEl;
    if (!isActiveBoard) {
      // This is not the active board, so don't process the paste
      return;
    }
    
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
          
          // Fallback to using document.execCommand for older browsers
          try {
            const textArea = document.createElement("textarea");
            textArea.style.position = "fixed";
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.width = "2em";
            textArea.style.height = "2em";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            
            const successful = document.execCommand('paste');
            if (successful) {
              toast.success("Attempted paste via legacy method");
            } else {
              toast.error("Clipboard access failed. Try clicking on the canvas first.");
            }
            
            document.body.removeChild(textArea);
          } catch (e) {
            toast.error("Could not access clipboard. Try clicking on the canvas first.");
          }
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
    const isActiveBoard = 
      fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
      window.__wbActiveBoardId === boardIdRef.current;
    
    if (!isActiveBoard) return;

    /* 2️⃣  Give priority to internal clipboard: if it has data,
           skip processing the external image.                 */
    if (internalClipboardRef.current && internalClipboardRef.current.length) {
      return; // internal handler will deal with this Ctrl‑V
    }

    /* Need a click first */
    const canvas = fabricRef.current;
    if (!canvas) return;

    e.preventDefault(); // Prevent default paste behavior

    // Try to get images from clipboard
    if (e.clipboardData?.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        if (e.clipboardData.items[i].type.indexOf("image") !== -1) {
          const blob = e.clipboardData.items[i].getAsFile();
          if (blob) {
            const pointer = canvas.getPointer(e as any) || posRef.current;
            const pastePoint = pointer || new Point(canvas.width! / 2, canvas.height! / 2);
            addImageFromBlob(blob, pastePoint);
            return; // Exit after handling the first image
          }
        }
      }
    }
    
    // If we got here, no image was found in clipboard
    toast("No image found in clipboard data");
  }, [fabricRef, internalClipboardRef, boardIdRef.current]);

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
        
        // Ensure coordinates are valid
        const x = typeof p.x === 'number' ? p.x : canvas.width! / 2;
        const y = typeof p.y === 'number' ? p.y : canvas.height! / 2;
        
        img.set({
          left: x - ((img.width || 0) * (img.scaleX || 1)) / 2,
          top: y - ((img.height || 0) * (img.scaleY || 1)) / 2,
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        toast.success("Image pasted successfully");
      }).catch(err => {
        console.error("Failed to load image:", err);
        toast.error("Failed to load image");
      });
    };
    reader.readAsDataURL(blob);
  }, [fabricRef]);
  
  // Register the paste event listener
  useEffect(() => {
    document.addEventListener("paste", handleExternalPaste);
    
    // Also handle the keyboard shortcut more directly
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+V to force external paste
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        
        // Only process if this is the active board
        const isActiveBoard = 
          fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
          window.__wbActiveBoardId === boardIdRef.current;
          
        if (isActiveBoard) {
          tryExternalPaste();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener("paste", handleExternalPaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleExternalPaste, tryExternalPaste, boardIdRef.current]);

  return { handleExternalPaste, tryExternalPaste, addImageFromBlob };
};
