
import { useState, useEffect, useCallback } from "react";
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
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { CanvasStateManager } from "@/hooks/whiteboard/canvasStateManager";

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
  const [lastRender, setLastRender] = useState<number>(Date.now());
  const canvasStateManager = useCallback(() => new CanvasStateManager(), [])();

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

  // Set this board as active
  const setAsActiveBoard = useCallback(() => {
    if (fabricRef.current) {
      console.log(`Setting ${id} as active board`);
      window.__wbActiveBoard = canvasRef.current;
      window.__wbActiveBoardId = id;
      setActiveCanvas(fabricRef.current, id);
    }
  }, [id, canvasRef, fabricRef, setActiveCanvas]);

  useEffect(() => {
    // Set this board as active as soon as it's mounted
    setAsActiveBoard();
    
    // Refresh render periodically but less frequently
    const checkInterval = setInterval(() => {
      const now = Date.now();
      
      // Only re-render every 10 seconds at most to reduce unnecessary updates
      if (now - lastRender > 10000) { // 10 seconds
        if (fabricRef.current && canvasRef.current) {
          fabricRef.current.renderAll();
          setLastRender(now);
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(checkInterval);
  }, [fabricRef, canvasRef, setAsActiveBoard, lastRender]);
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    setAsActiveBoard();

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

  const handleClearCanvas = async () => {
    if (window.confirm(`Are you sure you want to clear the whiteboard data for ${id}?`)) {
      // Clear canvas data from Supabase
      const success = await canvasStateManager.clearCanvasData(id);
      
      if (success && fabricRef.current) {
        // Clear canvas locally
        fabricRef.current.clear();
        toast.success(`Whiteboard ${id} cleared successfully`);
      }
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
      <div className="w-full flex justify-between items-center">
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
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleClearCanvas} 
          className="mr-2"
          title="Clear whiteboard data"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full z-0" 
        tabIndex={0}
        data-board-id={id}
      />
    </div>
  );
};
