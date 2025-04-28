
import { useCallback } from "react";
import { Canvas } from "fabric";
import { WhiteboardId } from "@/types/canvas";
import { useClipboardContext } from "@/context/ClipboardContext";

export const useWhiteboardInteractions = (
  id: WhiteboardId,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  fabricRef: React.MutableRefObject<Canvas | null>,
  setIsActive: (isActive: boolean) => void,
  onCtrlClick?: () => void
) => {
  const { setActiveCanvas } = useClipboardContext();
  
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    console.log(`Setting ${id} as active board`);
    window.__wbActiveBoard = canvasRef.current;
    window.__wbActiveBoardId = id;
    setIsActive(true);
    
    if (fabricRef.current) {
      setActiveCanvas(fabricRef.current, id);
    }

    if (e.ctrlKey && onCtrlClick) {
      onCtrlClick();
    }
  }, [id, canvasRef, fabricRef, setActiveCanvas, setIsActive, onCtrlClick]);

  return {
    handleContextMenu,
    handleCanvasClick
  };
};
