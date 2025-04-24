
import React from "react";
import { useClipboardContext } from "@/context/ClipboardContext";
import { Clipboard, Clock } from "lucide-react";
import { Badge } from "./ui/badge";

export const ClipboardDebugPanel: React.FC = () => {
  const { 
    clipboardData,
    lastInternalCopyTime, 
    lastExternalCopyTime 
  } = useClipboardContext();
  
  const itemCount = clipboardData?.length || 0;

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!clipboardData || clipboardData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border rounded-lg flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-gray-500" />
          <Badge variant="secondary">0</Badge>
          <span className="text-gray-500">Clipboard is empty</span>
        </div>
        <div className="text-xs text-gray-400">
          <Clock className="w-4 h-4 inline mr-1" />
          Last internal: {formatTime(lastInternalCopyTime)}
        </div>
        <div className="text-xs text-gray-400">
          <Clock className="w-4 h-4 inline mr-1" />
          Last external: {formatTime(lastExternalCopyTime)}
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
        <Clock className="w-4 h-4 inline mr-1" />
        Last internal: {formatTime(lastInternalCopyTime)}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        <Clock className="w-4 h-4 inline mr-1" />
        Last external: {formatTime(lastExternalCopyTime)}
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
