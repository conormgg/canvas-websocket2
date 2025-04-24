
import React from "react";
import { useClipboardContext } from "@/context/ClipboardContext";
import { Clipboard } from "lucide-react";
import { Badge } from "./ui/badge";

export const ClipboardDebugPanel: React.FC = () => {
  const { 
    clipboardData,
    activeBoard
  } = useClipboardContext();
  
  const itemCount = clipboardData?.length || 0;

  if (!clipboardData || clipboardData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border rounded-lg flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-gray-500" />
          <Badge variant="secondary">0</Badge>
          <span className="text-gray-500">Clipboard is empty</span>
        </div>
        <div className="text-xs text-gray-400">
          Active Board: {activeBoard || 'None'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Clipboard className="w-5 h-5" />
        <Badge variant="default">{itemCount}</Badge>
        <h3 className="font-semibold">Clipboard Contents</h3>
      </div>
      <div className="text-xs text-gray-500 mb-2">
        Active Board: {activeBoard || 'None'}
      </div>
      {clipboardData.map((item, index) => (
        <div key={index} className="mb-2 p-2 bg-white border rounded">
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};
