
import { useEffect, useRef, useState } from "react";
import { Canvas, Point, Image } from "fabric";
import { Toolbar } from "./Toolbar";
import { toast } from "sonner";

type Tool = "select" | "draw" | "eraser";

export const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState("#D3E4FD");
  const [toolbarVisible, setToolbarVisible] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
    });

    // Only set freeDrawingBrush properties after canvas is initialized
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = 2;
      canvas.freeDrawingBrush.color = activeColor;
    }

    // Enable zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent;
      const delta = e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      
      // Create a proper fabric.Point instance for zooming
      const pointer = new Point(e.offsetX, e.offsetY);
      canvas.zoomToPoint(pointer, zoom);
      
      e.preventDefault();
      e.stopPropagation();
    });

    // Enable panning with right mouse button
    canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      // Only handle right mouse button events here
      if (e.button === 2) {
        canvas.defaultCursor = 'grabbing';
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.renderAll();
      }
      // Make sure left clicks don't affect toolbar visibility
      // We don't need to do anything for left clicks here
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
      // Ensure toolbar stays visible after mouse up
      setToolbarVisible(true);
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
            
            // Fix Fabric.js v6 Image.fromURL usage
            Image.fromURL(imgUrl).then((img) => {
              img.scale(0.5); // Use scale method instead of scaleX/scaleY properties
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
    
    // Check if freeDrawingBrush exists before setting properties
    if (!canvas.freeDrawingBrush) return;
    
    if (activeTool === "draw") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = 2;
    } else if (activeTool === "eraser") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = "#ffffff";
      canvas.freeDrawingBrush.width = 20;
    } else {
      canvas.isDrawingMode = false;
      canvas.freeDrawingBrush.width = 2;
    }
  }, [activeTool, activeColor]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Add a click handler for the whiteboard container
  const handleWhiteboardClick = (e: React.MouseEvent) => {
    // Only process left clicks (button === 0)
    if (e.button === 0) {
      // If the click is on the canvas but not on the toolbar, we don't want to hide the toolbar
      // We're not doing anything special here, just preventing default behavior
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="relative w-full h-full" 
      onContextMenu={handleContextMenu} 
      onClick={handleWhiteboardClick}
    >
      {toolbarVisible && (
        <Toolbar 
          activeTool={activeTool}
          activeColor={activeColor}
          onToolChange={setActiveTool}
          onColorChange={setActiveColor}
        />
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
