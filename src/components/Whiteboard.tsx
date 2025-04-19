
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { Toolbar } from "./Toolbar";
import { toast } from "sonner";

type Tool = "select" | "draw" | "eraser";

export const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState("#D3E4FD");

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
    });

    canvas.freeDrawingBrush.width = 2;
    canvas.freeDrawingBrush.color = activeColor;

    // Enable zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Enable panning with right mouse button
    canvas.on('mouse:down', (opt) => {
      if (opt.e.button === 2) {
        canvas.defaultCursor = 'grabbing';
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    });

    let isDragging = false;
    let lastPosX: number;
    let lastPosY: number;

    canvas.on('mouse:move', (opt) => {
      if (opt.e.buttons === 2) {
        isDragging = true;
        canvas.setCursor('grabbing');
        const e = opt.e;
        const vpt = canvas.viewportTransform!;
        if (lastPosX === undefined) lastPosX = e.clientX;
        if (lastPosY === undefined) lastPosY = e.clientY;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
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
      lastPosX = undefined;
      lastPosY = undefined;
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
