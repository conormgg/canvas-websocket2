
import { Canvas, FabricObject, Image as FabricImage, util } from 'fabric';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const useCanvasClipboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  // Handle internal copy via Ctrl+C
  const handleCopy = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e.ctrlKey && e.key === 'c') {
      const activeObjects = canvas.getActiveObjects();
      if (!activeObjects.length) return;
      
      // Always overwrite the clipboard, never append
      (canvas as any).clipboardJSON = activeObjects.map(obj => obj.toObject());
    }
  };

  // Handle internal paste via Ctrl+V
  const handlePaste = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const canvas = fabricRef.current;
    if (!canvas || !e.ctrlKey || e.key !== 'v') return;
    
    const clipboardJSON: any[] = (canvas as any).clipboardJSON;
    if (!clipboardJSON?.length) return;

    // If multi-select copy, use all; if single, use the last one only
    const toEnliven = clipboardJSON.length > 1
      ? [...clipboardJSON] // Create a copy to prevent modifying original
      : [clipboardJSON[clipboardJSON.length - 1]];

    util.enlivenObjects(toEnliven).then((objects: FabricObject[]) => {
      objects.forEach(obj => {
        const left = (obj.get('left') || 0) + 20;
        const top = (obj.get('top') || 0) + 20;
        obj.set({ left, top, evented: true });
        canvas.add(obj);
        obj.setCoords();
      });

      if (objects.length === 1) {
        canvas.setActiveObject(objects[0]);
      } else {
        canvas.discardActiveObject();
      }

      canvas.requestRenderAll();
    });
  };

  // Handle external clipboard content (images, etc.)
  const handleExternalPaste = (e: ClipboardEvent) => {
    if (!e.clipboardData || !fabricRef.current) return;
    
    const items = e.clipboardData.items;
    
    // Check if we have image data in the clipboard
    let hasImageData = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        hasImageData = true;
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

    // If we processed image data, prevent default to avoid double paste
    if (hasImageData) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    // Set up keyboard event listeners for internal copy/paste
    window.addEventListener('keydown', handleCopy);
    window.addEventListener('keydown', handlePaste);
    
    // Set up clipboard event listener for external content
    document.addEventListener('paste', handleExternalPaste);
    
    return () => {
      window.removeEventListener('keydown', handleCopy);
      window.removeEventListener('keydown', handlePaste);
      document.removeEventListener('paste', handleExternalPaste);
    };
  }, []);

  return { handleCopy, handlePaste };
};
