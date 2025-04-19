
import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { Toolbar } from "./Toolbar";
import { toast } from "sonner";

type Tool = "select" | "draw" | "eraser";

export const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState("#D3E4FD");

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
    });

    canvas.freeDrawingBrush.width = 2;
    canvas.freeDrawingBrush.color = activeColor;

    // Enable zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent;
      const delta = e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      
      // Create a proper fabric.Point instance for zooming
      const pointer = new fabric.Point(e.offsetX, e.offsetY);
      canvas.zoomToPoint(pointer, zoom);
      
      e.preventDefault();
      e.stopPropagation();
    });

    // Enable panning with right mouse button
    canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      if (e.button === 2) {
        canvas.defaultCursor = 'grabbing';
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    });

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:move', (opt) => {
      const e = opt.e as MouseEvent;
      if (e.buttons === 2) {
        isDragging = true;
        canvas.setCursor('grabbing');
        
        if (lastPosX === 0) lastPosX = e.clientX;
        if (lastPosY === 0) lastPosY = e.clientY;
        
        // Create a proper fabric.Point for panning
        const delta = new fabric.Point(e.clientX - lastPosX, e.clientY - lastPosY);
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
    });

    // Handle image paste
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
            
            fabric.Image.fromURL(imgUrl, (img) => {
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

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    
    if (activeTool === "draw") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = activeColor;
    } else if (activeTool === "eraser") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = "#ffffff";
      canvas.freeDrawingBrush.width = 20;
    } else {
      canvas.isDrawingMode = false;
      canvas.freeDrawingBrush.width = 2;
    }
  }, [activeTool, activeColor]);

  // Prevent context menu on right click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div className="relative w-full h-full" onContextMenu={handleContextMenu}>
      <Toolbar 
        activeTool={activeTool}
        activeColor={activeColor}
        onToolChange={setActiveTool}
        onColorChange={setActiveColor}
      />
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
