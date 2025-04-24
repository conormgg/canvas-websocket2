
import { Canvas, Point, TPointerEventInfo, TPointerEvent } from "fabric";
import { useRef, useState, useEffect } from "react";
import { clipboardUtils } from "@/utils/clipboardUtils";

export const useInternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const selectedPositionRef = useRef<Point | null>(null);

  const handleCanvasClick = (opt: TPointerEventInfo<TPointerEvent>) => {
    const pointer = fabricRef.current?.getPointer(opt.e);
    if (pointer) {
      selectedPositionRef.current = pointer;
    }
  };

  const handleCopy = (e: KeyboardEvent) => {
    // Check if this canvas is active before processing the copy
    const isActiveBoard = 
      fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
      window.__wbActiveBoardId === fabricRef.current?.lowerCanvasEl?.dataset.boardId;
    
    if (!isActiveBoard) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (!fabricRef.current) return;
      clipboardUtils.copyObjectsToClipboard(fabricRef.current, clipboardDataRef);
    }
  };

  // This is now just used by the component to programmatically trigger a copy
  const copyActiveObjects = () => {
    if (!fabricRef.current) return;
    clipboardUtils.copyObjectsToClipboard(fabricRef.current, clipboardDataRef);
  };

  // Remove the paste handler from here since we're centralizing paste handling in useCanvasClipboard
  
  useEffect(() => {
    document.addEventListener("keydown", handleCopy);
    return () => {
      document.removeEventListener("keydown", handleCopy);
    };
  }, [handleCopy]);

  return {
    clipboardDataRef,
    handleCanvasClick,
    handleCopy: copyActiveObjects,
    calculatePastePosition: clipboardUtils.calculatePastePosition,
    selectedPositionRef
  };
};
