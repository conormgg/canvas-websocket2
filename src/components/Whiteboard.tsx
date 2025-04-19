
import { useState } from "react";
import { Toolbar } from "./Toolbar";
import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasClipboard } from "@/hooks/useCanvasClipboard";

export const Whiteboard = () => {
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser">("draw");
  const [activeColor, setActiveColor] = useState("#000000e6");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [inkThickness, setInkThickness] = useState(3);

  const { canvasRef, fabricRef } = useCanvas({
    activeTool,
    activeColor,
    inkThickness,
    onZoomChange: setZoomLevel
  });

  // Use new clipboard functionality
  useCanvasClipboard(fabricRef);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className="relative w-full h-full" 
      onContextMenu={handleContextMenu}
    >
      <div className="absolute top-0 left-0 w-full z-10">
        <div className="flex justify-between items-center p-4">
          <Toolbar 
            activeTool={activeTool}
            activeColor={activeColor}
            onToolChange={setActiveTool}
            onColorChange={setActiveColor}
            inkThickness={inkThickness}
            onInkThicknessChange={setInkThickness}
          />
          <div className="bg-[#221F26] text-white px-3 py-1 rounded-lg">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
