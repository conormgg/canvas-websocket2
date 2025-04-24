
import { Canvas, Point, TPointerEventInfo, TPointerEvent } from "fabric";
import { useRef, useState, useEffect, useCallback } from "react";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { toast } from "sonner";

export const useInternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const selectedPositionRef = useRef<Point | null>(null);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);

  const handleCanvasClick = useCallback((opt: TPointerEventInfo<TPointerEvent>) => {
    const pointer = fabricRef.current?.getPointer(opt.e);
    if (pointer) {
      console.log("Canvas click detected at position:", pointer);
      selectedPositionRef.current = pointer;
      
      // Update active board tracking
      if (fabricRef.current?.lowerCanvasEl?.dataset.boardId) {
        setActiveBoard(fabricRef.current.lowerCanvasEl.dataset.boardId);
        window.__wbActiveBoardId = fabricRef.current.lowerCanvasEl.dataset.boardId;
        window.__wbActiveBoard = fabricRef.current.upperCanvasEl || null;
        console.log("Active board updated to:", fabricRef.current.lowerCanvasEl.dataset.boardId);
      }
    }
  }, [fabricRef]);

  const handleCopy = useCallback((e: KeyboardEvent) => {
    if (!fabricRef.current) return;
    
    // Check if this canvas is active before processing the copy
    const isActiveBoard = 
      fabricRef.current?.upperCanvasEl === window.__wbActiveBoard ||
      window.__wbActiveBoardId === fabricRef.current?.lowerCanvasEl?.dataset.boardId;
    
    if (!isActiveBoard) {
      console.log("Copy ignored - not active board");
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      // Clear any existing clipboard data before copying new content
      clipboardDataRef.current = null;
      
      const copied = clipboardUtils.copyObjectsToClipboard(
        fabricRef.current, 
        clipboardDataRef
      );
      
      if (copied) {
        console.log("Objects copied to internal clipboard");
        console.log("Source board:", fabricRef.current.lowerCanvasEl?.dataset.boardId);
        toast.success("Object copied to clipboard");
      }
    }
  }, [fabricRef]);

  // This is now just used by the component to programmatically trigger a copy
  const copyActiveObjects = useCallback(() => {
    if (!fabricRef.current) return;
    
    // Clear any existing clipboard data before copying new content
    clipboardDataRef.current = null;
    
    const copied = clipboardUtils.copyObjectsToClipboard(
      fabricRef.current, 
      clipboardDataRef
    );
    
    if (copied) {
      console.log("Objects programmatically copied to internal clipboard");
      toast.success("Object copied to clipboard");
      return true;
    }
    return false;
  }, [fabricRef]);

  /* Monitor active board changes */
  useEffect(() => {
    if (fabricRef.current?.lowerCanvasEl?.dataset.boardId) {
      setActiveBoard(fabricRef.current.lowerCanvasEl.dataset.boardId);
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
    selectedPositionRef,
    activeBoard
  };
};
