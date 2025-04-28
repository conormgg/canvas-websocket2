
import { useEffect, useRef, useMemo } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useClipboardContext } from "@/context/ClipboardContext";
import { cn } from "@/lib/utils";
import { Toolbar } from "./Toolbar";
import { ActiveBoardIndicator } from "./whiteboard/ActiveBoardIndicator";
import { useTeacherUpdates } from "@/hooks/useTeacherUpdates";
import { useBoardUpdates } from "@/hooks/useBoardUpdates";
import { WhiteboardProps } from "@/types/whiteboard";
import { useWhiteboardState } from "@/hooks/useWhiteboardState";
import { useWhiteboardInteractions } from "@/hooks/useWhiteboardInteractions";
import { WhiteboardCanvas } from "./whiteboard/WhiteboardCanvas";
import { useSyncContext } from "@/context/SyncContext";

export const Whiteboard = ({ 
  id, 
  isSplitScreen = false,
  onCtrlClick,
  isMaximized: initialIsMaximized = false 
}: WhiteboardProps) => {
  const { state, updateState } = useWhiteboardState(initialIsMaximized);
  const isActiveRef = useRef(false);
  const prevSyncState = useRef(false);

  const { activeBoardId } = useClipboardContext();
  const syncContext = useSyncContext();
  
  // Use useMemo to prevent unnecessary re-calculations
  const currentSyncState = useMemo(() => {
    const syncStateMap = {
      "teacher1": syncContext.isSyncEnabled,
      "teacher2": syncContext.isSync2Enabled,
      "teacher3": false,
      "teacher4": false,
      "teacher5": false
    };
    return syncStateMap[id as keyof typeof syncStateMap] || false;
  }, [id, syncContext.isSyncEnabled, syncContext.isSync2Enabled]);

  // Only update prevSyncState when currentSyncState changes
  useEffect(() => {
    prevSyncState.current = currentSyncState;
  }, [currentSyncState]);

  // Handle object added for sync purposes - simplified and memoized
  const handleObjectAdded = useMemo(() => (obj: any) => {
    console.log(`Object added to ${id}, checking if we need to sync`);
    // Actual sync logic is now handled in useCanvas
  }, [id]);

  const { canvasRef, fabricRef } = useCanvas({
    id,
    activeTool: state.activeTool,
    activeColor: state.activeColor,
    inkThickness: state.inkThickness,
    isSplitScreen,
    onZoomChange: (zoom) => updateState({ zoom }),
    onObjectAdded: handleObjectAdded,
  });

  useTeacherUpdates(id, fabricRef, currentSyncState);
  useBoardUpdates(id, fabricRef);

  const { handleContextMenu, handleCanvasClick } = useWhiteboardInteractions(
    id,
    canvasRef,
    fabricRef,
    (isActive) => updateState({ isActive }),
    onCtrlClick
  );

  useEffect(() => {
    updateState({ isActive: activeBoardId === id });
  }, [activeBoardId, id, updateState]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-start",
        "transition-all duration-300 ease-in-out",
        state.isActive && "ring-2 ring-orange-400 bg-orange-50/30 rounded-lg shadow-lg",
        state.isMaximized ? "fixed inset-4 z-50 bg-white" : "w-full h-full",
      )}
      onContextMenu={handleContextMenu}
      onClick={handleCanvasClick}
    >
      <Toolbar
        activeTool={state.activeTool}
        activeColor={state.activeColor}
        onToolChange={(tool) => updateState({ activeTool: tool })}
        onColorChange={(color) => updateState({ activeColor: color })}
        inkThickness={state.inkThickness}
        onInkThicknessChange={(thickness) => updateState({ inkThickness: thickness })}
        isSplitScreen={isSplitScreen}
        boardId={id}
      />
      <WhiteboardCanvas
        id={id}
        isActive={state.isActive}
        canvasRef={canvasRef}
        fabricRef={fabricRef}
        onCanvasClick={handleCanvasClick}
      />
      <ActiveBoardIndicator isActive={state.isActive} />
    </div>
  );
};
