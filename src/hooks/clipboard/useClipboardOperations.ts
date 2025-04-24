
import { useRef, useState, useCallback } from "react";
import { Canvas, Point } from "fabric";
import { toast } from "sonner";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { SimplePoint } from "@/hooks/clipboard/useImagePaste";

export const useClipboardOperations = () => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const selectedPositionRef = useRef<Point | null>(null);
  const pasteInProgressRef = useRef(false);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);

  const startPasteOperation = useCallback(() => {
    if (pasteInProgressRef.current) return false;
    pasteInProgressRef.current = true;
    setTimeout(() => { pasteInProgressRef.current = false; }, 300);
    return true;
  }, []);

  const shouldUseInternalClipboard = useCallback(() => {
    return !!clipboardDataRef.current?.length;
  }, []);

  const isActiveBoard = useCallback((canvas: Canvas) => {
    if (!canvas) return false;
    return canvas.upperCanvasEl === window.__wbActiveBoard ||
           canvas.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
  }, []);

  return {
    clipboardDataRef,
    selectedPositionRef,
    activeBoard,
    setActiveBoard,
    startPasteOperation,
    shouldUseInternalClipboard,
    isActiveBoard
  };
};
