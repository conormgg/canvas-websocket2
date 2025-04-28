
import { Canvas } from 'fabric';
import { useEffect } from 'react';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      // Handle keyboard events (if needed in the future)
      // This is a minimal implementation since the main keyboard handling is in useKeyboardHandlers
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fabricRef]);
};
