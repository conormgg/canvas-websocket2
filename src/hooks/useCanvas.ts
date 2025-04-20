
import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";
import { UseCanvasProps } from "@/types/canvas";
import { useCanvasMouseHandlers } from "./useCanvasMouseHandlers";
import { useCanvasTools } from "./useCanvasTools";

export const useCanvas = ({ activeTool, activeColor, inkThickness, onZoomChange, onObjectAdded }: UseCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const { updateCursorAndNotify } = useCanvasTools();
  const { 
    handleMouseWheel, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp,
    handleKeyDown 
  } = useCanvasMouseHandlers(fabricRef, activeTool, onZoomChange);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvasEl = canvasRef.current;
    const parent = canvasEl.parentElement!;
    const { width, height } = parent.getBoundingClientRect();

    const canvas = new Canvas(canvasEl, {
      width,
      height,
      backgroundColor: "#ffffff",
      isDrawingMode: activeTool === "draw" || activeTool === "eraser",
      preserveObjectStacking: true,
      selection: false,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = inkThickness;
    canvas.freeDrawingBrush.color = activeColor;

    if (onObjectAdded) {
      canvas.on('object:added', (e) => {
        if (e.target) {
          onObjectAdded(e.target);
        }
      });
    }

    canvas.on('mouse:wheel', handleMouseWheel);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    fabricRef.current = canvas;

    // Use ResizeObserver instead of window resize event
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      canvas.setDimensions({ width, height });
      canvas.requestRenderAll();
    });
    ro.observe(parent);

    window.addEventListener('keydown', handleKeyDown);
    updateCursorAndNotify(canvas, activeTool, inkThickness);

    return () => {
      ro.disconnect();
      canvas.dispose();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    if (activeTool === "select") {
      canvas.isDrawingMode = false;
      canvas.selection = false;
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
        canvas.freeDrawingBrush.color = "#ffffff";
        canvas.freeDrawingBrush.width = inkThickness * 2;
      }
    }
    
    updateCursorAndNotify(canvas, activeTool, inkThickness);
    canvas.renderAll();
  }, [activeTool, activeColor, inkThickness]);

  return { canvasRef, fabricRef };
};
