
import React, { createContext, useContext, useState, useCallback } from "react";
import { Canvas, Point } from "fabric";
import { ClipboardContextType, ClipboardData } from "@/types/clipboard";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { toast } from "sonner";

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(null);
  const [activeCanvas, setActiveCanvas] = useState<Canvas | null>(null);

  /**
   * Copy selected objects from canvas to clipboard
   */
  const copySelectedObjects = useCallback((canvas: Canvas) => {
    const data = clipboardUtils.copySelectedObjects(canvas);
    if (data) {
      setClipboardData(data);
      toast.success("Objects copied to clipboard");
    }
  }, []);

  /**
   * Paste content to canvas
   */
  const pasteToCanvas = useCallback(async (canvas: Canvas, position?: Point) => {
    if (!clipboardData) {
      // Try to get data from browser clipboard
      const externalData = await clipboardUtils.readExternalClipboard();
      if (externalData) {
        await clipboardUtils.pasteObjects(canvas, externalData, position);
        // Update clipboard data to what we just pasted
        setClipboardData(externalData);
      } else {
        toast.error("Nothing to paste");
      }
      return;
    }
    
    // Use existing clipboard data
    await clipboardUtils.pasteObjects(canvas, clipboardData, position);
  }, [clipboardData]);
  
  /**
   * Check if we have data to paste
   */
  const canPaste = useCallback(() => {
    return clipboardData !== null;
  }, [clipboardData]);

  const contextValue: ClipboardContextType = {
    clipboardData,
    activeCanvas,
    copySelectedObjects,
    pasteToCanvas,
    canPaste,
    setActiveCanvas
  };

  return (
    <ClipboardContext.Provider value={contextValue}>
      {children}
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
