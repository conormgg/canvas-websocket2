
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

    // Use PencilBrush to avoid potential SVG/evaluation issues
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = inkThickness;
    canvas.freeDrawingBrush.color = activeColor;

    // Add event listeners
    canvas.on("mouse:wheel", handleMouseWheel);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    if (onObjectAdded) {
      canvas.on("object:added", (e) => {
        if (e.target) {
          onObjectAdded(e.target);
        }
      });
    }

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

    return () => {
      canvas.off("mouse:wheel");
      canvas.off("mouse:down");
      canvas.off("mouse:move");
      canvas.off("mouse:up");
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
    };
  }, []);

  // Update drawing mode and brush settings when tool/color changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Update brush settings
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = inkThickness;
      canvas.freeDrawingBrush.color = activeTool === "draw" ? activeColor : "#ffffff";
    }
    
    // Update cursor without using any data URLs or eval
    updateCursorAndNotify(canvas, activeTool, inkThickness);
    
    // Set the drawing mode
    canvas.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
    canvas.selection = activeTool === "select";
    
    canvas.renderAll();
  }, [activeTool, activeColor, inkThickness, updateCursorAndNotify]);

  return { canvasRef, fabricRef };
};
