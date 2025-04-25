
import { Canvas, Point } from "fabric";

export interface ClipboardContextType {
  // Methods
  copySelectedObjects: (canvas: Canvas) => void;
  pasteToCanvas: (canvas: Canvas, position: Point) => Promise<void>;
  setActiveCanvas: (canvas: Canvas | null) => void;
  activeCanvas: Canvas | null;
}
