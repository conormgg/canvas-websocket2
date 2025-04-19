
import { Canvas, util, FabricObject } from 'fabric';

export const useCanvasClipboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const handleCopy = (e: KeyboardEvent) => {
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
    const canvas = fabricRef.current;
    if (!canvas || !e.ctrlKey || e.key !== 'v') return;
    if (!(canvas as any).clipboardJSON) return;
    
    const clipboardJSON = (canvas as any).clipboardJSON;
    
    util.enlivenObjects(clipboardJSON, {
      crossOrigin: 'anonymous'
    }, (objects: FabricObject[]) => {
      objects.forEach(obj => {
        if ('left' in obj && 'top' in obj) {
          obj.set({
            left: (obj.left || 0) + 20,
            top: (obj.top || 0) + 20,
            evented: true
          });
          
          canvas.add(obj);
          canvas.setActiveObject(obj);
        }
      });
      
      canvas.requestRenderAll();
    });
  };

  return { handleCopy, handlePaste };
};
