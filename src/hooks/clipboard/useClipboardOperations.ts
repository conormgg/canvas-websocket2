
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
    if (pasteInProgressRef.current) {
      console.log("Paste operation already in progress, skipping");
      return false;
    }
    pasteInProgressRef.current = true;
    console.log("Starting paste operation");
    setTimeout(() => {
      pasteInProgressRef.current = false;
      console.log("Paste operation timeout cleared");
    }, 300);
    return true;
  }, []);

  const shouldUseInternalClipboard = useCallback(() => {
    const hasData = !!clipboardDataRef.current?.length;
    console.log("Checking internal clipboard:", hasData ? "Has data" : "Empty");
    return hasData;
  }, []);

  const isActiveBoard = useCallback((canvas: Canvas) => {
    if (!canvas) return false;
    const isActive = canvas.upperCanvasEl === window.__wbActiveBoard ||
           canvas.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
    console.log("Board active check:", isActive, "Board ID:", canvas.lowerCanvasEl?.dataset.boardId);
    return isActive;
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
