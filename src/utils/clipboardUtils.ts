
import { Canvas, FabricObject, Point, ActiveSelection, util } from "fabric";
import { ClipboardData } from "@/types/clipboard";
import { toast } from "sonner";

export const clipboardUtils = {
  /**
   * Copy selected objects from canvas to clipboard
   */
  copySelectedObjects: (canvas: Canvas): ClipboardData | null => {
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) {
      console.log("Clipboard: No active objects to copy");
      return null;
    }
    
    console.log(`Clipboard: Copying ${activeObjects.length} objects`);
    
    const objectsData = activeObjects.map((obj) => obj.toObject([
      'objectType', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY',
      'angle', 'flipX', 'flipY', 'opacity', 'stroke', 'strokeWidth',
      'fill', 'paintFirst', 'globalCompositeOperation'
    ]));
    
    return {
      sourceType: 'internal',
      timestamp: Date.now(),
      data: objectsData
    };
  },
  
  /**
   * Handle paste of internal objects
   */
  pasteObjects: async (canvas: Canvas, clipboardData: ClipboardData, position?: Point): Promise<boolean> => {
    if (!clipboardData || !canvas) return false;
    
    // Handle internal objects
    if (clipboardData.sourceType === 'internal' && Array.isArray(clipboardData.data)) {
      if (!clipboardData.data.length) return false;
      
      console.log(`Clipboard: Pasting ${clipboardData.data.length} internal objects`);
      
      try {
        const objects = await util.enlivenObjects(clipboardData.data);
        const newObjects: FabricObject[] = [];
        
        // Calculate paste position - either at provided position or with offset
        const pasteCenter = position || { 
          x: canvas.width! / 2, 
          y: canvas.height! / 2 
        };
        
        // Position objects relative to paste position
        objects.forEach((obj: any) => {
          // Apply random offset to avoid perfect overlap when pasting multiple times
          const offsetX = Math.random() * 20 - 10;
          const offsetY = Math.random() * 20 - 10;
          
          if (typeof obj.set === "function") {
            obj.set({ 
              left: pasteCenter.x + offsetX, 
              top: pasteCenter.y + offsetY,
              evented: true 
            });
            canvas.add(obj);
            newObjects.push(obj);
            
            if (typeof obj.setCoords === "function") {
              obj.setCoords();
            }
          }
        });
        
        // Select pasted objects
        if (newObjects.length === 1) {
          canvas.setActiveObject(newObjects[0]);
        } else if (newObjects.length > 1) {
          const selection = new ActiveSelection(newObjects, { canvas });
          canvas.setActiveObject(selection);
        }
        
        canvas.requestRenderAll();
        toast.success("Objects pasted");
        return true;
      } catch (err) {
        console.error("Clipboard: Paste failed", err);
        toast.error("Failed to paste objects");
        return false;
      }
    }
    
    // Handle external image (Blob)
    if (clipboardData.sourceType === 'external' && clipboardData.data instanceof Blob) {
      try {
        await clipboardUtils.pasteExternalImage(canvas, clipboardData.data, position);
        return true;
      } catch (err) {
        console.error("Clipboard: Paste image failed", err);
        toast.error("Failed to paste image");
        return false;
      }
    }
    
    return false;
  },
  
  /**
   * Handle paste of external image
   */
  pasteExternalImage: (canvas: Canvas, blob: Blob, position?: Point): Promise<void> => {
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
          const fabricImage = new fabric.Image(img, {
            scaleX: 0.5,
            scaleY: 0.5,
          });
          
          // Position the image
          const pastePos = position || { x: canvas.width! / 2, y: canvas.height! / 2 };
          fabricImage.set({
            left: pastePos.x - ((fabricImage.width || 0) * (fabricImage.scaleX || 0.5)) / 2,
            top: pastePos.y - ((fabricImage.height || 0) * (fabricImage.scaleY || 0.5)) / 2,
          });
          
          canvas.add(fabricImage);
          canvas.setActiveObject(fabricImage);
          canvas.requestRenderAll();
          toast.success("Image pasted");
          resolve();
        }).catch(reject);
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
  
  /**
   * Read clipboard data from browser clipboard API
   */
  readExternalClipboard: async (): Promise<ClipboardData | null> => {
    if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
      console.log("Clipboard: API not supported");
      return null;
    }
    
    try {
      console.log("Clipboard: Reading from browser clipboard");
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type);
            console.log("Clipboard: Found image in browser clipboard");
            
            return {
              sourceType: 'external',
              timestamp: Date.now(),
              data: blob
            };
          }
        }
      }
      
      console.log("Clipboard: No image found in browser clipboard");
      return null;
    } catch (err) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        console.error("Clipboard: Access error", err);
      }
      return null;
    }
  },
  
  /**
   * Extract image from clipboard event
   */
  getImageFromClipboardEvent: (e: ClipboardEvent): ClipboardData | null => {
    if (!e.clipboardData?.items) return null;
    
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      const item = e.clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          console.log("Clipboard: Found image in clipboard event");
          return {
            sourceType: 'external',
            timestamp: Date.now(),
            data: blob
          };
        }
      }
    }
    
    console.log("Clipboard: No image found in clipboard event");
    return null;
  }
};
