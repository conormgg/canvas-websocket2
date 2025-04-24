
import { useRef } from "react";

export const usePasteProgress = () => {
  const pasteInProgressRef = useRef(false);
  
  const startPasteOperation = () => {
    if (pasteInProgressRef.current) return false;
    pasteInProgressRef.current = true;
    setTimeout(() => { pasteInProgressRef.current = false; }, 300);
    return true;
  };
  
  return { startPasteOperation };
};
