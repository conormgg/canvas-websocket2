
import { Canvas } from "fabric";
import { RefObject } from "react";
import { toast } from "sonner";
import { clipboardUtils } from "@/utils/clipboardUtils";

export const useClipboardEvents = (
  fabricRef: RefObject<Canvas | null>,
  clipboardDataRef: RefObject<any[] | null>,
  setAwaitingPlacement: (value: boolean) => void
) => {
  const handleCopy = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "c" && fabricRef.current) {
      clipboardUtils.copyObjectsToClipboard(
        fabricRef.current, 
        clipboardDataRef,
        { current: Date.now() } // Add lastInternalCopyTimeRef as third argument
      );
    }
  };

  const handlePaste = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "v") {
      e.preventDefault();
      setAwaitingPlacement(true);
      toast.info("Click to place pasted object");
    }
  };

  return { handleCopy, handlePaste };
};
