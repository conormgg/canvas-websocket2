
import { useClipboardContext } from "@/context/ClipboardContext";

export const usePasteProgress = () => {
  const { canPaste } = useClipboardContext();
  return { canPaste };
};
