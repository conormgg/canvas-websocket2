
import { Canvas, util, Point } from 'fabric';
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
      objects.forEach(obj => {
        const originalLeft = obj.get('left') || 0;
        const originalTop = obj.get('top') || 0;
        const position = calculatePastePosition(originalLeft, originalTop);
        
        obj.set({ 
          left: position.left, 
          top: position.top,
          evented: true 
        });
        
        canvas.add(obj);
        obj.setCoords();
      });

      if (objects.length === 1) {
        canvas.setActiveObject(objects[0]);
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
