
import { useState, useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasClipboard } from "@/hooks/useCanvasClipboard";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";
import { util, FabricObject } from "fabric";

interface WhiteboardProps {
  id: WhiteboardId;
  isSplitScreen?: boolean;
}

export const Whiteboard = ({ id, isSplitScreen = false }: WhiteboardProps) => {
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser">("draw");
  const [activeColor, setActiveColor] = useState<string>("#ff0000");
  const [inkThickness, setInkThickness] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(1);
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
    // Update global reference to track which board is currently active
    window.__wbActiveBoard = canvasRef.current;
    window.__wbActiveBoardId = id;
    isActiveRef.current = true;
  };

  // Add global paste event listener specifically for this whiteboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle if this whiteboard's canvas is focused/active
      if (window.__wbActiveBoardId === id) {
        console.log(`Paste event detected for active board ${id}`);
        tryExternalPaste();
        // Prevent the event from bubbling to avoid multiple boards handling it
        e.stopPropagation();
      }
    };

    // Attach a direct paste event listener to the document
    document.addEventListener("paste", handlePaste);
    
    // Clean up
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [canvasRef, tryExternalPaste, id]);

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
      className="w-full h-full relative flex flex-col items-center justify-start"
      onContextMenu={handleContextMenu}
      onClick={handleCanvasClick} // Added click handler to the container
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
        tabIndex={0} // Make canvas focusable
        data-board-id={id} // Add data attribute to identify the board
        onFocus={() => {
          window.__wbActiveBoard = canvasRef.current;
          window.__wbActiveBoardId = id;
          isActiveRef.current = true;
        }}
        onClick={handleCanvasClick}
      />
    </div>
  );
};
