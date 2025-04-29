
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
import { useSyncContext } from "@/context/SyncContext";

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
  const syncEnabled = useRef<boolean>(true);
  const unloadingRef = useRef<boolean>(false);
  
  // Track when the component is mounted
  const mounted = useRef<boolean>(false);

  const { setActiveCanvas } = useClipboardContext();
  const { isSyncEnabled } = useSyncContext();

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

  // For teacher1 board, we should enable sync based on the sync context
  const shouldEnableSync = id === "teacher1" ? isSyncEnabled : true;

  const { handleObjectAdded, handleObjectModified } = useCanvasPersistence(fabricRef, id, isTeacherView);
  const { undo, redo } = useCanvasHistory(fabricRef);
  
  // Enable real-time sync with proper dependency on the canvas reference
  const { clearAllDrawings } = useRealtimeSync(fabricRef, id, syncEnabled.current && !unloadingRef.current);
  
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
    unloadingRef.current = false;
    
    // Set this board as active as soon as it's mounted
    setAsActiveBoard();
    
    // Clear cache to ensure fresh data on refresh
    if (id === "teacher1" || id === "student1") {
      const channel = window.sessionStorage.getItem(`supabase-channel-whiteboard-sync-${id}`);
      if (channel) {
        window.sessionStorage.removeItem(`supabase-channel-whiteboard-sync-${id}`);
        console.log(`Cleared channel cache for ${id}`);
      }
    }
    
    // Set up unloading detection to prevent memory leaks and infinite loops
    window.addEventListener('beforeunload', () => {
      unloadingRef.current = true;
      syncEnabled.current = false;
    });
    
    return () => {
      // Mark that we're unloading to prevent new updates
      unloadingRef.current = true;
      mounted.current = false;
      
      // Clean up any resources specific to this board
      console.log(`Unmounting board ${id}`);
      
      // Close the sync connection
      syncEnabled.current = false;
      
      // Clear the canvas reference to prevent memory leaks
      if (window.__wbActiveBoardId === id) {
        window.__wbActiveBoard = null;
        window.__wbActiveBoardId = null;
      }
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
  
  const handleClearAll = () => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = "#ffffff";
      fabricRef.current.renderAll();
      
      // Also clear database if admin
      if (id === "teacher1") {
        clearAllDrawings();
        toast("All drawings cleared from database");
      } else {
        toast("Canvas cleared");
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
      {id === "teacher1" && (
        <button 
          className="absolute top-16 right-2 bg-red-500 text-white px-4 py-2 rounded opacity-50 hover:opacity-100"
          onClick={handleClearAll}
        >
          Clear All Data
        </button>
      )}
    </div>
  );
};
