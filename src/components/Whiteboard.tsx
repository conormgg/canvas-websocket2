
import { useState, useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { useCanvas } from "@/hooks/useCanvas";
import { WhiteboardId } from "@/types/canvas";
import { cn } from "@/lib/utils";
import { useWhiteboardActive } from "@/hooks/useWhiteboardActive";
import { useWhiteboardSync } from "@/hooks/useWhiteboardSync";
import { useWhiteboardState } from "@/hooks/useWhiteboardState";
import { useClipboardContext } from "@/context/ClipboardContext";
import { Canvas } from "fabric";

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
  // Set up refs early to avoid order-of-declaration issues
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  
  const [localIsMaximized, setLocalIsMaximized] = useState(isMaximized);
  const { setActiveCanvas, activeBoardId } = useClipboardContext();

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

  const { handleObjectAdded } = useWhiteboardSync({ id, fabricRef });

  const { fabricRef: updatedFabricRef } = useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom,
    onObjectAdded: handleObjectAdded
  });

  // Update fabricRef with the one returned from useCanvas
  useEffect(() => {
    if (updatedFabricRef.current) {
      fabricRef.current = updatedFabricRef.current;
      
      // If this is the first board, make it active by default
      if ((activeBoardId === null || activeBoardId === undefined) && id === "teacher") {
        console.log(`Making ${id} the default active board`);
        setActiveCanvas(updatedFabricRef.current, id);
      }
    }
  }, [updatedFabricRef.current, id, activeBoardId, setActiveCanvas]);

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
  
  // Handle canvas focus - crucial for tool operation
  const handleCanvasFocus = () => {
    if (fabricRef.current) {
      console.log(`Canvas ${id} focused and set as active`);
      window.__wbActiveBoard = canvasRef.current;
      window.__wbActiveBoardId = id;
      setActiveCanvas(fabricRef.current, id);
    }
  };

  // When component mounts, focus this board if it's in a maximized state
  useEffect(() => {
    if (isMaximized && fabricRef.current) {
      console.log(`Auto-focusing ${id} board because it's maximized`);
      window.__wbActiveBoard = canvasRef.current;
      window.__wbActiveBoardId = id;
      setActiveCanvas(fabricRef.current, id);
    }
  }, [isMaximized, id, setActiveCanvas]);

  // Ensure cursor is properly updated when tool changes
  useEffect(() => {
    if (isActive && fabricRef.current) {
      // Force cursor update when tool changes
      const canvas = fabricRef.current;
      canvas.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
      
      // This will trigger the useEffect in useCanvas that updates cursors
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = inkThickness;
        canvas.freeDrawingBrush.color = activeTool === "draw" ? activeColor : "#ffffff";
        canvas.renderAll();
      }
    }
  }, [activeTool, activeColor, inkThickness, isActive]);

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
        onFocus={handleCanvasFocus}
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
