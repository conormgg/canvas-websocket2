
import { toast } from "sonner";

export const clipboardAccess = {
  readClipboard: async () => {
    if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
      toast.error("Clipboard API not supported in this browser");
      return null;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            return await clipboardItem.getType(type);
          }
        }
      }
      toast.error("No image found in clipboard");
      return null;
    } catch (err) {
      console.error("Clipboard access error:", err);
      toast.error("Could not access clipboard. Try clicking on the canvas first.");
      return null;
    }
  },

  getImageFromClipboardEvent: (e: ClipboardEvent) => {
    if (!e.clipboardData?.items) return null;
    
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      if (e.clipboardData.items[i].type.indexOf("image") !== -1) {
        return e.clipboardData.items[i].getAsFile();
      }
    }
    return null;
  }
};
