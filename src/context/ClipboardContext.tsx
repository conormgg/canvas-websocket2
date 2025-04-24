
import React, { createContext, useContext } from "react";
import { Canvas, Point } from "fabric";
import { SimplePoint } from "@/hooks/clipboard/useImagePaste";
import { ClipboardContextType } from "@/types/clipboard";
import { useClipboardOperations } from "@/hooks/clipboard/useClipboardOperations";
import { useCanvasHandlers } from "@/hooks/clipboard/useCanvasHandlers";
import { useExternalClipboard } from "@/hooks/clipboard/useExternalClipboard";

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    clipboardDataRef,
    selectedPositionRef,
    lastInternalCopyTimeRef,
    lastExternalCopyTimeRef,
    activeBoard,
    setActiveBoard,
    startPasteOperation,
    shouldUseInternalClipboard,
    isActiveBoard
  } = useClipboardOperations();

  const {
    handleCanvasClick,
    copyObjects,
    pasteInternal
  } = useCanvasHandlers(
    clipboardDataRef,
    selectedPositionRef,
    lastInternalCopyTimeRef,
    setActiveBoard,
    isActiveBoard
  );

  // We're using the fabricRef as null since we'll pass the canvas directly to the methods
  const fabricRef = React.useRef<Canvas | null>(null);
  const { 
    tryExternalPaste,
    addImageFromBlob
  } = useExternalClipboard(fabricRef);

  const contextValue: ClipboardContextType = {
    clipboardData: clipboardDataRef.current,
    lastInternalCopyTime: lastInternalCopyTimeRef.current,
    lastExternalCopyTime: lastExternalCopyTimeRef.current,
    activeBoard,
    selectedPosition: selectedPositionRef.current,
    copyObjects,
    pasteInternal,
    tryExternalPaste,
    addImageFromBlob,
    handleCanvasClick,
    isActiveBoard,
    shouldUseInternalClipboard,
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
