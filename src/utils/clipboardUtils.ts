import { Canvas, ActiveSelection, Image, Point } from "fabric";
import { toast } from "sonner";

export const copyToSystemClipboard = async (canvas: Canvas, activeObjects: any[]) => {
  try {
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
        
        // Clean up
        tempFabricCanvas.dispose();
      });
    });
  } catch (err) {
    console.error("Copy error:", err);
    toast.error("Failed to copy objects");
  }
};

export const pasteImageBlobToCanvas = (canvas: Canvas, blob: Blob, position: Point): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (!url) {
        reject(new Error("Failed to read image data"));
        return;
      }
      
      Image.fromURL(url).then((fabricImage) => {
        // Ensure the image is selectable and positioned correctly
        fabricImage.set({
          left: position.x - ((fabricImage.width || 0) * (fabricImage.scaleX || 0.5)) / 2,
          top: position.y - ((fabricImage.height || 0) * (fabricImage.scaleY || 0.5)) / 2,
          scaleX: 0.5,
          scaleY: 0.5,
          selectable: true,
          evented: true,
        });
        
        canvas.add(fabricImage);
        canvas.setActiveObject(fabricImage);
        canvas.requestRenderAll();
        resolve();
      }).catch((err) => {
        console.error("Error loading image:", err);
        reject(err);
      });
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to ensure all objects on canvas are selectable
export const ensureObjectsSelectable = (canvas: Canvas) => {
  canvas.getObjects().forEach(obj => {
    obj.set({
      selectable: true,
      evented: true
    });
  });
  canvas.requestRenderAll();
};
