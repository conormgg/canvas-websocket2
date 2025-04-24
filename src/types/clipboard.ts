
import { Canvas, Point } from "fabric";

export interface ClipboardData {
  sourceType: 'internal' | 'external';
  timestamp: number;
  data: any[] | Blob | null;
}

export interface ClipboardContextType {
  // Current clipboard state
  clipboardData: ClipboardData | null;
  activeCanvas: Canvas | null;
  
  // Methods
  copySelectedObjects: (canvas: Canvas) => void;
  pasteToCanvas: (canvas: Canvas, position?: Point) => Promise<void>;
  canPaste: () => boolean;
  setActiveCanvas: (canvas: Canvas | null) => void;
}
