
import { useState, useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { useClipboardContext } from '@/context/ClipboardContext';

interface UseWhiteboardActiveProps {
  id: WhiteboardId;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fabricRef: React.MutableRefObject<Canvas | null>;
  onCtrlClick?: () => void;
}

export const useWhiteboardActive = ({ 
  id, 
  canvasRef, 
  fabricRef, 
  onCtrlClick 
}: UseWhiteboardActiveProps) => {
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const { setActiveCanvas, activeBoardId } = useClipboardContext();

  const handleCanvasClick = (e: React.MouseEvent) => {
    console.log(`Setting ${id} as active board`);
    window.__wbActiveBoard = canvasRef.current;
    window.__wbActiveBoardId = id;
    isActiveRef.current = true;
    setIsActive(true);
    
    if (fabricRef.current) {
      setActiveCanvas(fabricRef.current, id);
    }

    if (e.ctrlKey && onCtrlClick) {
      onCtrlClick();
    }
  };

  useEffect(() => {
    setIsActive(activeBoardId === id);
  }, [activeBoardId, id]);

  useEffect(() => {
    const checkActiveStatus = () => {
      const isCurrentlyActive = 
        window.__wbActiveBoardId === id || 
        window.__wbActiveBoard === canvasRef.current;
      setIsActive(isCurrentlyActive);
      
      if (isCurrentlyActive && fabricRef.current) {
        setActiveCanvas(fabricRef.current, id);
      }
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
  }, [id, setActiveCanvas]);

  return { isActive, handleCanvasClick };
};
