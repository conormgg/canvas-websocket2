import { Canvas, Point } from 'fabric';
import { useEffect } from 'react';
import { useClipboardContext } from '@/context/ClipboardContext';
import { WhiteboardId } from '@/types/canvas';

export const useKeyboardHandlers = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, activeBoardId } = useClipboardContext();

  useEffect(() => {
    // Get board ID helper function
    const getBoardId = (): WhiteboardId | undefined => {
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
        const boardId = getBoardId();
        if (boardId !== activeBoardId) {
          return;
        }
        
        // Get the last pointer position or default to center
        let lastClickPosition: Point;
        
        try {
          // Try to get the pointer position from the canvas's internal state
          if (canvas.getActiveObject()) {
            // If there's an active object, use its center
            const activeObj = canvas.getActiveObject();
            lastClickPosition = new Point(
              activeObj.left! + (activeObj.width! * activeObj.scaleX!) / 2,
              activeObj.top! + (activeObj.height! * activeObj.scaleY!) / 2
            );
          } else {
            // Otherwise use the center of the canvas
            lastClickPosition = new Point(canvas.width! / 2, canvas.height! / 2);
          }
        } catch (err) {
          // Fallback to canvas center if we can't get a valid position
          console.warn('Using fallback position for paste:', err);
          lastClickPosition = new Point(canvas.width! / 2, canvas.height! / 2);
        }
        
        // Copy (Ctrl/Cmd + C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          const activeObjects = canvas.getActiveObjects();
          console.log("Copy attempt with selected objects:", activeObjects.length);
          
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
          pasteToCanvas(canvas, lastClickPosition, boardId);
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

    document.addEventListener('keydown', handleKeyboard);
    return () => {
      document.removeEventListener('keydown', handleKeyboard);
    };
  }, [fabricRef, copySelectedObjects, pasteToCanvas, activeBoardId]);
};
