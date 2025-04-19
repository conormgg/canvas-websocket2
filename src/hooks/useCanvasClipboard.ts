
import { Canvas, FabricObject, util } from 'fabric';

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
    
    util.enlivenObjects(clipboardJSON, {}, (objects: FabricObject[]) => {
      objects.forEach(obj => {
        // Check if object has position properties before setting them
        if ('left' in obj && 'top' in obj && obj instanceof FabricObject) {
          const left = (obj.get('left') || 0) + 20;
          const top = (obj.get('top') || 0) + 20;
          
          obj.set({
            left,
            top,
            evented: true
          });
          
          canvas.add(obj);
        }
      });
      
      if (objects.length > 0 && objects[0] instanceof FabricObject) {
        canvas.setActiveObject(objects[0]);
      }
      
      canvas.requestRenderAll();
    });
  };

  return { handleCopy, handlePaste };
};
