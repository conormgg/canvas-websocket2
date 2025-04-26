
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
  const { setActiveCanvas, activeBoardId } = useClipboardContext();

  const handleCanvasClick = (e: React.MouseEvent) => {
    console.log(`Setting ${id} as active board`);
    window.__wbActiveBoard = canvasRef.current;
    window.__wbActiveBoardId = id;
    
    if (fabricRef.current) {
      setActiveCanvas(fabricRef.current, id);
    }

    if (e.ctrlKey && onCtrlClick) {
      onCtrlClick();
    }
  };

  // This effect will run when the activeBoardId changes in the ClipboardContext
  useEffect(() => {
    const isCurrentlyActive = activeBoardId === id;
    setIsActive(isCurrentlyActive);
  }, [activeBoardId, id]);

  return { isActive, handleCanvasClick };
};
