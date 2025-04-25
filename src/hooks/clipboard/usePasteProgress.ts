
import { useClipboardContext } from "@/context/ClipboardContext";

export const usePasteProgress = () => {
  const { activeCanvas } = useClipboardContext();
  
  // This hook now simply returns whether we have an active canvas
  // which is necessary for paste operations
  return { 
    canPaste: !!activeCanvas 
  };
};
