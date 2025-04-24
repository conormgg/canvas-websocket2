
import { Canvas } from 'fabric';
import { useEffect } from 'react';
import { useClipboardContext } from '@/context/ClipboardContext';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, setActiveCanvas } = useClipboardContext();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      // Update active canvas on any keyboard interaction
      setActiveCanvas(canvas);
      
      // Copy (Ctrl/Cmd + C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelectedObjects(canvas);
        return;
      }

      // Paste (Ctrl/Cmd + V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        // For keyboard events, paste to the center of the viewport
        const centerPoint = { 
          x: canvas.width! / 2, 
          y: canvas.height! / 2 
        };
        pasteToCanvas(canvas, centerPoint);
        return;
      }

      // Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          e.preventDefault();
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fabricRef, copySelectedObjects, pasteToCanvas, setActiveCanvas]);

  return {};
};
