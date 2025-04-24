
import { Canvas, Point, TPointerEventInfo, TPointerEvent } from "fabric";
import { useRef, useState, useEffect, useCallback } from "react";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { toast } from "sonner";

export const useInternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const selectedPositionRef = useRef<Point | null>(null);

  const handleCanvasClick = useCallback((opt: TPointerEventInfo<TPointerEvent>) => {
    const pointer = fabricRef.current?.getPointer(opt.e);
    if (pointer) {
      console.log("Canvas click detected at position:", pointer);
      selectedPositionRef.current = pointer;
    }
  }, [fabricRef]);

  const handleCopy = useCallback((e: KeyboardEvent) => {
    // Check if this canvas is active before processing the copy
    const isActiveBoard = 
      fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
      window.__wbActiveBoardId === fabricRef.current?.lowerCanvasEl?.dataset.boardId;
    
    if (!isActiveBoard) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (!fabricRef.current) return;
      const copied = clipboardUtils.copyObjectsToClipboard(fabricRef.current, clipboardDataRef);
      if (copied) {
        console.log("Objects copied to internal clipboard");
      }
    }
  }, [fabricRef]);

  // This is now just used by the component to programmatically trigger a copy
  const copyActiveObjects = useCallback(() => {
    if (!fabricRef.current) return;
    const copied = clipboardUtils.copyObjectsToClipboard(fabricRef.current, clipboardDataRef);
    if (copied) {
      console.log("Objects programmatically copied to internal clipboard");
    }
  }, [fabricRef]);
  
  useEffect(() => {
    console.log("Setting up copy event listener");
    document.addEventListener("keydown", handleCopy);
    return () => {
      document.removeEventListener("keydown", handleCopy);
      console.log("Copy event listener removed");
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
