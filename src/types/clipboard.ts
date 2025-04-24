
import { Canvas, Point } from "fabric";
import { SimplePoint } from "@/hooks/clipboard/useImagePaste";

export interface ClipboardContextType {
  // State
  clipboardData: any[] | null;
  setClipboardData: (data: any[] | null) => void;
  activeBoard: string | null;
  selectedPosition: Point | null;
  
  // Methods
  copyObjects: (canvas: Canvas) => boolean;
  pasteInternal: (canvas: Canvas, internalData: any[]) => void;
  tryExternalPaste: (canvas: Canvas) => void;
  addImageFromBlob: (canvas: Canvas, blob: Blob, position: SimplePoint) => void;
  handleCanvasClick: (canvas: Canvas, pointer: Point) => void;
  isActiveBoard: (canvas: Canvas) => boolean;
  startPasteOperation: () => boolean;
  shouldUseInternalClipboard: () => boolean;
}
