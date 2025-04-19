
import { useRef, useState } from 'react';
import { Canvas, Point } from 'fabric';
import { CanvasPosition } from '@/types/canvas';

export const useCanvasMouseHandlers = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  activeTool: string,
  onZoomChange: (zoom: number) => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<CanvasPosition>({ x: 0, y: 0 });

  const handleMouseWheel = (opt: any) => {
    const e = opt.e as WheelEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

    const delta = e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    zoom = Math.min(Math.max(0.1, zoom), 20);
    
    const pointer = new Point(e.offsetX, e.offsetY);
    canvas.zoomToPoint(pointer, zoom);
    onZoomChange(Math.round(zoom * 100) / 100);
    
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseDown = (opt: any) => {
    const e = opt.e as MouseEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e.button === 2) {
      // Right-click handling for panning
      canvas.defaultCursor = 'grabbing';
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();
    } 
    else if (e.button === 0) {
      // Left-click handling for different tools
      if (activeTool === "draw") {
        setIsDrawing(true);
        canvas.isDrawingMode = true;
      } else if (activeTool === "eraser") {
        setIsDrawing(true);
        canvas.isDrawingMode = true;
      } else if (activeTool === "select") {
        // For select tool, ensure drawing mode is off
        canvas.isDrawingMode = false;
        // Do not set isDrawing to true for select tool
        // This allows the built-in selection behavior to work
      }
    }
  };

  const handleMouseMove = (opt: any) => {
    const e = opt.e as MouseEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e.buttons === 2) {
      // Right-click drag for panning
      canvas.setCursor('grabbing');
      
      if (lastPosRef.current.x === 0) lastPosRef.current.x = e.clientX;
      if (lastPosRef.current.y === 0) lastPosRef.current.y = e.clientY;
      
      const delta = new Point(e.clientX - lastPosRef.current.x, e.clientY - lastPosRef.current.y);
      canvas.relativePan(delta);
      
      canvas.requestRenderAll();
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.setViewportTransform(canvas.viewportTransform!);
    
    if (activeTool === "select") {
      canvas.defaultCursor = 'default';
    }
    
    canvas.selection = true;
    lastPosRef.current = { x: 0, y: 0 };
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
