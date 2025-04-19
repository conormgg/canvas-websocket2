
import { Canvas } from 'fabric';
import { useCanvasDeletion } from './useCanvasDeletion';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { handleDelete } = useCanvasDeletion(fabricRef);

  const handleKeyDown = (e: KeyboardEvent) => {
    handleDelete(e);
    // Copy and Paste are now handled directly in useCanvasClipboard
  };

  return { handleKeyDown };
};
