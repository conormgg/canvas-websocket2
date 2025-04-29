
import { useState, useEffect, useCallback, useRef } from "react";
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
  const initComplete = useRef<boolean>(false);
  
  // Track when the component is mounted
  const mounted = useRef<boolean>(false);

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
  
  // Enable real-time sync with proper dependency on the canvas reference
  const syncEnabled = useRef<boolean>(true);
  useRealtimeSync(fabricRef, id, syncEnabled.current);
  
  // Set this board as active
  const setAsActiveBoard = useCallback(() => {
    if (fabricRef.current) {
      console.log(`Setting ${id} as active board`);
      window.__wbActiveBoard = canvasRef.current;
      window.__wbActiveBoardId = id;
      setActiveCanvas(fabricRef.current, id);
      
      // Set initialization as complete
      if (!initComplete.current) {
        initComplete.current = true;
        console.log(`Board ${id} initialization complete`);
      }
    }
  }, [id, canvasRef, fabricRef, setActiveCanvas]);

  // Run this effect only once after mounting
  useEffect(() => {
    mounted.current = true;
    
    // Set this board as active as soon as it's mounted
    setAsActiveBoard();
    
    return () => {
      mounted.current = false;
      // Clean up any resources specific to this board
      console.log(`Unmounting board ${id}`);
    };
  }, [setAsActiveBoard, id]);
  
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
