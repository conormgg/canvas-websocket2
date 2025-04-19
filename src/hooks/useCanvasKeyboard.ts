
import { Canvas, util } from 'fabric';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Handle delete and backspace keys
    if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObjects().length > 0) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }

    // Handle copy (Ctrl + C)
    if (e.ctrlKey && e.key === 'c') {
      const activeObjects = canvas.getActiveObjects();
      if (!activeObjects.length) return;
      
      const objectsJSON = activeObjects.map(obj => obj.toObject());
      (canvas as any).clipboardJSON = objectsJSON;
    }

    // Handle paste (Ctrl + V)
    if (e.ctrlKey && e.key === 'v') {
      if (!(canvas as any).clipboardJSON) return;
      
      const clipboardJSON = (canvas as any).clipboardJSON;
      
      util.enlivenObjects(clipboardJSON, {
        clipPath: true,
        async: true,
        crossOrigin: 'anonymous'
      }).then((objects) => {
        objects.forEach(obj => {
          obj.set({
            left: (obj.left || 0) + 20,
            top: (obj.top || 0) + 20,
            evented: true
          });
          
          canvas.add(obj);
          canvas.setActiveObject(obj);
        });
        
        canvas.requestRenderAll();
      });
    }
  };

  return { handleKeyDown };
};
