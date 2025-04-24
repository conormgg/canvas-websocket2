
import { Canvas } from 'fabric';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

export const useCanvasKeyboard = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  // Use our new keyboard shortcuts hook
  useKeyboardShortcuts(fabricRef);

  // We no longer need handleKeyDown as it's handled by useKeyboardShortcuts
  return {};
};
