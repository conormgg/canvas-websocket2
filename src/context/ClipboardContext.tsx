import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { Canvas, util, FabricObject, Point } from "fabric";
import { toast } from "sonner";
import { clipboardUtils } from "@/utils/clipboardUtils";
import { clipboardAccess } from "@/utils/clipboardAccess";
import { SimplePoint } from "@/hooks/clipboard/useImagePaste";

interface ClipboardContextType {
  // State
  clipboardData: any[] | null;
  lastInternalCopyTime: number;
  lastExternalCopyTime: number;
  activeBoard: string | null;
  selectedPosition: Point | null;
  
  // Methods
  copyObjects: (canvas: Canvas) => boolean;
  pasteInternal: (canvas: Canvas, internalData: any[]) => void;
  tryExternalPaste: (canvas: Canvas) => void;
  addImageFromBlob: (canvas: Canvas, blob: Blob, position: SimplePoint) => void;
  handleCanvasClick: (canvas: Canvas, pointer: Point) => void;
  isActiveBoard: (canvas: Canvas) => boolean;
  shouldUseInternalClipboard: () => boolean;
  startPasteOperation: () => boolean;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Internal refs
  const clipboardDataRef = useRef<any[] | null>(null);
  const selectedPositionRef = useRef<Point | null>(null);
  const pasteInProgressRef = useRef(false);
  const lastInternalCopyTimeRef = useRef<number>(0);
  const lastExternalCopyTimeRef = useRef<number>(0);
  
  // States for components that need them
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  
  // Copied from usePasteProgress
  const startPasteOperation = useCallback(() => {
    if (pasteInProgressRef.current) return false;
    pasteInProgressRef.current = true;
    setTimeout(() => { pasteInProgressRef.current = false; }, 300);
    return true;
  }, []);
  
  // Copied from useClipboardSource
  const shouldUseInternalClipboard = useCallback(() => {
    if (!clipboardDataRef.current?.length) return false;
    return lastInternalCopyTimeRef.current > lastExternalCopyTimeRef.current;
  }, []);
  
  const isActiveBoard = useCallback((canvas: Canvas) => {
    if (!canvas) return false;
    
    return canvas.upperCanvasEl === window.__wbActiveBoard ||
           canvas.lowerCanvasEl?.dataset.boardId === window.__wbActiveBoardId;
  }, []);
  
  // From useInternalClipboard
  const handleCanvasClick = useCallback((canvas: Canvas, pointer: Point) => {
    if (pointer) {
      console.log("Canvas click detected at position:", pointer);
      selectedPositionRef.current = pointer;
      
      // Update active board tracking
      if (canvas.lowerCanvasEl?.dataset.boardId) {
        setActiveBoard(canvas.lowerCanvasEl.dataset.boardId);
        window.__wbActiveBoardId = canvas.lowerCanvasEl.dataset.boardId;
        window.__wbActiveBoard = canvas.upperCanvasEl || null;
        console.log("Active board updated to:", canvas.lowerCanvasEl.dataset.boardId);
      }
    }
  }, []);
  
  const copyObjects = useCallback((canvas: Canvas) => {
    const copied = clipboardUtils.copyObjectsToClipboard(canvas, clipboardDataRef);
    if (copied) {
      lastInternalCopyTimeRef.current = Date.now();
      console.log("Objects copied to internal clipboard at:", lastInternalCopyTimeRef.current);
      console.log("Source board:", canvas.lowerCanvasEl?.dataset.boardId);
    }
    return copied;
  }, []);
  
  const pasteInternal = useCallback((canvas: Canvas, internalData: any[]) => {
    // Check if this canvas is active
    if (!isActiveBoard(canvas)) {
      console.log("Canvas not active, ignoring internal paste");
      return;
    }
    
    if (!canvas || !internalData?.length) {
      return;
    }

    console.log("Pasting internal objects on active board:", window.__wbActiveBoardId);
    const toEnliven = [...internalData];

    util
      .enlivenObjects(toEnliven)
      .then((objects: FabricObject[]) => {
        objects.forEach((obj: any) => {
          if (typeof obj !== "object") return;
          const originalLeft = typeof obj.left === "number" ? obj.left : 0;
          const originalTop = typeof obj.top === "number" ? obj.top : 0;
          
          let pastePosition = { left: originalLeft, top: originalTop };
          
          // If we have a selected position (from a click), use that instead
          if (selectedPositionRef.current) {
            pastePosition = {
              left: selectedPositionRef.current.x,
              top: selectedPositionRef.current.y
            };
            // Add slight offset for multiple pastes
            selectedPositionRef.current.x += 10;
            selectedPositionRef.current.y += 10;
          } else {
            // Otherwise use the calculated paste position
            pastePosition = clipboardUtils.calculatePastePosition(
              canvas,
              originalLeft,
              originalTop
            );
          }

          if (typeof obj.set === "function") {
            obj.set({ 
              left: pastePosition.left, 
              top: pastePosition.top, 
              evented: true 
            });
            canvas.add(obj);
            if (typeof obj.setCoords === "function") obj.setCoords();
          }
        });

        clipboardUtils.selectPastedObjects(canvas, objects);
        canvas.requestRenderAll();
        toast.success("Object pasted");
      })
      .catch((err) => {
        console.error("Paste failed:", err);
        toast.error("Failed to paste object");
      });
  }, [isActiveBoard]);
  
  const addImageFromBlob = useCallback((canvas: Canvas, blob: Blob, position: SimplePoint) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (!url) return;
      
      fabric.Image.fromURL(url).then((img: any) => {
        img.scale(0.5);
        
        const x = typeof position.x === 'number' ? position.x : canvas.width! / 2;
        const y = typeof position.y === 'number' ? position.y : canvas.height! / 2;
        
        img.set({
          left: x - ((img.width || 0) * (img.scaleX || 1)) / 2,
          top: y - ((img.height || 0) * (img.scaleY || 1)) / 2,
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        toast.success("Image pasted successfully");
      }).catch((err: any) => {
        console.error("Failed to load image:", err);
        toast.error("Failed to load image");
      });
    };
    reader.readAsDataURL(blob);
  }, []);

  const tryExternalPaste = useCallback((canvas: Canvas) => {
    if (!startPasteOperation()) return;
    
    toast("Accessing clipboard...");
    
    if (!isActiveBoard(canvas)) {
      console.log("Board not active, skipping paste");
      return;
    }
    
    clipboardAccess.readClipboard().then((blob) => {
      if (blob) {
        // When accessing external clipboard content, update the timestamp
        lastExternalCopyTimeRef.current = Date.now();
        console.log("External clipboard accessed at:", lastExternalCopyTimeRef.current);
        
        if (!canvas) return;
        
        const center: SimplePoint = { x: canvas.width! / 2, y: canvas.height! / 2 };
        const pastePosition = selectedPositionRef.current || center;
        addImageFromBlob(canvas, blob, pastePosition);
      }
    });
  }, [isActiveBoard, startPasteOperation, addImageFromBlob]);
  
  // The context value
  const contextValue: ClipboardContextType = {
    // State
    clipboardData: clipboardDataRef.current,
    lastInternalCopyTime: lastInternalCopyTimeRef.current,
    lastExternalCopyTime: lastExternalCopyTimeRef.current,
    activeBoard,
    selectedPosition: selectedPositionRef.current,
    
    // Methods
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

// Custom hook to use the clipboard context
export const useClipboardContext = () => {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error('useClipboardContext must be used within a ClipboardProvider');
  }
  return context;
};
