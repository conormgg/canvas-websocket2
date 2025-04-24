
import { Canvas } from "fabric";
import { MutableRefObject } from "react";
import { toast } from "sonner";
import { clipboardUtils } from "@/utils/clipboardUtils";

export const useClipboardEvents = (
  fabricRef: MutableRefObject<Canvas | null>,
  clipboardDataRef: MutableRefObject<any[] | null>,
  setAwaitingPlacement: (value: boolean) => void
) => {
  const handleCopy = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "c" && fabricRef.current) {
      console.log("Copy initiated, clearing clipboard data");
      clipboardDataRef.current = null;
      
      const success = clipboardUtils.copyObjectsToClipboard(
        fabricRef.current, 
        clipboardDataRef
      );
      
      if (success) {
        console.log("Objects copied to clipboard:", clipboardDataRef.current?.length);
      }
    }
  };

  const handlePaste = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "v") {
      console.log("Paste initiated");
      e.preventDefault();
      setAwaitingPlacement(true);
      toast.info("Click to place pasted object");
    }
  };

  return { handleCopy, handlePaste };
};
