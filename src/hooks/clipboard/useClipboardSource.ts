
import { Canvas } from "fabric";
import { useClipboardContext } from "@/context/ClipboardContext";

export const useClipboardSource = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const { shouldUseInternalClipboard, isActiveBoard: contextIsActiveBoard } = useClipboardContext();
  
  const isActiveBoard = () => {
    const canvas = fabricRef.current;
    if (!canvas) return false;
    return contextIsActiveBoard(canvas);
  };

  return {
    shouldUseInternalClipboard,
    isActiveBoard
  };
};
