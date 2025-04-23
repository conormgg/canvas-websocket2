
import { useCallback } from 'react';
import { Canvas, TPointerEvent, TPointerEventInfo } from 'fabric';
import { useCanvasKeyboard } from './useCanvasKeyboard';
import { useCanvasZoomPan } from './useCanvasZoomPan';
import { useCanvasSelection } from './useCanvasSelection';
import { useCanvasToolState } from './useCanvasToolState';

export const useCanvasMouseHandlers = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  activeTool: string,
  onZoomChange: (zoom: number) => void
) => {
  const { isDrawing, setIsDrawing, updateToolState } = useCanvasToolState(fabricRef);
  const { handleKeyDown } = useCanvasKeyboard(fabricRef);
  const { handleMouseWheel, handlePanning, resetPanPoint } = useCanvasZoomPan(fabricRef, onZoomChange);
  const { handleSelectionStart, handleSelectionMoving, handleSelectionEnd } = useCanvasSelection(fabricRef, activeTool);

  const handleMouseDown = useCallback((opt: TPointerEventInfo<TPointerEvent>) => {
    const e = opt.e;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e instanceof MouseEvent && e.button === 2) {
      canvas.defaultCursor = 'grabbing';
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();
    } 
    else if ((e instanceof MouseEvent && e.button === 0) || e instanceof TouchEvent) {
      if (activeTool === "select") {
        handleSelectionStart(e);
      } else if ((activeTool === "draw" || activeTool === "eraser") && canvas.isDrawingMode) {
        setIsDrawing(true);
      }
    }
  }, [activeTool, fabricRef, handleSelectionStart, setIsDrawing]);

  const handleMouseMove = useCallback((opt: TPointerEventInfo<TPointerEvent>) => {
    const e = opt.e;
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    if (e instanceof MouseEvent && e.buttons === 2) {
      handlePanning(e);
    } 
    else if (activeTool === "select" && e instanceof MouseEvent && e.buttons === 1) {
      handleSelectionMoving(e);
    }
  }, [activeTool, fabricRef, handlePanning, handleSelectionMoving]);

  const handleMouseUp = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Don't update tool state if we're already in drawing mode and just finished a drawing action
    if (!isDrawing || activeTool === "select") {
      updateToolState(activeTool);
    }
    
    if (activeTool === "select") {
      handleSelectionEnd();
      canvas.defaultCursor = 'default';
    }
    
    // Ensure the viewport transform is committed
    if (canvas.viewportTransform) {
      canvas.setViewportTransform(canvas.viewportTransform);
    }
    
    resetPanPoint();
    setIsDrawing(false);
    canvas.renderAll();
  }, [activeTool, fabricRef, handleSelectionEnd, resetPanPoint, setIsDrawing, updateToolState, isDrawing]);

  return {
    isDrawing,
    handleMouseWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown
  };
};
