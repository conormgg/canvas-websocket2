
import { Canvas, Point } from 'fabric';
import { useEffect } from 'react';
import { useClipboardContext } from '@/context/ClipboardContext';
import { WhiteboardId } from '@/types/canvas';
import { useCanvasHistory } from '../useCanvasHistory';

export const useKeyboardHandlers = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, activeBoardId } = useClipboardContext();
  const { undo, redo, selectAll } = useCanvasHistory(fabricRef);

  useEffect(() => {
    // Track the last clicked position
    let lastClickPosition: Point | null = null;
    
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

    // Add click listener to track last click position
    const handleCanvasClick = (e: MouseEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      try {
        if (!canvas.upperCanvasEl) return;
        
        // Calculate click position relative to canvas
        const rect = canvas.upperCanvasEl.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.getZoom();
        const y = (e.clientY - rect.top) / canvas.getZoom();
        
        lastClickPosition = new Point(x, y);
        console.log('Updated last click position:', lastClickPosition);
      } catch (err) {
        console.error('Error updating click position:', err);
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
        
        // Determine paste position: use last clicked position or fall back
        let pastePosition: Point;
        if (lastClickPosition) {
          pastePosition = lastClickPosition;
        } else {
          try {
            // If there's an active object, use its center
            if (canvas.getActiveObject()) {
              const activeObj = canvas.getActiveObject();
              pastePosition = new Point(
                activeObj.left! + (activeObj.width! * activeObj.scaleX!) / 2,
                activeObj.top! + (activeObj.height! * activeObj.scaleY!) / 2
              );
            } else {
              // Otherwise use the center of the canvas
              pastePosition = new Point(canvas.width! / 2, canvas.height! / 2);
            }
          } catch (err) {
            // Fallback to canvas center
            console.warn('Using fallback position for paste:', err);
            pastePosition = new Point(canvas.width! / 2, canvas.height! / 2);
          }
        }
        
        // Undo (Ctrl/Cmd + Z)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        
        // Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          redo();
          return;
        }
        
        // Select All (Ctrl/Cmd + A)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          selectAll();
          return;
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
          console.log("Pasting at position:", pastePosition);
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

    // Add event listeners
    document.addEventListener('keydown', handleKeyboard);
    
    try {
      // Try to safely get canvas element and add click listener
      const canvas = fabricRef.current;
      if (canvas && canvas.upperCanvasEl) {
        canvas.upperCanvasEl.addEventListener('click', handleCanvasClick);
      }
    } catch (err) {
      console.warn('Could not set up click listener:', err);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      
      try {
        const canvas = fabricRef.current;
        if (canvas && canvas.upperCanvasEl) {
          canvas.upperCanvasEl.removeEventListener('click', handleCanvasClick);
        }
      } catch (err) {
        console.warn('Could not clean up click listener:', err);
      }
    };
  }, [fabricRef, copySelectedObjects, pasteToCanvas, activeBoardId, undo, redo, selectAll]);
};
