
import { Canvas, Point } from 'fabric';
import { useEffect } from 'react';
import { useClipboardContext } from '@/context/ClipboardContext';
import { WhiteboardId } from '@/types/canvas';

export const useTouchHandlers = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { copySelectedObjects, pasteToCanvas, setActiveCanvas, activeBoardId } = useClipboardContext();

  useEffect(() => {
    let longPressTimeout: NodeJS.Timeout;
    const LONG_PRESS_DURATION = 500;
    let lastTouchPosition: Point | null = null;

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

    // Track touch position
    const updateTouchPosition = (touch: Touch) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      try {
        const canvasEl = canvas.getElement();
        if (!canvasEl) return;

        const rect = canvasEl.getBoundingClientRect();
        lastTouchPosition = new Point(
          (touch.clientX - rect.left) / canvas.getZoom(),
          (touch.clientY - rect.top) / canvas.getZoom()
        );
        console.log('Updated last touch position:', lastTouchPosition);
      } catch (err) {
        console.error('Error updating touch position:', err);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const boardId = getBoardId();
      if (boardId !== activeBoardId) {
        return;
      }

      const touch = e.touches[0];
      if (touch) {
        updateTouchPosition(touch);
      }

      longPressTimeout = setTimeout(() => {
        if (!touch) return;

        try {
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

      const boardId = getBoardId();
      if (boardId !== activeBoardId) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) return;

      try {
        updateTouchPosition(touch);
        
        // Use the last touch position for paste
        if (lastTouchPosition) {
          pasteToCanvas(canvas, lastTouchPosition, boardId);
        }
      } catch (err) {
        console.error('Error in double tap handler:', err);
      }
    };

    let canvasEl: HTMLCanvasElement | null = null;
    try {
      const canvas = fabricRef.current;
      if (canvas && canvas.lowerCanvasEl && canvas.upperCanvasEl) {
        canvasEl = canvas.getElement();
      }
    } catch (err) {
      console.warn('Could not get canvas element during setup:', err);
    }

    if (canvasEl) {
      canvasEl.addEventListener('touchstart', handleTouchStart);
      canvasEl.addEventListener('touchmove', (e) => {
        if (e.touches[0]) updateTouchPosition(e.touches[0]);
      });
      canvasEl.addEventListener('touchend', handleTouchEnd);
      canvasEl.addEventListener('touchstart', handleDoubleTap);
    }

    return () => {
      if (canvasEl) {
        canvasEl.removeEventListener('touchstart', handleTouchStart);
        canvasEl.removeEventListener('touchmove', (e) => {
          if (e.touches[0]) updateTouchPosition(e.touches[0]);
        });
        canvasEl.removeEventListener('touchend', handleTouchEnd);
        canvasEl.removeEventListener('touchstart', handleDoubleTap);
      }
      clearTimeout(longPressTimeout);
    };
  }, [fabricRef, copySelectedObjects, pasteToCanvas, setActiveCanvas, activeBoardId]);
};
