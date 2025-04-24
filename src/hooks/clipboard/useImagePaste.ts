
import { Canvas, Point, Image as FabricImage } from "fabric";
import { useCallback } from "react";
import { toast } from "sonner";

export const useImagePaste = (fabricRef: React.MutableRefObject<Canvas | null>) => {
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

  return { addImageFromBlob };
};
