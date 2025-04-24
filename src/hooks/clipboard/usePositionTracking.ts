
import { Canvas, Point } from "fabric";
import { useRef, useEffect } from "react";

export const usePositionTracking = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const posRef = useRef<Point | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const boardIdRef = useRef<string | null>(null);
  
  // Make sure we get the board ID as soon as possible
  useEffect(() => {
    const updateBoardId = () => {
      if (fabricRef.current) {
        // Try to get the board ID from various elements
        const lowerCanvasId = fabricRef.current.lowerCanvasEl?.dataset?.boardId;
        const upperCanvasId = fabricRef.current.upperCanvasEl?.dataset?.boardId;
        const containerId = fabricRef.current.wrapperEl?.dataset?.boardId;
        
        boardIdRef.current = lowerCanvasId || upperCanvasId || containerId || null;
        console.log("Position tracking board ID set to:", boardIdRef.current);
      }
    };
    
    // Try immediately and also after a short delay in case the canvas isn't ready
    updateBoardId();
    const timeoutId = setTimeout(updateBoardId, 500);
    
    return () => clearTimeout(timeoutId);
  }, [fabricRef]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    const handleCanvasClick = (evt: any) => {
      lastClickTimeRef.current = Date.now();
      const pointer = canvas.getPointer(evt.e);
      posRef.current = pointer;
      
      // Update the board ID when clicked
      if (canvas.lowerCanvasEl?.dataset?.boardId) {
        boardIdRef.current = canvas.lowerCanvasEl.dataset.boardId;
      }
      
      console.log(`Position tracking updated for board ${boardIdRef.current}:`, pointer);
    };
    
    canvas.on('mouse:down', handleCanvasClick);
    return () => canvas.off('mouse:down', handleCanvasClick);
  }, [fabricRef]);

  return { posRef, lastClickTimeRef, boardIdRef };
};
