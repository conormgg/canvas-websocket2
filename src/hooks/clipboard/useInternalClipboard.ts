
import { Canvas, Point, TPointerEventInfo, TPointerEvent } from "fabric";
import { useRef, useState, useEffect } from "react";
import { useClipboardEvents } from "./useClipboardEvents";
import { usePasteHandler } from "./usePasteHandler";
import { clipboardUtils } from "@/utils/clipboardUtils";

export const useInternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const selectedPositionRef = useRef<Point | null>(null);

  const { pasteAtPosition } = usePasteHandler(fabricRef);

  const handleCanvasClick = (opt: TPointerEventInfo<TPointerEvent>) => {
    const pointer = fabricRef.current?.getPointer(opt.e);
    if (pointer) {
      selectedPositionRef.current = pointer;
    }
  };

  const handleCopy = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (!fabricRef.current) return;
      clipboardUtils.copyObjectsToClipboard(fabricRef.current, clipboardDataRef);
    }
  };

  const handlePaste = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      if (clipboardDataRef.current && selectedPositionRef.current) {
        pasteAtPosition(clipboardDataRef.current, selectedPositionRef.current);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleCopy);
    document.addEventListener("keydown", handlePaste);
    return () => {
      document.removeEventListener("keydown", handleCopy);
      document.removeEventListener("keydown", handlePaste);
    };
  }, [handleCopy, handlePaste]);

  return {
    clipboardDataRef,
    handleCanvasClick,
    handleCopy: () => {
      if (!fabricRef.current) return;
      clipboardUtils.copyObjectsToClipboard(fabricRef.current, clipboardDataRef);
    },
    calculatePastePosition: clipboardUtils.calculatePastePosition,
    selectedPositionRef
  };
};
