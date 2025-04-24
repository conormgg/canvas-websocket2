
import { useClipboardContext } from "@/context/ClipboardContext";
import { useState, useEffect } from "react";

export const useClipboardDebug = () => {
  const { clipboardData } = useClipboardContext();
  const [localClipboardData, setLocalClipboardData] = useState<any[] | null>(null);

  useEffect(() => {
    setLocalClipboardData(clipboardData);
  }, [clipboardData]);

  return {
    clipboardItems: localClipboardData
  };
};
