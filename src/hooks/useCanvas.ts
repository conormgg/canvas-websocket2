
import { useEffect, useRef } from "react";
import { Canvas } from "fabric";
import { UseCanvasProps } from "@/types/canvas";
import { useCanvasMouseHandlers } from "./useCanvasMouseHandlers";
import { useCanvasTools } from "./useCanvasTools";

export const useCanvas = ({ activeTool, activeColor, inkThickness, onZoomChange }: UseCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const { updateCursorAndNotify } = useCanvasTools();
  const { handleMouseWheel, handleMouseDown, handleMouseMove, handleMouseUp } = 
    useCanvasMouseHandlers(fabricRef, activeTool, onZoomChange);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: false,
      preserveObjectStacking: true,
    });

    // Set up initial brush properties
    canvas.freeDrawingBrush.width = inkThickness;
    canvas.freeDrawingBrush.color = activeColor;

    // Event listeners
    canvas.on('mouse:wheel', handleMouseWheel);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    fabricRef.current = canvas;

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);
    updateCursorAndNotify(canvas, activeTool);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update canvas based on tool, color, and thickness changes
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    // Only set drawing mode directly when eraser is active, 
    // for draw tool we'll enable it on Ctrl+click
    canvas.isDrawingMode = activeTool === "eraser";
    
    if (canvas.freeDrawingBrush) {
      if (activeTool === "draw") {
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = inkThickness;
      } else if (activeTool === "eraser") {
        canvas.freeDrawingBrush.color = "#ffffff";
        canvas.freeDrawingBrush.width = inkThickness * 2;
      }
    }
    
    updateCursorAndNotify(canvas, activeTool);
    canvas.renderAll();
  }, [activeTool, activeColor, inkThickness]);

  return { canvasRef, fabricRef };
};
