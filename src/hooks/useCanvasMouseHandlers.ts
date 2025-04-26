
import { useState } from 'react';
import { Canvas, TPointerEvent, TPointerEventInfo } from 'fabric';
import { useCanvasKeyboard } from './useCanvasKeyboard';
import { useCanvasZoomPan } from './useCanvasZoomPan';
import { useCanvasSelection } from './useCanvasSelection';
import { applyCursorToCanvas } from '@/utils/cursorUtils';
import { useClipboardContext } from '@/context/ClipboardContext';

export const useCanvasMouseHandlers = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  activeTool: string,
  onZoomChange: (zoom: number) => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const { activeBoardId } = useClipboardContext();
  
  useCanvasKeyboard(fabricRef); // Just use the hook, no destructuring
  const { handleMouseWheel, handlePanning, resetPanPoint } = useCanvasZoomPan(fabricRef, onZoomChange);
  const { handleSelectionStart, handleSelectionMoving, handleSelectionEnd } = useCanvasSelection(fabricRef, activeTool);

  const handleMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
    const e = opt.e;
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    console.log(`Mouse down on canvas, active tool: ${activeTool}`);

    // Get the current board ID
    const boardId = canvas.lowerCanvasEl?.dataset?.boardId;
    
    if (boardId !== activeBoardId) {
      console.log(`Board ${boardId} is not active (${activeBoardId} is), skipping interaction`);
      return;
    }

    if (e instanceof MouseEvent && e.button === 2) {
      enablePanningMode(canvas);
    } 
    else if ((e instanceof MouseEvent && e.button === 0) || e instanceof TouchEvent) {
      handlePrimaryClick(canvas, e);
    }
  };

  const enablePanningMode = (canvas: Canvas) => {
    applyCursorToCanvas(canvas, 'grabbing');
    canvas.selection = false;
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handlePrimaryClick = (canvas: Canvas, e: MouseEvent | TouchEvent) => {
    if (activeTool === "select") {
      handleSelectionStart(e);
    } else if ((activeTool === "draw" || activeTool === "eraser") && canvas.isDrawingMode) {
      console.log("Starting drawing/erasing");
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
    const e = opt.e;
    const canvas = fabricRef.current;
    
    if (!canvas) return;
    
    // Get the current board ID
    const boardId = canvas.lowerCanvasEl?.dataset?.boardId;
    
    if (boardId !== activeBoardId) {
      return;
    }
    
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
    
    const boardId = canvas.lowerCanvasEl?.dataset?.boardId;
    
    if (boardId !== activeBoardId) {
      return;
    }
    
    if (activeTool === "select") {
      handleSelectionEnd();
      applyCursorToCanvas(canvas, 'default');
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
