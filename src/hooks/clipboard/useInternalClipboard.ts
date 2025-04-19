
import { Canvas, FabricObject, util, Point } from 'fabric';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export const useInternalClipboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const [pastePosition, setPastePosition] = useState<Point | null>(null);

  const handleCanvasClick = (e: MouseEvent) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    if (canvas.isDrawingMode) return;
    
    const pointer = canvas.getPointer(e);
    setPastePosition(new Point(pointer.x, pointer.y));
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
    }
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
    calculatePastePosition
  };
};
