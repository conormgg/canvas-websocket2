
import React, { createContext, useContext, useState, useCallback } from "react";
import { Canvas, Point, util, ActiveSelection, Image } from "fabric";
import { ClipboardContextType } from "@/types/clipboard";
import { toast } from "sonner";
import { ClipboardSelector } from "@/components/ClipboardSelector";

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCanvas, setActiveCanvas] = useState<Canvas | null>(null);
  const [internalClipboardData, setInternalClipboardData] = useState<any[] | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [pendingPastePosition, setPendingPastePosition] = useState<Point | null>(null);

  /**
   * Copy selected objects from canvas to system clipboard
   */
  const copySelectedObjects = useCallback((canvas: Canvas) => {
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) {
      toast.error("No objects selected to copy");
      return;
    }
    
    try {
      // Store in internal clipboard - serialize objects to plain objects
      const serializedObjects = activeObjects.map(obj => {
        // Use toJSON instead of toObject to avoid issues with fabric's internal methods
        return obj.toJSON();
      });
      
      setInternalClipboardData(serializedObjects);
      console.log("Stored in internal clipboard:", serializedObjects);
      
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
      const tempFabricCanvas = new Canvas(tempCanvas);
      objectToExport.clone((cloned: any) => {
        // Center the object in the temp canvas
        cloned.set({
          left: bounds.width / 2,
          top: bounds.height / 2,
          originX: 'center',
          originY: 'center'
        });
        
        tempFabricCanvas.add(cloned);
        tempFabricCanvas.renderAll();
        
        // Copy to system clipboard
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
    } catch (err) {
      console.error("Copy error:", err);
      toast.error("Failed to copy objects");
    }
  }, []);

  const handleInternalPaste = useCallback(() => {
    if (!activeCanvas || !internalClipboardData || !pendingPastePosition) {
      console.log("Cannot paste: missing data", { 
        hasCanvas: !!activeCanvas, 
        hasClipboardData: !!internalClipboardData, 
        pastePosition: pendingPastePosition 
      });
      return;
    }
    
    console.log("Pasting internal clipboard at position:", pendingPastePosition);
    
    try {
      util.enlivenObjects(internalClipboardData)
        .then((objects) => {
          if (!objects.length) {
            console.log("No objects to paste");
            return;
          }

          // Calculate offsets and add objects
          let minL = Infinity, minT = Infinity;
          objects.forEach((o: any) => {
            if (typeof o.left === "number" && o.left < minL) minL = o.left;
            if (typeof o.top === "number" && o.top < minT) minT = o.top;
          });
          
          if (!isFinite(minL)) minL = 0;
          if (!isFinite(minT)) minT = 0;

          objects.forEach((o: any) => {
            const dx = typeof o.left === "number" ? o.left - minL : 0;
            const dy = typeof o.top === "number" ? o.top - minT : 0;
            o.set({
              left: pendingPastePosition.x + dx,
              top: pendingPastePosition.y + dy,
              evented: true,
            });
            activeCanvas.add(o);
            if (typeof o.setCoords === "function") o.setCoords();
          });
          
          activeCanvas.renderAll();
          toast.success("Pasted from canvas clipboard!");
        })
        .catch((err) => {
          console.error("Internal paste failed", err);
          toast.error("Could not paste objects");
        });
    } catch (err) {
      console.error("Error during internal paste:", err);
      toast.error("Failed to paste from canvas clipboard");
    }
    
    setShowSelector(false);
    setPendingPastePosition(null);
  }, [activeCanvas, internalClipboardData, pendingPastePosition]);

  const handleSystemPaste = useCallback(async () => {
    if (!activeCanvas || !pendingPastePosition) {
      console.log("Cannot paste from system: missing data", {
        hasCanvas: !!activeCanvas,
        pastePosition: pendingPastePosition
      });
      return;
    }
    
    console.log("Pasting system clipboard at position:", pendingPastePosition);
    
    try {
      const clipboardItems = await navigator.clipboard.read();
      let imageFound = false;
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            imageFound = true;
            const blob = await clipboardItem.getType(type);
            await pasteImageBlobToCanvas(activeCanvas, blob, pendingPastePosition);
            break;
          }
        }
        if (imageFound) break;
      }
      
      if (!imageFound) {
        toast.error("No image content found in system clipboard");
      }
    } catch (err) {
      console.error("System paste error:", err);
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        toast.error(`System paste failed: ${err.message}`);
      } else {
        toast.error("System clipboard access denied");
      }
    }
    
    setShowSelector(false);
    setPendingPastePosition(null);
  }, [activeCanvas, pendingPastePosition]);

  const pasteToCanvas = useCallback(async (canvas: Canvas, position: Point) => {
    console.log("Paste requested at position:", position);
    setActiveCanvas(canvas);
    setPendingPastePosition(position);
    setShowSelector(true);
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
        
        util.loadImage(url)
          .then((img) => {
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
          })
          .catch((err) => {
            console.error("Error loading image:", err);
            reject(err);
          });
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
