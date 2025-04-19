
import { Canvas, FabricObject, Image as FabricImage, util, Point } from 'fabric';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const useCanvasClipboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const clipboardDataRef = useRef<any[] | null>(null);
  const [pastePosition, setPastePosition] = useState<Point | null>(null);

  const handleCanvasClick = (e: MouseEvent) => {
    if (!fabricRef.current) return;
    
    // Check if we're currently drawing by checking if isDrawingMode is active
    // Avoid setting paste position while drawing
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

    util.enlivenObjects(toEnliven).then((objects: FabricObject[]) => {
      const useCustomPosition = pastePosition !== null;
      let centerX = 0, centerY = 0;
      
      if (useCustomPosition) {
        const bounds = objects.reduce((acc, obj) => {
          const left = obj.get('left') || 0;
          const top = obj.get('top') || 0;
          const width = obj.getScaledWidth();
          const height = obj.getScaledHeight();
          
          return {
            left: Math.min(acc.left, left),
            top: Math.min(acc.top, top),
            right: Math.max(acc.right, left + width),
            bottom: Math.max(acc.bottom, top + height)
          };
        }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
        
        centerX = (bounds.left + bounds.right) / 2;
        centerY = (bounds.top + bounds.bottom) / 2;
      }
      
      objects.forEach(obj => {
        const originalLeft = obj.get('left') || 0;
        const originalTop = obj.get('top') || 0;
        
        if (useCustomPosition) {
          const offsetX = originalLeft - centerX;
          const offsetY = originalTop - centerY;
          
          obj.set({ 
            left: pastePosition!.x + offsetX, 
            top: pastePosition!.y + offsetY,
            evented: true 
          });
        } else {
          const position = calculatePastePosition(originalLeft, originalTop);
          obj.set({ 
            left: position.left, 
            top: position.top,
            evented: true 
          });
        }
        
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
      
      const itemText = objects.length > 1 ? `${objects.length} items` : '1 item';
      toast(`Pasted ${itemText}`);
    });
  };

  const tryExternalPaste = async () => {
    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
          if (clipboardItem.types.includes('image/png') || 
              clipboardItem.types.includes('image/jpeg') ||
              clipboardItem.types.includes('image/svg+xml')) {
            const blob = await clipboardItem.getType(
              clipboardItem.types.find(type => type.startsWith('image/')) || 'image/png'
            );
            await addImageFromBlob(blob);
            return;
          }
        }
      } catch (err) {
        console.log('Clipboard API read failed, falling back to paste event:', err);
      }
    }
  };

  const handleExternalPaste = (e: ClipboardEvent) => {
    if (!e.clipboardData || !fabricRef.current) return;
    
    const items = e.clipboardData.items;
    
    let hasImageData = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        hasImageData = true;
        const blob = items[i].getAsFile();
        if (!blob) continue;
        
        addImageFromBlob(blob);
      }
    }

    if (hasImageData) {
      e.preventDefault();
    }
  };

  const addImageFromBlob = (blob: Blob) => {
    if (!fabricRef.current) return Promise.reject('Canvas not initialized');
    
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgUrl = event.target?.result as string;
        if (!imgUrl) {
          reject('Failed to read image data');
          return;
        }
        
        FabricImage.fromURL(imgUrl).then((img) => {
          img.scale(0.5);
          
          if (pastePosition) {
            img.set({
              left: pastePosition.x - (img.width || 0) * img.scaleX / 2,
              top: pastePosition.y - (img.height || 0) * img.scaleY / 2
            });
            setPastePosition(null);
          } else {
            fabricRef.current?.centerObject(img);
          }
          
          fabricRef.current?.add(img);
          fabricRef.current?.setActiveObject(img);
          fabricRef.current?.renderAll();
          toast("Image added to whiteboard");
          resolve();
        }).catch(err => {
          console.error('Error creating image:', err);
          reject(err);
        });
      };
      reader.onerror = () => {
        reject('Error reading file');
      };
      reader.readAsDataURL(blob);
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
