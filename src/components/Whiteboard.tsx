
import { useEffect, useRef, useState } from "react";
import { Canvas, Point, Circle, Image as FabricImage } from "fabric";
import { Toolbar } from "./Toolbar";
import { toast } from "sonner";

export const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser">("draw");
  const [activeColor, setActiveColor] = useState("#000000e6");
  const [zoomLevel, setZoomLevel] = useState(1);
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
      canvas.freeDrawingBrush.width = 3;
      canvas.freeDrawingBrush.color = activeColor;
    }

    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent;
      const delta = e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(0.1, zoom), 20);
      
      const pointer = new Point(e.offsetX, e.offsetY);
      canvas.zoomToPoint(pointer, zoom);
      setZoomLevel(Math.round(zoom * 100) / 100);
      
      // Only show zoom indicator dot, not drawing dots
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
    });

    canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      if (e.button === 2) { // Right click for panning
        canvas.defaultCursor = 'grabbing';
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.renderAll();

        // Only show panning indicator dot, not drawing dots
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
      } else if (e.button === 0 && activeTool === "draw") { // Left click for drawing
        setIsDrawing(true);
      }
    });

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:move', (opt) => {
      const e = opt.e as MouseEvent;
      if (e.buttons === 2) { // Right mouse button for panning
        isDragging = true;
        canvas.setCursor('grabbing');
        
        if (lastPosX === 0) lastPosX = e.clientX;
        if (lastPosY === 0) lastPosY = e.clientY;
        
        const delta = new Point(e.clientX - lastPosX, e.clientY - lastPosY);
        canvas.relativePan(delta);
        
        canvas.requestRenderAll();
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', () => {
      canvas.setViewportTransform(canvas.viewportTransform!);
      isDragging = false;
      canvas.defaultCursor = 'default';
      canvas.selection = true;
      lastPosX = 0;
      lastPosY = 0;
      setIsDrawing(false);
    });

    document.addEventListener('paste', (e) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          
          const reader = new FileReader();
          reader.onload = (event) => {
            const imgUrl = event.target?.result as string;
            if (!imgUrl) return;
            
            FabricImage.fromURL(imgUrl).then((img) => {
              img.scale(0.5);
              img.scaleToWidth(200);
              canvas.add(img);
              canvas.centerObject(img);
              canvas.setActiveObject(img);
              canvas.renderAll();
              toast("Image added to whiteboard");
            });
          };
          reader.readAsDataURL(blob);
        }
      }
    });

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
      fabricRef.current.freeDrawingBrush.width = activeTool === "draw" ? 3 : 20;
    }
    
    // Update the cursor based on the active tool
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
  }, [activeTool, activeColor]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className="relative w-full h-full" 
      onContextMenu={handleContextMenu}
    >
      <div className="absolute top-0 left-0 w-full z-10">
        <div className="flex justify-between items-center p-4">
          <Toolbar 
            activeTool={activeTool}
            activeColor={activeColor}
            onToolChange={setActiveTool}
            onColorChange={setActiveColor}
          />
          <div className="bg-[#221F26] text-white px-3 py-1 rounded-lg">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
