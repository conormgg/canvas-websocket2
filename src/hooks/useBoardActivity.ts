
import { useState, useEffect } from 'react';
import { WhiteboardId } from '@/types/canvas';
import { useClipboardContext } from '@/context/ClipboardContext';

export const useBoardActivity = (id: WhiteboardId, canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [isActive, setIsActive] = useState(false);
  const { activeBoardId } = useClipboardContext();

  useEffect(() => {
    setIsActive(activeBoardId === id);
  }, [activeBoardId, id]);

  useEffect(() => {
    const checkActiveStatus = () => {
      const isCurrentlyActive = 
        window.__wbActiveBoardId === id || 
        window.__wbActiveBoard === canvasRef.current;
      setIsActive(isCurrentlyActive);
    };

    checkActiveStatus();

    const observer = new MutationObserver(checkActiveStatus);
    
    if (canvasRef.current) {
      observer.observe(canvasRef.current, {
        attributes: true,
        attributeFilter: ['data-board-id']
      });
    }

    return () => observer.disconnect();
  }, [id, canvasRef]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.boardId = id;
    }
  }, [canvasRef, id]);

  return { isActive };
};
