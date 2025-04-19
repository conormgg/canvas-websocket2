
import { Canvas } from 'fabric';

export const useCanvasDeletion = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const handleDelete = (e: KeyboardEvent) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObjects().length > 0) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  return { handleDelete };
};
