
import React, { createContext, useContext, useState, useCallback } from "react";
import { Canvas, Point, util, ActiveSelection, Image } from "fabric";
import { ClipboardContextType } from "@/types/clipboard";
import { toast } from "sonner";

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCanvas, setActiveCanvas] = useState<Canvas | null>(null);

  /**
   * Copy selected objects from canvas to system clipboard
   */
  const copySelectedObjects = useCallback((canvas: Canvas) => {
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) {
      toast.error("No objects selected to copy");
      return;
    }
    
    // Create a temporary canvas to render the selection
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      toast.error("Failed to copy to clipboard");
      return;
    }

    // If we have multiple objects, create a group view
    let objectToExport;
    if (activeObjects.length > 1) {
      objectToExport = new ActiveSelection(activeObjects, { canvas });
    } else {
      objectToExport = activeObjects[0];
    }

    // Set the temporary canvas size to the object's bounds
    const bounds = objectToExport.getBoundingRect();
    tempCanvas.width = bounds.width;
    tempCanvas.height = bounds.height;
    
    // Render to the temp canvas
    const tempCanvasContext = tempCanvas.getContext('2d')!;
    objectToExport.clone((cloned: any) => {
      // Center the object in the temp canvas
      cloned.set({
        left: bounds.width / 2,
        top: bounds.height / 2,
        originX: 'center',
        originY: 'center'
      });
      
      // Create a temporary canvas instance to render this object
      const tempFabricCanvas = new Canvas(tempCanvas);
      tempFabricCanvas.add(cloned);
      tempFabricCanvas.renderAll();
      
      // Copy to clipboard
      tempCanvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to convert selection to image");
          return;
        }
        
        try {
          // Use the clipboard API to write the blob
          navigator.clipboard.write([
            new ClipboardItem({ 
              [blob.type]: blob 
            })
          ]).then(() => {
            toast.success("Objects copied to system clipboard");
          }).catch(err => {
            console.error("Clipboard write failed:", err);
            toast.error("Failed to copy to system clipboard");
          });
        } catch (err) {
          console.error("Clipboard error:", err);
          toast.error("Your browser doesn't support clipboard operations");
        }
        
        // Clean up
        tempFabricCanvas.dispose();
      });
    });
  }, []);

  /**
   * Paste content from system clipboard to canvas
   */
  const pasteToCanvas = useCallback(async (canvas: Canvas, position: Point) => {
    if (!canvas) {
      toast.error("No canvas selected for paste operation");
      return;
    }

    try {
      // Try to read clipboard items
      const clipboardItems = await navigator.clipboard.read();
      
      // Look for image content
      let imageFound = false;
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            imageFound = true;
            const blob = await clipboardItem.getType(type);
            await pasteImageBlobToCanvas(canvas, blob, position);
            break;
          }
        }
        if (imageFound) break;
      }
      
      if (!imageFound) {
        toast.error("No image content found in clipboard");
      }
    } catch (err) {
      console.error("Paste error:", err);
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        toast.error(`Paste failed: ${err.message}`);
      } else {
        toast.error("Clipboard access denied. Please allow clipboard permissions.");
      }
    }
  }, []);
  
  /**
   * Helper to paste image blob to canvas
   */
  const pasteImageBlobToCanvas = (canvas: Canvas, blob: Blob, position: Point): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (!url) {
          reject(new Error("Failed to read image data"));
          return;
        }
        
        // Create fabric Image from data URL
        util.loadImage(url).then((img) => {
          const fabricImage = new Image(img, {
            scaleX: 0.5,
            scaleY: 0.5,
          });
          
          // Position the image at the specified position
          fabricImage.set({
            left: position.x - ((fabricImage.width || 0) * (fabricImage.scaleX || 0.5)) / 2,
            top: position.y - ((fabricImage.height || 0) * (fabricImage.scaleY || 0.5)) / 2,
          });
          
          canvas.add(fabricImage);
          canvas.setActiveObject(fabricImage);
          canvas.requestRenderAll();
          toast.success("Image pasted from system clipboard");
          resolve();
        }).catch(reject);
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const contextValue: ClipboardContextType = {
    activeCanvas,
    copySelectedObjects,
    pasteToCanvas,
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
