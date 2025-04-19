import { useRef, useState } from 'react';
import { Canvas, Point, ActiveSelection, util, Image as FabricImage, Object as FabricObject } from 'fabric';
import { Rect } from 'fabric';
import { CanvasPosition } from '@/types/canvas';

export const useCanvasMouseHandlers = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  activeTool: string,
  onZoomChange: (zoom: number) => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<CanvasPosition>({ x: 0, y: 0 });
  const selectionRectRef = useRef<Rect | null>(null);
  const startPointRef = useRef<CanvasPosition>({ x: 0, y: 0 });

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

    // Handle copy (Ctrl + C)
    if (e.ctrlKey && e.key === 'c') {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      
      // Serialize the active object to JSON
      const objectJSON = activeObject.toObject();
      // Store the JSON representation in a custom property on the canvas
      (canvas as any).clipboardJSON = objectJSON;
    }

    // Handle paste (Ctrl + V)
    if (e.ctrlKey && e.key === 'v') {
      if (!(canvas as any).clipboardJSON) return;
      
      // Get the JSON data from the clipboard
      const clipboardJSON = (canvas as any).clipboardJSON;
      
      // Use util.enlivenObjects to recreate objects
      util.enlivenObjects([clipboardJSON], (objects) => {
        objects.forEach(obj => {
          // Offset the pasted object slightly
          obj.set({
            left: obj.left + 20,
            top: obj.top + 20,
            evented: true
          });
          
          canvas.add(obj);
          canvas.setActiveObject(obj);
        });
        
        canvas.requestRenderAll();
      });
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
      // Only allow drawing if the drawing tool is active
      if (activeTool === "select") {
        const pointer = canvas.getPointer(e);
        startPointRef.current = { x: pointer.x, y: pointer.y };
        
        // Only create selection rectangle if we're in select mode
        selectionRectRef.current = new Rect({
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
          originX: 'left',
          originY: 'top'
        });
        
        canvas.add(selectionRectRef.current);
        canvas.renderAll();
      } else if ((activeTool === "draw" || activeTool === "eraser") && canvas.isDrawingMode) {
        setIsDrawing(true);
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
    else if (selectionRectRef.current && activeTool === "select" && e.buttons === 1) {
      const pointer = canvas.getPointer(e);
      
      // Calculate width and height based on start point and current pointer
      const startX = startPointRef.current.x;
      const startY = startPointRef.current.y;
      const width = Math.abs(pointer.x - startX);
      const height = Math.abs(pointer.y - startY);
      
      // Update the selection rectangle
      selectionRectRef.current.set({
        left: Math.min(startX, pointer.x),
        top: Math.min(startY, pointer.y),
        width: width,
        height: height
      });
      
      canvas.renderAll();
    }
  };

  const handleMouseUp = (opt: any) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    if (selectionRectRef.current && activeTool === "select") {
      // Find objects that intersect with the selection rectangle
      const selectionRect = selectionRectRef.current;
      
      const objects = canvas.getObjects().filter(obj => {
        if (obj === selectionRect) return false;
        return selectionRect.intersectsWithObject(obj);
      });
      
      // Select the objects
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
      selectionRectRef.current = null;
      canvas.renderAll();
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
