
import { useClipboardContext } from "@/context/ClipboardContext";
import { useState, useEffect } from "react";

export const useClipboardDebug = () => {
  const { clipboardData, lastInternalCopyTime, lastExternalCopyTime } = useClipboardContext();
  const [localClipboardData, setLocalClipboardData] = useState<any[] | null>(null);

  useEffect(() => {
    console.log("Clipboard Debug - Raw Clipboard Data:", clipboardData);
    console.log("Last Internal Copy Time:", new Date(lastInternalCopyTime).toISOString());
    console.log("Last External Copy Time:", new Date(lastExternalCopyTime).toISOString());
    setLocalClipboardData(clipboardData);
  }, [clipboardData, lastInternalCopyTime, lastExternalCopyTime]);

  useEffect(() => {
    console.log("Clipboard Debug - Local Clipboard Data:", localClipboardData);
  }, [localClipboardData]);

  return {
    clipboardItems: localClipboardData,
    lastInternalCopyTime,
    lastExternalCopyTime
  };
};
