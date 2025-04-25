
import { Canvas, Point } from "fabric";
import { useEffect } from 'react';
import { useClipboardContext } from '@/context/ClipboardContext';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, setActiveCanvas } = useClipboardContext();
  
  useEffect(() => {
    // Track the last clicked position for pasting
    let lastClickPosition: Point | null = null;

    // Only set up event handlers if the canvas reference exists
    if (!fabricRef.current) return;
    
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
        const pastePosition = lastClickPosition || 
          new Point(canvas.width! / 2, canvas.height! / 2);
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
      
      try {
        // Check if canvas is properly initialized
        if (!canvas.lowerCanvasEl || !canvas.upperCanvasEl) return;
        
        // Try to safely get the canvas element
        let canvasEl: HTMLCanvasElement | null = null;
        try {
          canvasEl = canvas.getElement();
        } catch (err) {
          console.warn('Could not get canvas element:', err);
          return;
        }
        
        if (!canvasEl) return;  // Guard against missing element
        
        // Calculate the position relative to the canvas
        const rect = canvasEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Store this position for paste operations
        lastClickPosition = new Point(
          x / canvas.getZoom(), 
          y / canvas.getZoom()
        );
      } catch (err) {
        console.error('Error in canvas click handler:', err);
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Try to safely get canvas element and add click listener if possible
    let canvasEl: HTMLCanvasElement | null = null;
    try {
      // Check if canvas has required properties first
      const canvas = fabricRef.current;
      if (canvas && canvas.lowerCanvasEl && canvas.upperCanvasEl) {
        canvasEl = canvas.getElement();
      }
    } catch (err) {
      console.warn('Could not get canvas element during setup:', err);
    }
    
    // Only add click listener if the canvas element exists
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
