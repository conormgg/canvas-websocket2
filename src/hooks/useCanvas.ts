
import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";
import { UseCanvasProps, WhiteboardId } from "@/types/canvas";
import { useCanvasMouseHandlers } from "./useCanvasMouseHandlers";
import { useCanvasTools } from "./useCanvasTools";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useClipboardContext } from "@/context/ClipboardContext";
import { useCanvasKeyboard } from "./useCanvasKeyboard";
import { useTouchHandlers } from "./touch/useTouchHandlers";

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
  const { activeBoardId } = useClipboardContext();

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

  // Adding keyboard and touch handlers to ensure they work
  useKeyboardShortcuts(fabricRef);
  useCanvasKeyboard(fabricRef);
  useTouchHandlers(fabricRef);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.dataset.boardId = id;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: false, // Start with drawing mode disabled
      preserveObjectStacking: true,
      selection: false,
    });

    if (canvas.lowerCanvasEl) canvas.lowerCanvasEl.dataset.boardId = id;
    if (canvas.upperCanvasEl) canvas.upperCanvasEl.dataset.boardId = id;

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = inkThickness;
    canvas.freeDrawingBrush.color = activeColor;

    if (onObjectAdded) {
      canvas.on("object:added", (e) => {
        // Only proceed if this is the active board
        if (activeBoardId === id && e.target) {
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

    // Initial cursor setup
    updateCursorAndNotify(canvas, activeTool, inkThickness);

    return () => {
      canvas.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Critical fix: Only enable drawing mode if this is the active board
    const isActiveBoard = id === activeBoardId;
    
    console.log(`Canvas ${id} - Active: ${isActiveBoard}, Tool: ${activeTool}`);

    // Set drawing mode based on active status and tool
    if (isActiveBoard) {
      canvas.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
      
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = inkThickness;
        canvas.freeDrawingBrush.color = 
          activeTool === "draw" ? activeColor : "#ffffff";
      }
      
      // Update cursor
      updateCursorAndNotify(canvas, activeTool, inkThickness);
    } else {
      // If not active board, disable drawing mode
      canvas.isDrawingMode = false;
    }
    
    canvas.renderAll();
  }, [activeTool, activeColor, inkThickness, activeBoardId, id]);

  return { canvasRef, fabricRef };
};
