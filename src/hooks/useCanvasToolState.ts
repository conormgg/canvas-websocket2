
import { useState, useCallback } from 'react';
import { Canvas } from 'fabric';
import { toast } from 'sonner';

export const useCanvasToolState = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const [isDrawing, setIsDrawing] = useState(false);

  const updateToolState = useCallback((tool: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Update drawing mode
    canvas.isDrawingMode = tool === "draw" || tool === "eraser";
    canvas.selection = tool === "select";

    // Show single notification for tool change
    if (tool === "draw") {
      toast("Draw mode enabled. Click and drag to draw!");
    } else if (tool === "select") {
      toast("Select mode enabled. Click objects to select them!");
    } else if (tool === "eraser") {
      toast("Eraser mode enabled. Click and drag to erase!");
    }
  }, [fabricRef]);

  return {
    isDrawing,
    setIsDrawing,
    updateToolState
  };
};
