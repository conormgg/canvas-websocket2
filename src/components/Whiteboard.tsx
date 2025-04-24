
import { useState, useEffect } from "react";
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
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser">(
    "draw"
  );
  const [activeColor, setActiveColor] = useState<string>("#ff0000");
  const [inkThickness, setInkThickness] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(1);

  const { canvasRef, fabricRef } = useCanvas({
    id,
    activeTool,
    activeColor,
    inkThickness,
    isSplitScreen,
    onZoomChange: setZoom,
  });

  // Using the updated clipboard functionality
  useCanvasClipboard(fabricRef);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

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
      <canvas ref={canvasRef} className="w-full h-full z-0" />
    </div>
  );
};
