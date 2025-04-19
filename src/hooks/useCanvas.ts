
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: activeTool === "draw",
    });

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = inkThickness;
      canvas.freeDrawingBrush.color = activeColor;
    }

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
    };

    window.addEventListener('resize', handleResize);
    updateCursorAndNotify(canvas, activeTool);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!fabricRef.current) return;
    
    fabricRef.current.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
    
    if (fabricRef.current.freeDrawingBrush) {
      if (activeTool === "draw") {
        fabricRef.current.freeDrawingBrush.color = activeColor;
        fabricRef.current.freeDrawingBrush.width = inkThickness;
      } else if (activeTool === "eraser") {
        fabricRef.current.freeDrawingBrush.color = "#ffffff";
        fabricRef.current.freeDrawingBrush.width = inkThickness * 2;
      }
    }
    
    updateCursorAndNotify(fabricRef.current, activeTool);
  }, [activeTool, activeColor, inkThickness]);

  return { canvasRef, fabricRef };
};
