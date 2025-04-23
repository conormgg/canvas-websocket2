
import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";
import { UseCanvasProps } from "@/types/canvas";
import { useCanvasMouseHandlers } from "./useCanvasMouseHandlers";
import { useCanvasTools } from "./useCanvasTools";

export const useCanvas = ({
  activeTool,
  activeColor,
  inkThickness,
  onZoomChange,
  onObjectAdded,
}: UseCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const { updateCursorAndNotify } = useCanvasTools();
  const {
    handleMouseWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
  } = useCanvasMouseHandlers(fabricRef, activeTool, onZoomChange);

  // Create the canvas only once
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: activeTool === "draw" || activeTool === "eraser",
      preserveObjectStacking: true,
      selection: activeTool === "select",
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = inkThickness;
    canvas.freeDrawingBrush.color = activeColor;

    if (onObjectAdded) {
      canvas.on("object:added", (e) => {
        if (e.target) {
          onObjectAdded(e.target);
        }
      });
    }

    // Add event listeners
    canvas.on("mouse:wheel", handleMouseWheel);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    fabricRef.current = canvas;

    const handleResize = () => {
      const parent = canvasRef.current?.parentElement;
      if (parent) {
        canvas.setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      } else {
        canvas.setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
      canvas.renderAll();
    };

    // Set initial size
    handleResize();

    // Add window event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    updateCursorAndNotify(canvas, activeTool, inkThickness);

    return () => {
      // Properly clean up event listeners
      canvas.off("mouse:wheel");
      canvas.off("mouse:down");
      canvas.off("mouse:move");
      canvas.off("mouse:up");
      
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      
      canvas.dispose();
    };
  }, []);

  // Update drawing mode, brush settings and cursor on tool/color changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Update drawing mode
    canvas.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
    
    // Update selection mode
    canvas.selection = activeTool === "select";
    
    // Update brush settings
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = inkThickness;
      canvas.freeDrawingBrush.color = activeTool === "draw" ? activeColor : "#ffffff";
    }
    
    // Update cursor
    updateCursorAndNotify(canvas, activeTool, inkThickness);
    
    // Re-render canvas with updates
    canvas.renderAll();
  }, [activeTool, activeColor, inkThickness]);

  return { canvasRef, fabricRef };
};
