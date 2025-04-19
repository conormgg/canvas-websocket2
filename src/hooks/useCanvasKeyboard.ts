
import { Canvas } from 'fabric';
import { useCanvasClipboard } from './useCanvasClipboard';
import { useCanvasDeletion } from './useCanvasDeletion';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const { handleCopy, handlePaste } = useCanvasClipboard(fabricRef);
  const { handleDelete } = useCanvasDeletion(fabricRef);

  const handleKeyDown = (e: KeyboardEvent) => {
    handleDelete(e);
    handleCopy(e);
    handlePaste(e);
  };

  return { handleKeyDown };
};
