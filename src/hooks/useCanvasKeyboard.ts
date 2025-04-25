
import { Canvas, Point } from "fabric";
import { useEffect } from 'react';
import { useClipboardContext } from '@/context/ClipboardContext';
import { WhiteboardId } from "@/types/canvas";

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, setActiveCanvas, activeBoardId } = useClipboardContext();
  
  useEffect(() => {
    // Track the last clicked position for pasting
    let lastClickPosition: Point | null = null;
    // Get the board ID from the canvas element if available
    let getBoardId = (): WhiteboardId | undefined => {
      try {
        const canvas = fabricRef.current;
        if (!canvas) return undefined;
        
        const element = canvas.getElement();
        return element?.dataset?.boardId as WhiteboardId | undefined;
      } catch (err) {
        console.warn('Could not get board ID:', err);
        return undefined;
      }
    };

    // Only set up event handlers if the canvas reference exists
    if (!fabricRef.current) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      try {
        // Get board ID from canvas element
        const boardId = getBoardId();
        
        // Only process keyboard shortcuts if this is the active board
        // This prevents all boards from responding to the same shortcut
        if (boardId !== activeBoardId) {
          return;
        }
        
        console.log(`Keyboard event on board ${boardId}, active board is ${activeBoardId}`);
        
        // Copy (Ctrl/Cmd + C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          
          // Check if there are actually selected objects
          const activeObjects = canvas.getActiveObjects();
          console.log("Copy attempt with selected objects:", activeObjects.length);
          
          // Check if we have selected objects in path mode
          if (activeObjects && activeObjects.length > 0) {
            copySelectedObjects(canvas);
          } else {
            console.log("No objects selected for copy");
          }
          return;
        }

        // Paste (Ctrl/Cmd + V)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
          // For keyboard events, paste to the last clicked position or center if not available
          const pastePosition = lastClickPosition || 
            new Point(canvas.width! / 2, canvas.height! / 2);
          pasteToCanvas(canvas, pastePosition, boardId);
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
      } catch (err) {
        console.error("Error in keyboard handler:", err);
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
        
        // Get and update board ID
        const boardId = canvasEl.dataset?.boardId as WhiteboardId | undefined;
        if (boardId) {
          console.log(`Canvas click on board: ${boardId}`);
          setActiveCanvas(canvas, boardId);
        }
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
  }, [fabricRef, copySelectedObjects, pasteToCanvas, setActiveCanvas, activeBoardId]);

  return {};
};
