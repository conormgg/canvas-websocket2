
import React, { createContext, useContext, useState } from "react";
import { Canvas, Point } from "fabric";
import { SimplePoint } from "@/hooks/clipboard/useImagePaste";
import { ClipboardContextType } from "@/types/clipboard";
import { useClipboardOperations } from "@/hooks/clipboard/useClipboardOperations";
import { useCanvasHandlers } from "@/hooks/clipboard/useCanvasHandlers";
import { useExternalClipboard } from "@/hooks/clipboard/useExternalClipboard";

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clipboardData, setClipboardData] = useState<any[] | null>(null);
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

  // Update clipboardDataRef when clipboardData changes
  React.useEffect(() => {
    clipboardDataRef.current = clipboardData;
    console.log("Clipboard data updated:", clipboardData?.length || 0, "objects");
  }, [clipboardData]);

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

  const fabricRef = React.useRef<Canvas | null>(null);
  const { 
    tryExternalPaste,
    addImageFromBlob
  } = useExternalClipboard(fabricRef);

  const contextValue: ClipboardContextType = {
    clipboardData,
    setClipboardData,
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
