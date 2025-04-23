
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
  const [activeColor, setActiveColor] = useState("#000000e6");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [inkThickness, setInkThickness] = useState(3);

  const { canvasRef, fabricRef } = useCanvas({
    activeTool,
    activeColor,
    inkThickness,
    onZoomChange: setZoomLevel,
    onObjectAdded: (object) => {
      const event = new CustomEvent("whiteboard-update", {
        detail: { sourceId: id, object: object.toJSON() },
      });
      window.dispatchEvent(event);
    },
  });

  useCanvasClipboard(fabricRef);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Listen for remote whiteboard updates and add objects incrementally
  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      if (e.detail.sourceId === id) return;
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Using enlivenObjects with a callback function directly
      util.enlivenObjects([e.detail.object], (objects: FabricObject[]) => {
        objects.forEach((obj) => canvas.add(obj));
        canvas.renderAll();
      });
    };

    window.addEventListener("whiteboard-update", handleUpdate as EventListener);
    return () => {
      window.removeEventListener(
        "whiteboard-update",
        handleUpdate as EventListener
      );
    };
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
