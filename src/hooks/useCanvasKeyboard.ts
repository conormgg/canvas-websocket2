
import { Canvas, Point } from "fabric";
import { useEffect } from 'react';
import { useClipboardContext } from '@/context/ClipboardContext';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, setActiveCanvas } = useClipboardContext();
  
  // Track the last clicked position for pasting
  let lastClickPosition: Point | null = null;
  
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
        // For keyboard events, paste to the last clicked position or center if not available
        const pastePosition = lastClickPosition || new Point(canvas.width! / 2, canvas.height! / 2);
        pasteToCanvas(canvas, pastePosition);
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

    // Add a click listener to track where the user last clicked
    const handleCanvasClick = (e: MouseEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      // Get the canvas element
      const canvasEl = canvas.getElement();
      
      // Calculate the position relative to the canvas
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Store this position for paste operations
      lastClickPosition = new Point(
        x / canvas.getZoom(), 
        y / canvas.getZoom()
      );
    };

    // Add both event listeners
    document.addEventListener('keydown', handleKeyDown);
    
    // Get the canvas element and add a click listener
    const canvasEl = fabricRef.current?.getElement();
    if (canvasEl) {
      canvasEl.addEventListener('click', handleCanvasClick);
    }

    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (canvasEl) {
        canvasEl.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [fabricRef, copySelectedObjects, pasteToCanvas, setActiveCanvas]);

  return {};
};
