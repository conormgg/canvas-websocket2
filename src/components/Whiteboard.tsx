
import { useState, useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasClipboard } from "@/hooks/useCanvasClipboard";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";
import { util, FabricObject } from "fabric";
import { useClipboardContext } from "@/context/ClipboardContext";
import { cn } from "@/lib/utils";
import { ClipboardDebugPanel } from "./ClipboardDebugPanel";

interface WhiteboardProps {
  id: WhiteboardId;
  isSplitScreen?: boolean;
}

export const Whiteboard = ({ id, isSplitScreen = false }: WhiteboardProps) => {
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser">("draw");
  const [activeColor, setActiveColor] = useState<string>("#ff0000");
  const [inkThickness, setInkThickness] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(1);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);

  const { canvasRef, fabricRef } = useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom,
  });

  // Using the updated clipboard functionality with the returned methods
  const { tryExternalPaste } = useCanvasClipboard(fabricRef);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Mark this board as active when clicked
  const handleCanvasClick = () => {
    console.log(`Setting ${id} as active board`);
    window.__wbActiveBoard = canvasRef.current;
    window.__wbActiveBoardId = id;
    isActiveRef.current = true;
    setIsActive(true);
  };

  // Update active state when global active board changes
  useEffect(() => {
    const checkActiveStatus = () => {
      const isCurrentlyActive = 
        window.__wbActiveBoardId === id || 
        window.__wbActiveBoard === canvasRef.current;
      setIsActive(isCurrentlyActive);
    };

    // Check initially
    checkActiveStatus();

    // Create a MutationObserver to watch for changes to data-board-id
    const observer = new MutationObserver(checkActiveStatus);
    
    if (canvasRef.current) {
      observer.observe(canvasRef.current, {
        attributes: true,
        attributeFilter: ['data-board-id']
      });
    }

    return () => observer.disconnect();
  }, [id]);

  // Set data attributes on canvas element when it's created
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.boardId = id;
    }
  }, [canvasRef, id]);

  /* --------------------------------------------------------------
   * Cross-whiteboard sync: listen for objects drawn on another
   * board and "enliven" them locally.
   * ------------------------------------------------------------ */
  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      if (e.detail.sourceId === id) return;
      const canvas = fabricRef.current;
      if (!canvas) return;

      util
        .enlivenObjects([e.detail.object])
        .then((objects: FabricObject[]) => {
          objects.forEach((obj) => canvas.add(obj));
          canvas.renderAll();
        })
        .catch((err) => {
          console.error("Failed to enliven object", err);
          toast.error("Could not sync object to this board.");
        });
    };

    window.addEventListener("whiteboard-update", handleUpdate as EventListener);
    return () =>
      window.removeEventListener(
        "whiteboard-update",
        handleUpdate as EventListener
      );
  }, [fabricRef, id]);

  return (
    <div
      className={cn(
        "w-full h-full relative flex flex-col items-center justify-start",
        "transition-all duration-200",
        isActive && "ring-2 ring-sidebar-ring ring-opacity-50 bg-sidebar/5 rounded-lg"
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
      <div className="flex w-full">
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
            console.log(`Canvas ${id} focused and set as active`);
          }}
          onClick={handleCanvasClick}
        />
        {/* Add the ClipboardDebugPanel here */}
        <div className="w-64 ml-4">
          <ClipboardDebugPanel />
        </div>
      </div>
    </div>
  );
};
