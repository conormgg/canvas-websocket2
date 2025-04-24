
import { useClipboardContext } from "@/context/ClipboardContext";
import { useState, useEffect } from "react";

export const useClipboardDebug = () => {
  const { clipboardData } = useClipboardContext();
  const [localClipboardData, setLocalClipboardData] = useState<any[] | null>(null);

  useEffect(() => {
    console.log("Clipboard Debug - Raw Clipboard Data:", clipboardData);
    setLocalClipboardData(clipboardData);
  }, [clipboardData]);

  useEffect(() => {
    console.log("Clipboard Debug - Local Clipboard Data:", localClipboardData);
  }, [localClipboardData]);

  return {
    clipboardItems: localClipboardData
  };
};

