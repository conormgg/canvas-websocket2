
import { useEffect } from 'react';
import { Canvas, Point } from 'fabric';
import { useClipboardContext } from '@/context/ClipboardContext';
import { WhiteboardId } from '@/types/canvas';

export const useKeyboardShortcuts = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, setActiveCanvas } = useClipboardContext();

  useEffect(() => {
    // Track the last interaction position for pasting
    let lastInteractionPosition: Point | null = null;
    let longPressTimeout: NodeJS.Timeout;
    const LONG_PRESS_DURATION = 500; // 500ms for long press

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

    const handleKeyboard = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      try {
        // Get board ID and update active canvas
        const boardId = getBoardId();
        setActiveCanvas(canvas, boardId);

        // Copy (Ctrl/Cmd + C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          
          // Check if there are actually selected objects
          const activeObjects = canvas.getActiveObjects();
          console.log("Copy attempt with selected objects:", activeObjects.length);
          
          // Only copy if there are selected objects
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
          const pastePosition = lastInteractionPosition || new Point(canvas.width! / 2, canvas.height! / 2);
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

    // Handle touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Start long press timer
      longPressTimeout = setTimeout(() => {
        const touch = e.touches[0];
        if (!touch) return;

        try {
          const canvasEl = canvas.getElement();
          if (!canvasEl) return;

          const rect = canvasEl.getBoundingClientRect();
          lastInteractionPosition = new Point(
            (touch.clientX - rect.left) / canvas.getZoom(),
            (touch.clientY - rect.top) / canvas.getZoom()
          );

          const boardId = canvasEl.dataset?.boardId as WhiteboardId | undefined;
          setActiveCanvas(canvas, boardId);

          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length > 0) {
            copySelectedObjects(canvas);
          }
        } catch (err) {
          console.error('Error in touch handler:', err);
        }
      }, LONG_PRESS_DURATION);
    };

    const handleTouchEnd = () => {
      clearTimeout(longPressTimeout);
    };

    const handleDoubleTap = (e: TouchEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const touch = e.touches[0];
      if (!touch) return;

      try {
        const canvasEl = canvas.getElement();
        if (!canvasEl) return;

        const rect = canvasEl.getBoundingClientRect();
        const pastePosition = new Point(
          (touch.clientX - rect.left) / canvas.getZoom(),
          (touch.clientY - rect.top) / canvas.getZoom()
        );

        const boardId = canvasEl.dataset?.boardId as WhiteboardId | undefined;
        pasteToCanvas(canvas, pastePosition, boardId);
      } catch (err) {
        console.error('Error in double tap handler:', err);
      }
    };

    // Track clicks/touches for paste position
    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      try {
        if (!canvas.lowerCanvasEl || !canvas.upperCanvasEl) return;
        
        let canvasEl: HTMLCanvasElement | null = null;
        try {
          canvasEl = canvas.getElement();
        } catch (err) {
          console.warn('Could not get canvas element:', err);
          return;
        }
        
        if (!canvasEl) return;
        
        const rect = canvasEl.getBoundingClientRect();
        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
        
        lastInteractionPosition = new Point(
          (clientX - rect.left) / canvas.getZoom(),
          (clientY - rect.top) / canvas.getZoom()
        );
        
        // Update active canvas with board ID on interaction
        const boardId = canvasEl.dataset?.boardId as WhiteboardId | undefined;
        if (boardId) {
          setActiveCanvas(canvas, boardId);
        }
      } catch (err) {
        console.error('Error in interaction handler:', err);
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyboard);
    
    // Try to safely get canvas element and add event listeners
    let canvasEl: HTMLCanvasElement | null = null;
    try {
      const canvas = fabricRef.current;
      if (canvas && canvas.lowerCanvasEl && canvas.upperCanvasEl) {
        canvasEl = canvas.getElement();
      }
    } catch (err) {
      console.warn('Could not get canvas element during setup:', err);
    }
    
    // Only add event listeners if canvas element exists
    if (canvasEl) {
      canvasEl.addEventListener('click', handleInteraction as EventListener);
      canvasEl.addEventListener('touchstart', handleTouchStart as EventListener);
      canvasEl.addEventListener('touchend', handleTouchEnd as EventListener);
      canvasEl.addEventListener('touchstart', handleDoubleTap as EventListener);
    }

    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      if (canvasEl) {
        canvasEl.removeEventListener('click', handleInteraction as EventListener);
        canvasEl.removeEventListener('touchstart', handleTouchStart as EventListener);
        canvasEl.removeEventListener('touchend', handleTouchEnd as EventListener);
        canvasEl.removeEventListener('touchstart', handleDoubleTap as EventListener);
      }
      clearTimeout(longPressTimeout);
    };
  }, [fabricRef, copySelectedObjects, pasteToCanvas, setActiveCanvas]);
};
