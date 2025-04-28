
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
  const isDrawingRef = useRef<boolean>(false);

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
      // Listen for path creation (when drawing ends)
      canvas.on("path:created", (e) => {
        if (e.path && id === activeBoardId) {
          console.log(`${id} created a path, notifying onObjectAdded`);
          onObjectAdded(e.path);
        }
      });
      
      // Listen for objects being added from other sources
      canvas.on("object:added", (e) => {
        // Only notify if this isn't from a path:created event (which we already handle above)
        // and if this is the active board (to prevent duplicate notifications)
        if (e.target && id === activeBoardId && !isDrawingRef.current) {
          console.log(`${id} added an object (not from drawing), notifying onObjectAdded`);
          onObjectAdded(e.target);
        }
      });
    }

    canvas.on("mouse:wheel", handleMouseWheel);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    
    // Track drawing state
    canvas.on("path:created", () => {
      isDrawingRef.current = false;
    });
    
    canvas.on("mouse:down", () => {
      if (activeTool === "draw" || activeTool === "eraser") {
        isDrawingRef.current = true;
      }
    });

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
