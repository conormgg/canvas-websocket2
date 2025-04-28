
import { useState, useEffect } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { WhiteboardId } from "@/types/canvas";
import { useClipboardContext } from "@/context/ClipboardContext";
import { cn } from "@/lib/utils";
import { Toolbar } from "./Toolbar";
import { WhiteboardProps } from "@/types/whiteboard";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useCanvasPersistence } from "@/hooks/useCanvasPersistence";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import { toast } from "sonner";

export const Whiteboard = ({ 
  id, 
  isSplitScreen = false,
  onCtrlClick,
  isMaximized: initialIsMaximized = false 
}: WhiteboardProps) => {
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser">("draw");
  const [activeColor, setActiveColor] = useState<string>("#ff0000");
  const [inkThickness, setInkThickness] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(1);
  const [isMaximized, setIsMaximized] = useState(initialIsMaximized);

  const { setActiveCanvas } = useClipboardContext();

  const isTeacherView = window.location.pathname.includes('/teacher') || 
                       window.location.pathname === '/' ||
                       window.location.pathname.includes('/split-mode');

  const { canvasRef, fabricRef } = useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom
  });
  
  const isStudent = id.startsWith('student');
  const { handleObjectAdded, handleObjectModified } = useCanvasPersistence(fabricRef, id, isTeacherView);
  const { undo, redo } = useCanvasHistory(fabricRef);
  
  // Update useCanvas hook with handleObjectAdded after it's been declared
  useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom,
    onObjectAdded: handleObjectAdded,
  });
  
  // Always enable real-time sync
  useRealtimeSync(fabricRef, id, true);

  useEffect(() => {
    // Set this board as active as soon as it's mounted - this ensures it's always active
    if (fabricRef.current) {
      console.log(`Setting ${id} as active board on mount and keeping it active`);
      window.__wbActiveBoard = canvasRef.current;
      window.__wbActiveBoardId = id;
      setActiveCanvas(fabricRef.current, id);
    }
  }, [id, canvasRef, fabricRef, setActiveCanvas]);
  
  // Additional effect to periodically check and refresh the canvas if needed
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (fabricRef.current && canvasRef.current) {
        // Re-render the canvas to ensure content is displayed
        fabricRef.current.renderAll();
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkInterval);
  }, [fabricRef, canvasRef]);
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

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
  
  const handleUndo = () => {
    const result = undo();
    if (result) {
      toast("Undo operation performed");
    } else {
      toast("Nothing to undo");
    }
  };
  
  const handleRedo = () => {
    const result = redo();
    if (result) {
      toast("Redo operation performed");
    } else {
      toast("Nothing to redo");
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-start",
        "transition-all duration-300 ease-in-out",
        "w-full h-full",
        isMaximized ? "fixed inset-4 z-50 bg-white" : ""
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
        boardId={id}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <canvas 
        ref={canvasRef} 
        className="w-full h-full z-0" 
        tabIndex={0}
        data-board-id={id}
      />
    </div>
  );
};
