import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";
import { UseCanvasProps } from "@/types/canvas";
import { useCanvasMouseHandlers } from "./useCanvasMouseHandlers";
import { useCanvasTools } from "./useCanvasTools";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useClipboardContext } from "@/context/ClipboardContext";
import { createGrid } from "@/utils/gridUtils";

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

  useKeyboardShortcuts(fabricRef);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.dataset.boardId = id;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: activeTool === "draw" || activeTool === "eraser",
      preserveObjectStacking: true,
      selection: false,
    });

    if (canvas.lowerCanvasEl) canvas.lowerCanvasEl.dataset.boardId = id;
    if (canvas.upperCanvasEl) canvas.upperCanvasEl.dataset.boardId = id;

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = inkThickness;
    canvas.freeDrawingBrush.color = activeColor;

    if (id === "teacher1") {
      createGrid(canvas);
    }

    if (onObjectAdded) {
      canvas.on("object:added", (e) => {
        if (e.target && id === activeBoardId) {
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
        
        if (id === "teacher1") {
          createGrid(canvas);
        }
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
