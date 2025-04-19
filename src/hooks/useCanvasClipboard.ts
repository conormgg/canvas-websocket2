
import { Canvas, FabricObject, util } from 'fabric';
import { useEffect } from 'react';

export const useCanvasClipboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const handleCopy = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e.ctrlKey && e.key === 'c') {
      const activeObjects = canvas.getActiveObjects();
      if (!activeObjects.length) return;
      
      const objectsJSON = activeObjects.map(obj => obj.toObject());
      (canvas as any).clipboardJSON = objectsJSON;
    }
  };

  const handlePaste = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const canvas = fabricRef.current;
    if (!canvas || !e.ctrlKey || e.key !== 'v') return;
    
    const clipboardJSON: any[] = (canvas as any).clipboardJSON;
    if (!clipboardJSON?.length) return;

    const toEnliven = clipboardJSON.length > 1
      ? clipboardJSON
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

  useEffect(() => {
    window.addEventListener('keydown', handleCopy);
    window.addEventListener('keydown', handlePaste);
    
    return () => {
      window.removeEventListener('keydown', handleCopy);
      window.removeEventListener('keydown', handlePaste);
    };
  }, []);

  return { handleCopy, handlePaste };
};

