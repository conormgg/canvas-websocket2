
import React, { createContext, useContext, useState, useRef } from "react";
import { Canvas, Point } from "fabric";
import { SimplePoint } from "@/hooks/clipboard/useImagePaste";
import { ClipboardContextType } from "@/types/clipboard";
import { useCanvasHandlers } from "@/hooks/clipboard/useCanvasHandlers";
import { useExternalClipboard } from "@/hooks/clipboard/useExternalClipboard";

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clipboardData, setClipboardData] = useState<any[] | null>(null);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const selectedPositionRef = useRef<Point | null>(null);
  const pasteInProgressRef = useRef(false);
  const fabricRef = useRef<Canvas | null>(null);

  const startPasteOperation = () => {
    if (pasteInProgressRef.current) return false;
    pasteInProgressRef.current = true;
    setTimeout(() => { pasteInProgressRef.current = false; }, 300);
    return true;
  };

  const isActiveBoard = (canvas: Canvas) => {
    return canvas.upperCanvasEl === window.__wbActiveBoard ||
           canvas.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
  };

  const {
    handleCanvasClick,
    copyObjects,
    pasteInternal
  } = useCanvasHandlers(
    setClipboardData,
    selectedPositionRef,
    setActiveBoard,
    isActiveBoard
  );

  const { 
    tryExternalPaste,
    addImageFromBlob
  } = useExternalClipboard(fabricRef);

  const contextValue: ClipboardContextType = {
    clipboardData,
    setClipboardData,
    activeBoard,
    selectedPosition: selectedPositionRef.current,
    copyObjects,
    pasteInternal,
    tryExternalPaste,
    addImageFromBlob,
    handleCanvasClick,
    isActiveBoard,
    startPasteOperation
  };
  
  return (
    <ClipboardContext.Provider value={contextValue}>
      {children}
    </ClipboardContext.Provider>
  );
};

export const useClipboardContext = () => {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error('useClipboardContext must be used within a ClipboardProvider');
  }
  return context;
};
