
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
      isDrawingMode: true,
    });

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
    toast("Draw mode enabled. Click and drag to draw!");

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!fabricRef.current) return;
    
    fabricRef.current.isDrawingMode = activeTool === "draw";
    
    if (fabricRef.current.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.color = activeTool === "draw" ? activeColor : "#ffffff";
      fabricRef.current.freeDrawingBrush.width = activeTool === "draw" ? inkThickness : 20;
    }
    
    if (activeTool === "draw") {
      fabricRef.current.defaultCursor = 'crosshair';
      toast("Draw mode enabled. Click and drag to draw!");
    } else if (activeTool === "eraser") {
      fabricRef.current.defaultCursor = 'cell';
      toast("Eraser mode enabled. Click and drag to erase!");
    } else {
      fabricRef.current.defaultCursor = 'default';
      toast("Select mode enabled. Click objects to select them!");
    }
  }, [activeTool, activeColor, inkThickness]);

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

    if (e.button === 2) {
      canvas.defaultCursor = 'grabbing';
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();

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
    } else if (e.button === 0 && activeTool === "draw") {
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (opt: any) => {
    const e = opt.e as MouseEvent;
    const canvas = fabricRef.current;
    if (!canvas) return;

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
    canvas.defaultCursor = 'default';
    canvas.selection = true;
    lastPosX = 0;
    lastPosY = 0;
    setIsDrawing(false);
  };

  return { canvasRef, fabricRef };
};
