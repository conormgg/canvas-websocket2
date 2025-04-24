
import { Canvas, Point, TPointerEventInfo, TPointerEvent } from "fabric";
import { useRef, useState, useEffect } from "react";
import { useClipboardEvents } from "./useClipboardEvents";
import { usePasteHandler } from "./usePasteHandler";
import { clipboardUtils } from "@/utils/clipboardUtils";

export const useInternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const [awaitingPlacement, setAwaitingPlacement] = useState<boolean>(false);
  
  const { pasteAtPosition } = usePasteHandler(fabricRef);
  const { handleCopy, handlePaste } = useClipboardEvents(
    fabricRef,
    clipboardDataRef,
    setAwaitingPlacement
  );

  useEffect(() => {
    document.addEventListener("keydown", handleCopy);
    document.addEventListener("keydown", handlePaste);
    return () => {
      document.removeEventListener("keydown", handleCopy);
      document.removeEventListener("keydown", handlePaste);
    };
  }, [handleCopy, handlePaste]);

  const handleCanvasClick = (opt: TPointerEventInfo<TPointerEvent>) => {
    if (!awaitingPlacement) return;
    setAwaitingPlacement(false);
    const pointer = fabricRef.current?.getPointer(opt.e);
    if (pointer) pasteAtPosition(clipboardDataRef.current, pointer);
  };

  const calculatePastePosition = (originalLeft: number, originalTop: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return { left: originalLeft, top: originalTop };
    
    return clipboardUtils.calculatePastePosition(canvas, originalLeft, originalTop);
  };

  return {
    clipboardDataRef,
    handleCanvasClick,
    handleCopy: () => {
      if (!fabricRef.current) return;
      clipboardUtils.copyObjectsToClipboard(fabricRef.current, clipboardDataRef);
    },
    calculatePastePosition,
    awaitingPlacementRef: { current: awaitingPlacement }
  };
};
