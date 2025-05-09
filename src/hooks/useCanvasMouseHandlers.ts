import { useState } from 'react';
import { Canvas, TPointerEvent, TPointerEventInfo } from 'fabric';
import { useCanvasKeyboard } from './useCanvasKeyboard';
import { useCanvasZoomPan } from './useCanvasZoomPan';
import { useCanvasSelection } from './useCanvasSelection';

export const useCanvasMouseHandlers = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  activeTool: string,
  onZoomChange: (zoom: number) => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  
  useCanvasKeyboard(fabricRef); // Just use the hook, no destructuring
  const { handleMouseWheel, handlePanning, resetPanPoint } = useCanvasZoomPan(fabricRef, onZoomChange);
  const { handleSelectionStart, handleSelectionMoving, handleSelectionEnd } = useCanvasSelection(fabricRef, activeTool);

  const handleMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
    const e = opt.e;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e instanceof MouseEvent && e.button === 2) {
      enablePanningMode(canvas);
    } 
    else if ((e instanceof MouseEvent && e.button === 0) || e instanceof TouchEvent) {
      handlePrimaryClick(canvas, e);
    }
  };

  const enablePanningMode = (canvas: Canvas) => {
    canvas.defaultCursor = 'grabbing';
    canvas.selection = false;
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handlePrimaryClick = (canvas: Canvas, e: MouseEvent | TouchEvent) => {
    if (activeTool === "select") {
      handleSelectionStart(e);
    } else if ((activeTool === "draw" || activeTool === "eraser") && canvas.isDrawingMode) {
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
    const e = opt.e;
    
    if (e instanceof MouseEvent && e.buttons === 2) {
      handlePanning(e);
    } 
    else if (activeTool === "select" && e instanceof MouseEvent && e.buttons === 1) {
      handleSelectionMoving(e);
    }
  };

  const handleMouseUp = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    if (activeTool === "select") {
      handleSelectionEnd();
      canvas.defaultCursor = 'default';
    }

    canvas.setViewportTransform(canvas.viewportTransform!);
    canvas.selection = true;
    resetPanPoint();
    setIsDrawing(false);
  };

  return {
    isDrawing,
    handleMouseWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
