
import { Canvas, Image as FabricImage } from 'fabric';
import { toast } from 'sonner';
import { Point } from 'fabric';

export const useExternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  pastePosition: Point | null
) => {
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

  return {
    tryExternalPaste,
    handleExternalPaste,
    addImageFromBlob
  };
};
