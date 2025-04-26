
import React, { createContext, useContext, useState, useCallback } from "react";
import { Canvas, Point } from "fabric";
import { ClipboardContextType } from "@/types/clipboard";
import { toast } from "sonner";
import { ClipboardSelector } from "@/components/ClipboardSelector";
import { copyToSystemClipboard } from "@/utils/clipboardUtils";
import { useInternalPasteHandler, useSystemPasteHandler } from "@/hooks/clipboard/usePasteHandlers";
import { WhiteboardId } from "@/types/canvas";

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCanvas, setActiveCanvas] = useState<Canvas | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<WhiteboardId | null>(null);
  const [internalClipboardData, setInternalClipboardData] = useState<any[] | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [pendingPastePosition, setPendingPastePosition] = useState<Point | null>(null);

  // Track both the canvas and its ID when setting active
  const updateActiveCanvas = useCallback((canvas: Canvas | null, boardId?: WhiteboardId | null) => {
    console.log(`Updating active canvas to boardId: ${boardId || 'unknown'}`);
    setActiveCanvas(canvas);
    if (boardId) {
      setActiveBoardId(boardId);
    }
  }, []);

  const copySelectedObjects = useCallback((canvas: Canvas) => {
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) {
      toast.error("No objects selected to copy");
      return;
    }
    
    try {
      // Store in internal clipboard - serialize objects to plain objects
      const serializedObjects = activeObjects.map(obj => obj.toJSON());
      setInternalClipboardData(serializedObjects);
      console.log("Stored in internal clipboard:", serializedObjects);
      
      // Copy to system clipboard
      copyToSystemClipboard(canvas, activeObjects);
    } catch (err) {
      console.error("Copy error:", err);
      toast.error("Failed to copy objects");
    }
  }, []);

  const handleInternalPaste = useInternalPasteHandler(activeCanvas, internalClipboardData, pendingPastePosition);
  const handleSystemPaste = useSystemPasteHandler(activeCanvas, pendingPastePosition);

  const pasteToCanvas = useCallback(async (canvas: Canvas, position: Point, boardId?: WhiteboardId) => {
    console.log(`Paste requested at position: ${JSON.stringify(position)} for board: ${boardId || 'unknown'}`);
    
    // Update active canvas and board ID to ensure paste targets the correct board
    setActiveCanvas(canvas);
    if (boardId) {
      setActiveBoardId(boardId);
    }
    
    setPendingPastePosition(position);
    setShowSelector(true);
  }, []);

  const contextValue: ClipboardContextType = {
    activeCanvas,
    activeBoardId,
    copySelectedObjects,
    pasteToCanvas,
    setActiveCanvas: updateActiveCanvas
  };

  return (
    <ClipboardContext.Provider value={contextValue}>
      {children}
      <ClipboardSelector
        isOpen={showSelector}
        onClose={() => {
          setShowSelector(false);
          setPendingPastePosition(null);
        }}
        onInternalPaste={handleInternalPaste}
        onSystemPaste={handleSystemPaste}
        hasInternalClipboard={!!internalClipboardData}
      />
    </ClipboardContext.Provider>
  );
};

export const useClipboardContext = () => {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error("useClipboardContext must be used within a ClipboardProvider");
  }
  return context;
};
