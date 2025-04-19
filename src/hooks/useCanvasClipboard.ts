
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
    
    const clipboardJSON: any[] = (canvas as any).clipboardJSON;
    if (!clipboardJSON?.length) return;

    // Decide which JSONs to enliven:
    const toEnliven = clipboardJSON.length > 1
      ? clipboardJSON                  // multiple selected → paste all
      : [clipboardJSON[clipboardJSON.length - 1]];  // single → paste only last

    util.enlivenObjects(toEnliven).then((objects: FabricObject[]) => {
      // Add each resurrected object, offset slightly to avoid overlap
      objects.forEach(obj => {
        const left = (obj.get('left') || 0) + 20;
        const top = (obj.get('top') || 0) + 20;
        obj.set({ left, top, evented: true });
        canvas.add(obj);
        obj.setCoords();
      });

      // If it was just one object, make it active; otherwise clear selection
      if (objects.length === 1) {
        canvas.setActiveObject(objects[0]);
      } else {
        canvas.discardActiveObject();
      }

      canvas.requestRenderAll();
    });
  };

  return { handleCopy, handlePaste };
};

