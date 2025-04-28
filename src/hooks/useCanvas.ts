
import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";
import { UseCanvasProps } from "@/types/canvas";
import { useCanvasMouseHandlers } from "./useCanvasMouseHandlers";
import { useCanvasTools } from "./useCanvasTools";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useClipboardContext } from "@/context/ClipboardContext";
import { useSyncContext } from "@/context/SyncContext";
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
  const { sendObjectToStudents } = useSyncContext();

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

    // Handle path creation and syncing
    canvas.on("path:created", (e) => {
      if (e.path) {
        console.log(`${id} created a path`);
        isDrawingRef.current = false;
        
        // If this is a teacher board, send to students
        if (id.startsWith("teacher")) {
          try {
            console.log(`Sending path from ${id} to corresponding student board`);
            const serializedPath = e.path.toObject();
            sendObjectToStudents(serializedPath, id);
          } catch (err) {
            console.error(`Error sending path from ${id}:`, err);
          }
        }
        
        // Also notify onObjectAdded if provided
        if (onObjectAdded) {
          onObjectAdded(e.path);
        }
      }
    });
    
    // Listen for objects being added from other sources
    canvas.on("object:added", (e) => {
      // Avoid duplicate notifications for path:created events
      if (e.target && !isDrawingRef.current) {
        console.log(`${id} added an object (not from drawing)`);
        
        // If this is a teacher board and not from drawing, sync it
        if (id.startsWith("teacher") && !isDrawingRef.current) {
          try {
            console.log(`Sending object from ${id} to corresponding student board`);
            const serializedObject = e.target.toObject();
            sendObjectToStudents(serializedObject, id);
          } catch (err) {
            console.error(`Error sending object from ${id}:`, err);
          }
        }
        
        // Also notify onObjectAdded if provided
        if (onObjectAdded) {
          onObjectAdded(e.target);
        }
      }
    });

    canvas.on("mouse:wheel", handleMouseWheel);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    
    // Track drawing state
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
  }, [id, onObjectAdded, sendObjectToStudents]);

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
