
import { Canvas, ActiveSelection, Rect, TPointerEvent } from 'fabric';
import { useRef } from 'react';
import { CanvasPosition } from '@/types/canvas';

export const useCanvasSelection = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  activeTool: string
) => {
  const selectionRectRef = useRef<Rect | null>(null);
  const startPointRef = useRef<CanvasPosition>({ x: 0, y: 0 });

  const handleSelectionStart = (e: TPointerEvent) => {
    const canvas = fabricRef.current;
    if (!canvas || activeTool !== "select") return;

    const pointer = canvas.getPointer(e);
    startPointRef.current = { x: pointer.x, y: pointer.y };
    
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
  };

  const handleSelectionMoving = (e: TPointerEvent) => {
    const canvas = fabricRef.current;
    if (!canvas || !selectionRectRef.current || activeTool !== "select") return;

    const pointer = canvas.getPointer(e);
    
    const startX = startPointRef.current.x;
    const startY = startPointRef.current.y;
    const width = Math.abs(pointer.x - startX);
    const height = Math.abs(pointer.y - startY);
    
    selectionRectRef.current.set({
      left: Math.min(startX, pointer.x),
      top: Math.min(startY, pointer.y),
      width: width,
      height: height
    });
    
    canvas.renderAll();
  };

  const handleSelectionEnd = () => {
    const canvas = fabricRef.current;
    if (!canvas || !selectionRectRef.current) return;

    const selectionRect = selectionRectRef.current;
    
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
    
    canvas.remove(selectionRect);
    selectionRectRef.current = null;
    canvas.renderAll();
  };

  return {
    handleSelectionStart,
    handleSelectionMoving,
    handleSelectionEnd
  };
};
