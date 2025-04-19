
import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";
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
      isDrawingMode: activeTool === "draw" || activeTool === "eraser",
      preserveObjectStacking: true,
      selection: activeTool === "select", // Enable selection when select tool is active
    });

    // Initialize free drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    
    // Set brush properties
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
    updateCursorAndNotify(canvas, activeTool, inkThickness);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update canvas based on tool, color, and thickness changes
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    // Update drawing mode based on active tool
    if (activeTool === "select") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.interactive = true;
    } else if (activeTool === "draw") {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = inkThickness;
      }
    } else if (activeTool === "eraser") {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = "#ffffff"; // White for eraser
        canvas.freeDrawingBrush.width = inkThickness * 2; // Double thickness for eraser
      }
    }
    
    updateCursorAndNotify(canvas, activeTool, inkThickness);
    canvas.renderAll();
  }, [activeTool, activeColor, inkThickness]);

  return { canvasRef, fabricRef };
};
