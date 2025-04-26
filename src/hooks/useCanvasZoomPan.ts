
import { Canvas, Point, TPointerEventInfo, TPointerEvent } from 'fabric';
import { useRef } from 'react';
import { CanvasPosition } from '@/types/canvas';

export const useCanvasZoomPan = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  onZoomChange: (zoom: number) => void
) => {
  const lastPosRef = useRef<CanvasPosition>({ x: 0, y: 0 });

  const handleMouseWheel = (opt: TPointerEventInfo<WheelEvent>) => {
    const e = opt.e;
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

  const handlePanning = (e: MouseEvent) => {
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

  const resetPanPoint = () => {
    lastPosRef.current = { x: 0, y: 0 };
  };

  return { handleMouseWheel, handlePanning, resetPanPoint };
};
