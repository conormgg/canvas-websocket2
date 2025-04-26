
import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';

export const useWhiteboardState = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser">("draw");
  const [activeColor, setActiveColor] = useState<string>("#ff0000");
  const [inkThickness, setInkThickness] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(1);

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

  return {
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    inkThickness,
    setInkThickness,
    zoom,
    setZoom
  };
};
