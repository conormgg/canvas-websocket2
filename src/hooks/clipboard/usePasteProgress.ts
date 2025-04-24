
import { useClipboardContext } from "@/context/ClipboardContext";

export const usePasteProgress = () => {
  const { startPasteOperation } = useClipboardContext();
  return { startPasteOperation };
};
