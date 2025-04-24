
import { useEffect } from 'react';
import { Canvas, Point } from 'fabric';
import { useClipboardContext } from '@/context/ClipboardContext';

export const useKeyboardShortcuts = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, setActiveCanvas } = useClipboardContext();

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Update active canvas reference
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
        const centerX = canvas.width! / 2;
        const centerY = canvas.height! / 2;
        // Create a proper Fabric.js Point object
        const centerPoint = new Point(centerX, centerY);
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

    document.addEventListener('keydown', handleKeyboard);
    return () => {
      document.removeEventListener('keydown', handleKeyboard);
    };
  }, [fabricRef, copySelectedObjects, pasteToCanvas, setActiveCanvas]);
};
