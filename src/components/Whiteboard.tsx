
import { useState } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { WhiteboardId } from "@/types/canvas";
import { useClipboardContext } from "@/context/ClipboardContext";
import { useSyncContext } from "@/context/SyncContext";
import { cn } from "@/lib/utils";
import { Toolbar } from "./Toolbar";
import { ActiveBoardIndicator } from "./whiteboard/ActiveBoardIndicator";
import { WhiteboardProps } from "@/types/whiteboard";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useCanvasPersistence } from "@/hooks/useCanvasPersistence";
import { useBoardActivity } from "@/hooks/useBoardActivity";

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
  const { isSyncEnabled, isSync2Enabled, isSync3Enabled, isSync4Enabled, isSync5Enabled } = useSyncContext();

  const isTeacherView = window.location.pathname.includes('/teacher') || 
                       window.location.pathname === '/' ||
                       window.location.pathname.includes('/split-mode');

  const { canvasRef, fabricRef } = useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom,
    onObjectAdded: handleObjectAdded,
  });
  
  const isStudent = id.startsWith('student');
  useRealtimeSync(fabricRef, id, isStudent);

  const { handleObjectAdded } = useCanvasPersistence(fabricRef, id, isTeacherView);
  const { isActive } = useBoardActivity(id, canvasRef);

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

  const syncStateMap = {
    "teacher1": isSyncEnabled,
    "teacher2": isSync2Enabled,
    "teacher3": isSync3Enabled,
    "teacher4": isSync4Enabled,
    "teacher5": isSync5Enabled
  };
  
  const currentSyncState = syncStateMap[id as keyof typeof syncStateMap] || false;

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
      />
      <ActiveBoardIndicator isActive={isActive} />
    </div>
  );
};
