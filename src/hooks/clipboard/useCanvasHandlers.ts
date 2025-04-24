
import { useCallback } from "react";
import { Canvas, Point } from "fabric";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { toast } from "sonner";

export const useCanvasHandlers = (
  setClipboardData: (data: any[] | null) => void,
  selectedPositionRef: React.MutableRefObject<Point | null>,
  setActiveBoard: (id: string | null) => void,
  isActiveBoard: (canvas: Canvas) => boolean
) => {
  const handleCanvasClick = useCallback((canvas: Canvas, pointer: Point) => {
    if (pointer) {
      selectedPositionRef.current = pointer;
      
      if (canvas.lowerCanvasEl?.dataset.boardId) {
        setActiveBoard(canvas.lowerCanvasEl.dataset.boardId);
        window.__wbActiveBoardId = canvas.lowerCanvasEl.dataset.boardId;
        window.__wbActiveBoard = canvas.upperCanvasEl || null;
      }
    }
  }, [selectedPositionRef, setActiveBoard]);

  const copyObjects = useCallback((canvas: Canvas) => {
    if (!isActiveBoard(canvas)) return false;

    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) {
      console.log("No active objects to copy");
      return false;
    }

    // Clear clipboard first
    setClipboardData(null);

    const newClipboardData = activeObjects.map((obj) => obj.toObject([
      'objectType', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY',
      'angle', 'flipX', 'flipY', 'opacity', 'stroke', 'strokeWidth',
      'fill', 'paintFirst', 'globalCompositeOperation'
    ]));
    
    setClipboardData(newClipboardData);
    console.log("Objects copied to clipboard:", newClipboardData.length);
    toast.success("Objects copied to clipboard");
    return true;
  }, [setClipboardData, isActiveBoard]);

  const pasteInternal = useCallback((canvas: Canvas, internalData: any[]) => {
    if (!isActiveBoard(canvas) || !canvas || !internalData?.length) return;

    const toEnliven = [...internalData];
    
    clipboardUtils.enlivenAndPasteObjects(canvas, toEnliven, selectedPositionRef.current)
      .then(() => toast.success("Objects pasted"))
      .catch((err) => {
        console.error("Paste failed:", err);
        toast.error("Failed to paste objects");
      });
  }, [selectedPositionRef, isActiveBoard]);

  return {
    handleCanvasClick,
    copyObjects,
    pasteInternal
  };
};
