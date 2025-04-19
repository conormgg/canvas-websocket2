
import { useRef, useState } from 'react';
import { Canvas, Point, ActiveSelection, Rect } from 'fabric';
import { CanvasPosition } from '@/types/canvas';

export const useCanvasMouseHandlers = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  activeTool: string,
  onZoomChange: (zoom: number) => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<CanvasPosition>({ x: 0, y: 0 });
  const isSelecting = useRef(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Handle delete and backspace keys
    if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObjects().length > 0) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

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
      if (activeTool === "select") {
        isSelecting.current = true;
        canvas.selection = true;
        canvas.isDrawingMode = false;
        
        // Start selection from the point where mouse was pressed
        const pointer = canvas.getPointer(e);
        canvas.setActiveObject(new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          strokeWidth: 1,
          stroke: 'rgba(0,0,0,0.3)',
          fill: 'rgba(0,0,0,0.1)',
          selectable: false,
          evented: false,
          excludeFromExport: true,
          selectionBackgroundColor: 'rgba(0,0,0,0.1)',
        }));
      } else if (activeTool === "draw" || activeTool === "eraser") {
        setIsDrawing(true);
        canvas.isDrawingMode = true;
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
    } else if (isSelecting.current && activeTool === "select") {
      const pointer = canvas.getPointer(e);
      const activeObj = canvas.getActiveObject();
      
      if (activeObj && activeObj.type === 'rect') {
        const startX = activeObj.left!;
        const startY = activeObj.top!;
        
        const width = Math.abs(pointer.x - startX);
        const height = Math.abs(pointer.y - startY);
        
        activeObj.set({
          width: width,
          height: height,
          left: pointer.x > startX ? startX : pointer.x,
          top: pointer.y > startY ? startY : pointer.y
        });
        
        activeObj.setCoords();
        canvas.renderAll();
      }
    }
  };

  const handleMouseUp = (opt: any) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (isSelecting.current && activeTool === "select") {
      const selectionRect = canvas.getActiveObject();
      if (selectionRect && selectionRect.type === 'rect') {
        // Get all objects that intersect with the selection rectangle
        const objects = canvas.getObjects().filter(obj => {
          if (obj === selectionRect) return false;
          return selectionRect.intersectsWithObject(obj);
        });

        if (objects.length > 0) {
          if (objects.length === 1) {
            canvas.setActiveObject(objects[0]);
          } else {
            const selection = new ActiveSelection(objects, { canvas });
            canvas.setActiveObject(selection);
          }
        }

        // Remove the selection rectangle
        canvas.remove(selectionRect);
        canvas.renderAll();
      }
      isSelecting.current = false;
    }

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
    handleMouseUp,
    handleKeyDown
  };
};
