
import { useState, useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { useCanvas } from "@/hooks/useCanvas";
import { WhiteboardId } from "@/types/canvas";
import { cn } from "@/lib/utils";
import { useWhiteboardActive } from "@/hooks/useWhiteboardActive";
import { useWhiteboardSync } from "@/hooks/useWhiteboardSync";
import { useWhiteboardState } from "@/hooks/useWhiteboardState";

interface WhiteboardProps {
  id: WhiteboardId;
  isSplitScreen?: boolean;
  onCtrlClick?: () => void;
  isMaximized?: boolean;
}

export const Whiteboard = ({ 
  id, 
  isSplitScreen = false,
  onCtrlClick,
  isMaximized = false
}: WhiteboardProps) => {
  const [localIsMaximized, setLocalIsMaximized] = useState(isMaximized);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use our custom hooks
  const {
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    inkThickness,
    setInkThickness,
    zoom,
    setZoom
  } = useWhiteboardState(fabricRef);

  const { fabricRef } = useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom,
    onObjectAdded: handleObjectAdded
  });

  const { handleObjectAdded } = useWhiteboardSync({ id, fabricRef });
  const { isActive, handleCanvasClick } = useWhiteboardActive({
    id,
    canvasRef,
    fabricRef,
    onCtrlClick
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.boardId = id;
    }
  }, [canvasRef, id]);

  useEffect(() => {
    setLocalIsMaximized(isMaximized);
  }, [isMaximized]);

  const toggleMaximize = () => {
    setLocalIsMaximized(!localIsMaximized);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-start",
        "transition-all duration-300 ease-in-out",
        isActive && "ring-2 ring-orange-400 bg-orange-50/30 rounded-lg shadow-lg",
        localIsMaximized ? "fixed inset-4 z-50 bg-white" : "w-full h-full",
      )}
      onContextMenu={handleContextMenu}
      onClick={handleCanvasClick}
    >
      <Toolbar
        activeTool={activeTool}
        activeColor={activeColor}
        onToolChange={setActiveTool}
        onColorChange={setActiveColor}
        inkThickness={inkThickness}
        onInkThicknessChange={setInkThickness}
        isSplitScreen={isSplitScreen}
      />
      <canvas 
        ref={canvasRef} 
        className="w-full h-full z-0" 
        tabIndex={0}
        data-board-id={id}
        onFocus={() => {
          window.__wbActiveBoard = canvasRef.current;
          window.__wbActiveBoardId = id;
          if (fabricRef.current) {
            setActiveCanvas(fabricRef.current, id);
          }
          console.log(`Canvas ${id} focused and set as active`);
        }}
        onClick={handleCanvasClick}
      />
      {isActive && (
        <div className="absolute top-0 left-0 p-2 bg-orange-100 text-orange-700 rounded-bl-lg font-medium text-xs">
          Active Board
        </div>
      )}
      {id === "student1" && (
        <div className="absolute bottom-2 right-2 px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
          Live Connected
        </div>
      )}
    </div>
  );
};
