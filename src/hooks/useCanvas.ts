
import { useEffect, useRef, useState } from "react";
import { Canvas, Point, Circle } from "fabric";
import { toast } from "sonner";

interface UseCanvasProps {
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  inkThickness: number;
  onZoomChange: (zoom: number) => void;
}

export const useCanvas = ({ activeTool, activeColor, inkThickness, onZoomChange }: UseCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: activeTool === "draw",
    });

    // Initialize the brush settings
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
    
    // Set appropriate cursor and show toast
    updateCursorAndNotify(canvas, activeTool);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update canvas when tools or settings change
  useEffect(() => {
    if (!fabricRef.current) return;
    
    // Set drawing mode based on active tool
    fabricRef.current.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
    
    if (fabricRef.current.freeDrawingBrush) {
      // Set brush color and width based on tool
      if (activeTool === "draw") {
        fabricRef.current.freeDrawingBrush.color = activeColor;
        fabricRef.current.freeDrawingBrush.width = inkThickness;
      } else if (activeTool === "eraser") {
        fabricRef.current.freeDrawingBrush.color = "#ffffff"; // White for eraser
        fabricRef.current.freeDrawingBrush.width = inkThickness * 2; // Make eraser slightly bigger
      }
    }
    
    // Update cursor and show notification
    updateCursorAndNotify(fabricRef.current, activeTool);
  }, [activeTool, activeColor, inkThickness]);

  const updateCursorAndNotify = (canvas: Canvas, tool: string) => {
    if (tool === "draw") {
      canvas.defaultCursor = 'crosshair';
      toast("Draw mode enabled. Click and drag to draw!");
    } else if (tool === "eraser") {
      canvas.defaultCursor = 'cell';
      toast("Eraser mode enabled. Click and drag to erase!");
    } else {
      canvas.defaultCursor = 'default';
      toast("Select mode enabled. Click objects to select them!");
    }
  };

  const handleMouseWheel = (opt: any) => {
    const e = opt.e as WheelEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

    const delta = e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    zoom = Math.min(Math.max(0.1, zoom), 20);
    
    const pointer = new Point(e.offsetX, e.offsetY);
    canvas.zoomToPoint(pointer, zoom);
    onZoomChange(Math.round(zoom * 100) / 100);
    
    // Only show zoom indicator dot when not drawing
    if (!isDrawing) {
      const dot = new Circle({
        left: e.offsetX,
        top: e.offsetY,
        radius: 2,
        fill: '#ff0000',
        opacity: 0.5,
        selectable: false,
      });
      canvas.add(dot);
      setTimeout(() => canvas.remove(dot), 300);
    }
    
    e.preventDefault();
    e.stopPropagation();
  };

  let lastPosX = 0;
  let lastPosY = 0;

  const handleMouseDown = (opt: any) => {
    const e = opt.e as MouseEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Right click for panning
    if (e.button === 2) {
      canvas.defaultCursor = 'grabbing';
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();

      // Show indicator dot for right-click
      const dot = new Circle({
        left: e.offsetX,
        top: e.offsetY,
        radius: 3,
        fill: '#00ff00',
        opacity: 0.5,
        selectable: false,
      });
      canvas.add(dot);
      setTimeout(() => canvas.remove(dot), 300);
    } 
    // Left click
    else if (e.button === 0) {
      if (activeTool === "draw" || activeTool === "eraser") {
        setIsDrawing(true);
      }
    }
  };

  const handleMouseMove = (opt: any) => {
    const e = opt.e as MouseEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Handle panning with right mouse button
    if (e.buttons === 2) {
      canvas.setCursor('grabbing');
      
      if (lastPosX === 0) lastPosX = e.clientX;
      if (lastPosY === 0) lastPosY = e.clientY;
      
      const delta = new Point(e.clientX - lastPosX, e.clientY - lastPosY);
      canvas.relativePan(delta);
      
      canvas.requestRenderAll();
      lastPosX = e.clientX;
      lastPosY = e.clientY;
    }
  };

  const handleMouseUp = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.setViewportTransform(canvas.viewportTransform!);
    
    // Reset cursor based on current tool
    if (activeTool === "draw") {
      canvas.defaultCursor = 'crosshair';
    } else if (activeTool === "eraser") {
      canvas.defaultCursor = 'cell';
    } else {
      canvas.defaultCursor = 'default';
    }
    
    canvas.selection = true;
    lastPosX = 0;
    lastPosY = 0;
    setIsDrawing(false);
  };

  return { canvasRef, fabricRef };
};
