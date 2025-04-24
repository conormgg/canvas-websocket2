
import { Canvas, Point } from "fabric";
import { useRef, useEffect } from "react";

export const usePositionTracking = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const posRef = useRef<Point | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const boardIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (fabricRef.current) {
      boardIdRef.current = fabricRef.current.lowerCanvasEl.dataset.boardId || null;
    }
  }, [fabricRef.current]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    const handleCanvasClick = () => {
      lastClickTimeRef.current = Date.now();
      const pointer = canvas.getPointer({ clientX: 0, clientY: 0 } as any);
      posRef.current = pointer;
    };
    
    canvas.on('mouse:down', handleCanvasClick);
    return () => canvas.off('mouse:down', handleCanvasClick);
  }, [fabricRef.current]);

  return { posRef, lastClickTimeRef, boardIdRef };
};
