
import { useEffect, useRef } from "react";
import { Canvas } from "fabric";
import { useClipboardContext } from "@/context/ClipboardContext";
import { cn } from "@/lib/utils";
import { WhiteboardId } from "@/types/canvas";

interface WhiteboardCanvasProps {
  id: WhiteboardId;
  isActive: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fabricRef: React.MutableRefObject<Canvas | null>;
  onCanvasClick: (e: React.MouseEvent) => void;
}

export const WhiteboardCanvas = ({
  id,
  isActive,
  canvasRef,
  fabricRef,
  onCanvasClick,
}: WhiteboardCanvasProps) => {
  const { setActiveCanvas } = useClipboardContext();

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.boardId = id;
    }
  }, [canvasRef, id]);

  const handleFocus = () => {
    window.__wbActiveBoard = canvasRef.current;
    window.__wbActiveBoardId = id;
    if (fabricRef.current) {
      setActiveCanvas(fabricRef.current, id);
    }
    console.log(`Canvas ${id} focused and set as active`);
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full z-0" 
      tabIndex={0}
      data-board-id={id}
      onFocus={handleFocus}
      onClick={onCanvasClick}
    />
  );
};
