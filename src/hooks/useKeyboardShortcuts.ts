
import { Canvas } from 'fabric';
import { useKeyboardHandlers } from './keyboard/useKeyboardHandlers';
import { useTouchHandlers } from './touch/useTouchHandlers';

export const useKeyboardShortcuts = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  useKeyboardHandlers(fabricRef);
  useTouchHandlers(fabricRef);
};
