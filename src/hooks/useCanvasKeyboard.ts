
import { Canvas } from 'fabric';
import { useCanvasDeletion } from './useCanvasDeletion';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { handleDelete } = useCanvasDeletion(fabricRef);

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle deletion, copy and paste are managed in useCanvasClipboard
    handleDelete(e);
  };

  return { handleKeyDown };
};
