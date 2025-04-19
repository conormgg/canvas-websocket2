
import { Canvas, util, Point, FabricObject } from 'fabric';
import { useEffect } from 'react';
import { useInternalClipboard } from './clipboard/useInternalClipboard';
import { useExternalClipboard } from './clipboard/useExternalClipboard';

export const useCanvasClipboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const {
    clipboardDataRef,
    pastePosition,
    setPastePosition,
    handleCanvasClick,
    handleCopy,
    calculatePastePosition
  } = useInternalClipboard(fabricRef);

  const {
    tryExternalPaste,
    handleExternalPaste
  } = useExternalClipboard(fabricRef, pastePosition);

  const handlePaste = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const canvas = fabricRef.current;
    if (!canvas || !e.ctrlKey || e.key !== 'v') return;
    
    e.preventDefault();
    
    const clipboardData = clipboardDataRef.current;
    if (!clipboardData?.length) {
      tryExternalPaste();
      return;
    }

    const toEnliven = [...clipboardData];

    util.enlivenObjects(toEnliven).then((objects) => {
      objects.forEach((obj: any) => {
        // Use type assertion and proper property access
        const originalLeft = typeof obj.left === 'number' ? obj.left : 0;
        const originalTop = typeof obj.top === 'number' ? obj.top : 0;
        const position = calculatePastePosition(originalLeft, originalTop);
        
        // Set the new position
        if (obj && typeof obj.set === 'function') {
          obj.set({ 
            left: position.left, 
            top: position.top,
            evented: true 
          });
          
          canvas.add(obj as FabricObject);
          
          if (typeof obj.setCoords === 'function') {
            obj.setCoords();
          }
        }
      });

      // Fix the type error by checking if the object has the setCoords method
      // and ensure it's a valid FabricObject before setting as active
      if (objects.length === 1 && objects[0]) {
        const firstObject = objects[0];
        if ('setCoords' in firstObject && typeof firstObject.setCoords === 'function') {
          // Only set as active object if it's a valid FabricObject
          canvas.setActiveObject(firstObject as FabricObject);
        }
      } else if (objects.length > 1) {
        const selection = canvas.getActiveObjects();
        if (selection.length) {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }

      setPastePosition(null);
      canvas.requestRenderAll();
    });
  };

  useEffect(() => {
    window.addEventListener('keydown', handleCopy);
    window.addEventListener('keydown', handlePaste);
    document.addEventListener('paste', handleExternalPaste);
    
    if (fabricRef.current?.wrapperEl) {
      fabricRef.current.wrapperEl.addEventListener('click', handleCanvasClick);
    }
    
    return () => {
      window.removeEventListener('keydown', handleCopy);
      window.removeEventListener('keydown', handlePaste);
      document.removeEventListener('paste', handleExternalPaste);
      
      if (fabricRef.current?.wrapperEl) {
        fabricRef.current.wrapperEl.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [fabricRef.current]);

  return { clipboardDataRef, pastePosition, setPastePosition };
};
