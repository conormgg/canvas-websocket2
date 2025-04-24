
import { useEffect } from 'react';
import { Canvas } from 'fabric';
import { useClipboardContext } from '@/context/ClipboardContext';

export const useKeyboardShortcuts = (
  fabricRef: React.MutableRefObject<Canvas | null>,
) => {
  const { 
    copyObjects,
    tryExternalPaste,
    isActiveBoard,
  } = useClipboardContext();

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas || !isActiveBoard(canvas)) {
        return; // Only handle events for active board
      }

      // Copy (Ctrl/Cmd + C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyObjects(canvas);
        return;
      }

      // Paste (Ctrl/Cmd + V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        tryExternalPaste(canvas);
        return;
      }

      // Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          e.preventDefault();
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => {
      document.removeEventListener('keydown', handleKeyboard);
    };
  }, [fabricRef, copyObjects, tryExternalPaste, isActiveBoard]);

  // No need to return anything as this hook just sets up listeners
};
