
import { Canvas } from "fabric";
import { useCallback } from "react";

export const useClipboardSource = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  lastInternalTime: number,
  lastExternalTime: number,
  clipboardDataRef: React.MutableRefObject<any[] | null>
) => {
  const shouldUseInternalClipboard = useCallback(() => {
    if (!clipboardDataRef.current?.length) return false;
    return lastInternalTime > lastExternalTime;
  }, [lastInternalTime, lastExternalTime, clipboardDataRef]);

  const isActiveBoard = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return false;
    
    return canvas.upperCanvasEl === window.__wbActiveBoard ||
           canvas.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
  }, [fabricRef]);

  return {
    shouldUseInternalClipboard,
    isActiveBoard
  };
};
