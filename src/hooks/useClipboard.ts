
import { useEffect } from "react";
import { Canvas, Image as FabricImage } from "fabric";
import { toast } from "sonner";

export const useClipboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !fabricRef.current) return;
      
      const items = e.clipboardData.items;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          
          const reader = new FileReader();
          reader.onload = (event) => {
            const imgUrl = event.target?.result as string;
            if (!imgUrl) return;
            
            FabricImage.fromURL(imgUrl).then((img) => {
              img.scale(0.5);
              img.scaleToWidth(200);
              fabricRef.current?.add(img);
              fabricRef.current?.centerObject(img);
              fabricRef.current?.setActiveObject(img);
              fabricRef.current?.renderAll();
              toast("Image added to whiteboard");
            });
          };
          reader.readAsDataURL(blob);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [fabricRef]);
};
