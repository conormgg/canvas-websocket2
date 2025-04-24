
import React from "react";
import { useClipboardDebug } from "@/utils/clipboardDebug";
import { Clipboard } from "lucide-react";

export const ClipboardDebugPanel: React.FC = () => {
  const { clipboardItems } = useClipboardDebug();

  if (!clipboardItems || clipboardItems.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border rounded-lg flex items-center gap-2 text-gray-500">
        <Clipboard className="w-5 h-5" />
        <span>Clipboard is empty</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Clipboard className="w-5 h-5" />
        <h3 className="font-semibold">Clipboard Contents</h3>
      </div>
      {clipboardItems.map((item, index) => (
        <div key={index} className="mb-2 p-2 bg-white border rounded">
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};
