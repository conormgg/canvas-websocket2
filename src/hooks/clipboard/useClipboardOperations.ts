
import { useRef, useState, useCallback } from "react";
import { Canvas, Point } from "fabric";
import { toast } from "sonner";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { SimplePoint } from "@/hooks/clipboard/useImagePaste";

export const useClipboardOperations = () => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const selectedPositionRef = useRef<Point | null>(null);
  const pasteInProgressRef = useRef(false);
  const lastInternalCopyTimeRef = useRef<number>(0);
  const lastExternalCopyTimeRef = useRef<number>(0);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);

  const startPasteOperation = useCallback(() => {
    if (pasteInProgressRef.current) return false;
    pasteInProgressRef.current = true;
    setTimeout(() => { pasteInProgressRef.current = false; }, 300);
    return true;
  }, []);

  const shouldUseInternalClipboard = useCallback(() => {
    if (!clipboardDataRef.current?.length) return false;
    return lastInternalCopyTimeRef.current > lastExternalCopyTimeRef.current;
  }, []);

  const isActiveBoard = useCallback((canvas: Canvas) => {
    if (!canvas) return false;
    return canvas.upperCanvasEl === window.__wbActiveBoard ||
           canvas.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
  }, []);

  return {
    clipboardDataRef,
    selectedPositionRef,
    lastInternalCopyTimeRef,
    lastExternalCopyTimeRef,
    activeBoard,
    setActiveBoard,
    startPasteOperation,
    shouldUseInternalClipboard,
    isActiveBoard
  };
};
