
import { useState, useEffect, useRef } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { WhiteboardId } from "@/types/canvas";
import { useClipboardContext } from "@/context/ClipboardContext";
import { useSyncContext } from "@/context/SyncContext";
import { cn } from "@/lib/utils";
import { Toolbar } from "./Toolbar";
import { ActiveBoardIndicator } from "./whiteboard/ActiveBoardIndicator";
import { WhiteboardProps } from "@/types/whiteboard";
import { Object as FabricObject, Canvas } from "fabric";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { supabase } from "@/integrations/supabase/client";
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
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const [isMaximized, setIsMaximized] = useState(initialIsMaximized);

  const { setActiveCanvas, activeBoardId } = useClipboardContext();
  const { sendObjectToStudents, isSyncEnabled, isSync2Enabled, isSync3Enabled, isSync4Enabled, isSync5Enabled } = useSyncContext();

  const { canvasRef, fabricRef } = useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom,
    onObjectAdded: handleObjectAdded,
  });
  
  // Use isStudent flag to determine if this is a student board
  const isStudent = id.startsWith('student');
  useRealtimeSync(fabricRef, id, isStudent);

  // Save the entire canvas state to the database
  const saveCanvasState = async (canvas: Canvas, boardId: WhiteboardId) => {
    if (!canvas) return;
    
    try {
      console.log(`Saving canvas state for ${boardId}`);
      const canvasData = canvas.toJSON();
      
      const { error } = await supabase
        .from('whiteboard_objects')
        .insert({
          board_id: boardId,
          object_data: canvasData
        });
        
      if (error) {
        console.error('Error saving canvas state:', error);
        toast.error('Failed to save whiteboard state');
      } else {
        console.log(`Canvas state saved for ${boardId}`);
      }
    } catch (err) {
      console.error('Failed to save canvas state:', err);
    }
  };

  function handleObjectAdded(object: FabricObject) {
    const isTeacherView = window.location.pathname.includes('/teacher') || 
                         window.location.pathname === '/' ||
                         window.location.pathname.includes('/split-mode');
    
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Save the current state of the canvas to the database
    saveCanvasState(canvas, id);
    
    if ((id.startsWith("teacher")) && isTeacherView) {
      console.log(`${id} added object, sending to corresponding student board`);
      const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
      
      // Also save to the corresponding student board
      saveCanvasState(canvas, studentBoardId);
    }
  }

  // Save canvas state on any significant changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    const handleCanvasModified = () => {
      console.log(`Canvas ${id} modified, saving state`);
      saveCanvasState(canvas, id);
      
      // If this is a teacher board, also save to student board
      if (id.startsWith('teacher')) {
        const studentBoardId = id.replace('teacher', 'student') as WhiteboardId;
        saveCanvasState(canvas, studentBoardId);
      }
    };
    
    canvas.on('object:modified', handleCanvasModified);
    
    return () => {
      canvas.off('object:modified', handleCanvasModified);
    };
  }, [id, fabricRef]);

  const syncStateMap = {
    "teacher1": isSyncEnabled,
    "teacher2": isSync2Enabled,
    "teacher3": isSync3Enabled,
    "teacher4": isSync4Enabled,
    "teacher5": isSync5Enabled
  };
  
  const currentSyncState = syncStateMap[id as keyof typeof syncStateMap] || false;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

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
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    if (activeTool === "select") {
      console.log("Enabling selection mode");
      canvas.selection = true;
      
      canvas.getObjects().forEach(obj => {
        obj.selectable = true;
        obj.evented = true;
      });
      
      canvas.renderAll();
    }
  }, [activeTool, fabricRef]);

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

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.boardId = id;
    }
  }, [canvasRef, id]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-start",
        "transition-all duration-300 ease-in-out",
        isActive && "ring-2 ring-orange-400 bg-orange-50/30 rounded-lg shadow-lg",
        isMaximized ? "fixed inset-4 z-50 bg-white" : "w-full h-full",
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
      />
      <canvas 
        ref={canvasRef} 
        className="w-full h-full z-0" 
        tabIndex={0}
        data-board-id={id}
        onFocus={() => {
          window.__wbActiveBoard = canvasRef.current;
          window.__wbActiveBoardId = id;
          isActiveRef.current = true;
          setIsActive(true);
          if (fabricRef.current) {
            setActiveCanvas(fabricRef.current, id);
          }
          console.log(`Canvas ${id} focused and set as active`);
        }}
        onClick={handleCanvasClick}
      />
      <ActiveBoardIndicator isActive={isActive} />
    </div>
  );
};
