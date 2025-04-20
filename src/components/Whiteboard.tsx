import { useState } from "react";
import { Toolbar } from "./Toolbar";
import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasClipboard } from "@/hooks/useCanvasClipboard";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";

interface WhiteboardProps {
  id: WhiteboardId;
}

export const Whiteboard = ({ id }: WhiteboardProps) => {
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser">("draw");
  const [activeColor, setActiveColor] = useState("#000000e6");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [inkThickness, setInkThickness] = useState(3);

  const { canvasRef, fabricRef } = useCanvas({
    activeTool,
    activeColor,
    inkThickness,
    onZoomChange: setZoomLevel,
    onObjectAdded: (object) => {
      const event = new CustomEvent('whiteboard-update', {
        detail: { sourceId: id, object: object.toJSON() }
      });
      window.dispatchEvent(event);
    }
  });

  useCanvasClipboard(fabricRef);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  useState(() => {
    const handleWhiteboardUpdate = (e: CustomEvent) => {
      if (e.detail.sourceId !== id && fabricRef.current) {
        fabricRef.current.loadFromJSON(e.detail.object, () => {
          fabricRef.current?.renderAll();
        });
      }
    };

    window.addEventListener('whiteboard-update', handleWhiteboardUpdate as EventListener);
    return () => {
      window.removeEventListener('whiteboard-update', handleWhiteboardUpdate as EventListener);
    };
  });

  return (
    <div 
      className="relative w-full h-full" 
      onContextMenu={handleContextMenu}
    >
      <div className="absolute top-0 left-0 w-full z-10">
        <div className="flex justify-between items-center p-2 px-3">
          <div className="scale-90 origin-left">
            <Toolbar 
              activeTool={activeTool}
              activeColor={activeColor}
              onToolChange={setActiveTool}
              onColorChange={setActiveColor}
              inkThickness={inkThickness}
              onInkThicknessChange={setInkThickness}
            />
          </div>
          <div className="bg-[#221F26] text-white px-2 py-1 rounded-lg text-sm">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full touch-none" />
    </div>
  );
};
