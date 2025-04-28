
import { useState, useEffect, useRef } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { WhiteboardId } from "@/types/canvas";
import { useClipboardContext } from "@/context/ClipboardContext";
import { useSyncContext } from "@/context/SyncContext";
import { cn } from "@/lib/utils";
import { Toolbar } from "./Toolbar";
import { ActiveBoardIndicator } from "./whiteboard/ActiveBoardIndicator";
import { WhiteboardProps } from "@/types/whiteboard";
import { useBoardSync } from "@/hooks/useBoardSync";

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
  // Generate a unique instance ID for this whiteboard instance
  const instanceIdRef = useRef<string>(`${id}-${Math.random().toString(36).substring(2, 9)}`);

  const { setActiveCanvas, activeBoardId } = useClipboardContext();
  const { linkedBoards } = useSyncContext();
  
  const isLinkedBoard = linkedBoards.includes(id);

  const { canvasRef, fabricRef } = useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom,
    instanceId: instanceIdRef.current
  });
  
  // Use the new sync hook
  useBoardSync(id, fabricRef, instanceIdRef.current);

  // Set canvas instance ID when canvas is created
  useEffect(() => {
    if (fabricRef.current) {
      if (fabricRef.current.lowerCanvasEl) {
        fabricRef.current.lowerCanvasEl.id = instanceIdRef.current;
      }
      if (fabricRef.current.upperCanvasEl) {
        fabricRef.current.upperCanvasEl.id = instanceIdRef.current;
      }
    }
  }, [fabricRef.current]);

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
        isLinkedBoard && "border-2 border-green-400"
      )}
      onContextMenu={handleContextMenu}
      onClick={handleCanvasClick}
      data-instance-id={instanceIdRef.current}
      data-board-id={id}
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
        isLinked={isLinkedBoard}
      />
      <canvas 
        ref={canvasRef} 
        className="w-full h-full z-0" 
        tabIndex={0}
        data-board-id={id}
        id={instanceIdRef.current}
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
      <ActiveBoardIndicator isActive={isActive} isLinked={isLinkedBoard} />
    </div>
  );
};
