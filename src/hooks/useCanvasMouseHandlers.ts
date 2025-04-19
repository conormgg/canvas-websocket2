
import { useRef, useState } from 'react';
import { Canvas, Point, Circle } from 'fabric';

export const useCanvasMouseHandlers = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  activeTool: string,
  onZoomChange: (zoom: number) => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

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
    
    if (!isDrawing) {
      const dot = new Circle({
        left: e.offsetX,
        top: e.offsetY,
        radius: 2,
        fill: '#ff0000',
        opacity: 0.5,
        selectable: false,
      });
      canvas.add(dot);
      setTimeout(() => canvas.remove(dot), 300);
    }
    
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseDown = (opt: any) => {
    const e = opt.e as MouseEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e.button === 2) {
      canvas.defaultCursor = 'grabbing';
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();

      const dot = new Circle({
        left: e.offsetX,
        top: e.offsetY,
        radius: 3,
        fill: '#00ff00',
        opacity: 0.5,
        selectable: false,
      });
      canvas.add(dot);
      setTimeout(() => canvas.remove(dot), 300);
    } 
    else if (e.button === 0) {
      if ((activeTool === "draw" && e.ctrlKey) || activeTool === "eraser") {
        setIsDrawing(true);
      }
    }
  };

  const handleMouseMove = (opt: any) => {
    const e = opt.e as MouseEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e.buttons === 2) {
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
    
    if (activeTool === "draw") {
      canvas.defaultCursor = 'default';
    } else if (activeTool === "eraser") {
      canvas.defaultCursor = 'crosshair';
    } else {
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
