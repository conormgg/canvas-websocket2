import { useCallback } from "react";
import { Canvas, Point } from "fabric";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { toast } from "sonner";
import { SimplePoint } from "@/hooks/clipboard/useImagePaste";

export const useCanvasHandlers = (
  clipboardDataRef: React.MutableRefObject<any[] | null>,
  selectedPositionRef: React.MutableRefObject<Point | null>,
  lastInternalCopyTimeRef: React.MutableRefObject<number>,
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

    const copied = clipboardUtils.copyObjectsToClipboard(
      canvas, 
      clipboardDataRef,
      lastInternalCopyTimeRef
    );
    
    if (copied) {
      toast.success("Objects copied to clipboard");
    }
    return copied;
  }, [clipboardDataRef, lastInternalCopyTimeRef, isActiveBoard]);

  const pasteInternal = useCallback((canvas: Canvas, internalData: any[]) => {
    if (!isActiveBoard(canvas) || !canvas || !internalData?.length) return;

    const toEnliven = [...internalData];
    
    clipboardUtils.enlivenAndPasteObjects(canvas, toEnliven, selectedPositionRef.current)
      .then(() => toast.success("Object pasted"))
      .catch((err) => {
        console.error("Paste failed:", err);
        toast.error("Failed to paste object");
      });
  }, [selectedPositionRef, isActiveBoard]);

  return {
    handleCanvasClick,
    copyObjects,
    pasteInternal
  };
};
