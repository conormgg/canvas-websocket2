
import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";
import { UseCanvasProps, WhiteboardId } from "@/types/canvas";
import { useCanvasMouseHandlers } from "./useCanvasMouseHandlers";
import { useCanvasTools } from "./useCanvasTools";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

export const useCanvas = ({
  id,
  activeTool,
  activeColor,
  inkThickness,
  onZoomChange,
  onObjectAdded,
  isSplitScreen,
}: UseCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const { updateCursorAndNotify } = useCanvasTools();
  const {
    handleMouseWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvasMouseHandlers(
    fabricRef, 
    activeTool, 
    onZoomChange || (() => {})
  );

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(fabricRef);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Set data attribute on canvas element to identify the board
    canvasRef.current.dataset.boardId = id;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: activeTool === "draw" || activeTool === "eraser",
      preserveObjectStacking: true,
      selection: false,
    });

    // Also set data attribute on fabric-created elements
    if (canvas.lowerCanvasEl) canvas.lowerCanvasEl.dataset.boardId = id;
    if (canvas.upperCanvasEl) canvas.upperCanvasEl.dataset.boardId = id;

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

    window.addEventListener("resize", handleResize);

    updateCursorAndNotify(canvas, activeTool, inkThickness);

    return () => {
      canvas.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Update drawing mode, brush settings and cursor on tool/color changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (activeTool === "draw" || activeTool === "eraser") {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = inkThickness;
        canvas.freeDrawingBrush.color =
          activeTool === "draw" ? activeColor : "#ffffff";
      }
    } else {
      canvas.isDrawingMode = false;
    }
    updateCursorAndNotify(canvas, activeTool, inkThickness);
  }, [activeTool, activeColor, inkThickness]);

  return { canvasRef, fabricRef };
};
