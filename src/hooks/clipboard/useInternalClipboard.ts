
import { Canvas, FabricObject, util, Point } from 'fabric';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export const useInternalClipboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const [pastePosition, setPastePosition] = useState<Point | null>(null);
  const awaitingPlacementRef = useRef<boolean>(false);
  const placementPointRef = useRef<{x: number, y: number} | null>(null);

  const handleCanvasClick = (e: MouseEvent) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    if (canvas.isDrawingMode) return;
    
    const pointer = canvas.getPointer(e);
    setPastePosition(new Point(pointer.x, pointer.y));

    // If we're waiting for placement, capture the click position
    if (awaitingPlacementRef.current) {
      placementPointRef.current = { x: pointer.x, y: pointer.y };
      awaitingPlacementRef.current = false;
      
      // Trigger paste with the new position
      if (clipboardDataRef.current?.length) {
        pasteAtPosition(placementPointRef.current);
      }
    }
  };

  const handleCopy = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      
      const activeObjects = canvas.getActiveObjects();
      if (!activeObjects.length) return;
      
      clipboardDataRef.current = activeObjects.map(obj => obj.toObject(['id']));
      
      const itemText = activeObjects.length > 1 ? `${activeObjects.length} items` : '1 item';
      toast(`Copied ${itemText} to clipboard`);

      // Set flag to await placement on next click
      awaitingPlacementRef.current = true;
      toast("Click anywhere to place the copied item(s)");
    }
  };

  const pasteAtPosition = (position: {x: number, y: number} | null) => {
    if (!fabricRef.current || !clipboardDataRef.current?.length || !position) return;

    const canvas = fabricRef.current;
    const toEnliven = [...clipboardDataRef.current];

    util.enlivenObjects(toEnliven).then((objects: any[]) => {
      // If we have multiple objects, calculate group bounds to maintain relative positions
      let groupBounds = null;
      
      if (objects.length > 1) {
        // Create a temporary group to get bounds
        const tempGroup = canvas.getActiveObjects().length > 1 
          ? canvas.getActiveObject() 
          : null;
          
        if (tempGroup && 'getBoundingRect' in tempGroup) {
          groupBounds = (tempGroup as any).getBoundingRect();
        } else {
          // Fallback: manually calculate bounds
          let minX = Infinity, minY = Infinity;
          objects.forEach(obj => {
            if (typeof obj.left === 'number' && typeof obj.top === 'number') {
              minX = Math.min(minX, obj.left);
              minY = Math.min(minY, obj.top);
            }
          });
          
          if (minX !== Infinity && minY !== Infinity) {
            groupBounds = { left: minX, top: minY };
          }
        }
      }

      objects.forEach((obj: any) => {
        if (typeof obj.set !== 'function') return;

        // Calculate the new position
        let newLeft = position.x;
        let newTop = position.y;
        
        // If we have group bounds, maintain relative positions
        if (groupBounds) {
          const offsetX = typeof obj.left === 'number' ? obj.left - groupBounds.left : 0;
          const offsetY = typeof obj.top === 'number' ? obj.top - groupBounds.top : 0;
          newLeft = position.x + offsetX;
          newTop = position.y + offsetY;
        }
        
        // Set the new position
        obj.set({ 
          left: newLeft, 
          top: newTop,
          evented: true 
        });
        
        canvas.add(obj);
        
        if (typeof obj.setCoords === 'function') {
          obj.setCoords();
        }
      });

      // Select the pasted object(s)
      if (objects.length === 1 && objects[0]) {
        const firstObject = objects[0];
        if ('setCoords' in firstObject && typeof firstObject.setCoords === 'function') {
          canvas.setActiveObject(firstObject as FabricObject);
        }
      } else if (objects.length > 1) {
        const selection = canvas.getActiveObjects();
        if (selection.length) {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }

      placementPointRef.current = null;
      canvas.requestRenderAll();
      toast("Object(s) pasted successfully");
    });
  };

  const calculatePastePosition = (originalLeft: number = 0, originalTop: number = 0): { left: number, top: number } => {
    if (pastePosition) {
      const position = { left: pastePosition.x, top: pastePosition.y };
      setPastePosition(null);
      return position;
    } else {
      return { 
        left: originalLeft + 20, 
        top: originalTop + 20 
      };
    }
  };

  return {
    clipboardDataRef,
    pastePosition,
    setPastePosition,
    handleCanvasClick,
    handleCopy,
    calculatePastePosition,
    awaitingPlacementRef,
    placementPointRef,
    pasteAtPosition
  };
};
