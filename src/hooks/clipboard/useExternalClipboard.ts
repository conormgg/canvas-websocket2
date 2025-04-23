
import { Canvas, Image as FabricImage, Point } from "fabric";
import { useRef, useEffect } from "react";
import { toast } from "sonner";

declare global {
  /* eslint-disable-next-line no-var */
  var __wbActiveBoard: HTMLElement | null | undefined;
}

export const useExternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  pastePosition: Point | null,
  internalClipboardRef: React.MutableRefObject<any[] | null>
) => {
  const posRef = useRef<Point | null>(pastePosition);
  
  useEffect(() => {
    posRef.current = pastePosition;
  }, [pastePosition]);

  useEffect(() => {
    const view = fabricRef.current?.upperCanvasEl;
    if (!view) return;
    const setActive = () => (window.__wbActiveBoard = view);
    view.addEventListener("pointerdown", setActive);
    return () => view.removeEventListener("pointerdown", setActive);
  }, [fabricRef.current]);

  const handleExternalPaste = (e: ClipboardEvent) => {
    if (fabricRef.current?.upperCanvasEl !== window.__wbActiveBoard) return;

    // Skip if internal clipboard has data
    if (internalClipboardRef.current?.length) {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (!blob) continue;

        e.preventDefault();
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const imgUrl = event.target?.result as string;
          if (!imgUrl) return;

          FabricImage.fromURL(imgUrl).then((img) => {
            const canvas = fabricRef.current;
            if (!canvas) return;

            img.scale(0.5);
            
            // If we have a paste position, use it. Otherwise, center the image
            if (posRef.current) {
              img.set({
                left: posRef.current.x - ((img.width || 0) * (img.scaleX || 1)) / 2,
                top: posRef.current.y - ((img.height || 0) * (img.scaleY || 1)) / 2,
              });
            } else {
              img.scaleToWidth(200);
              canvas.centerObject(img);
            }

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            toast("External image pasted successfully");
          });
        };

        reader.readAsDataURL(blob);
        break; // Only handle the first image found
      }
    }
  };

  return { handleExternalPaste };
};
