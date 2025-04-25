
import { Canvas, Point } from "fabric";
import { WhiteboardId } from "./canvas";

export interface ClipboardContextType {
  // Methods
  copySelectedObjects: (canvas: Canvas) => void;
  pasteToCanvas: (canvas: Canvas, position: Point, boardId?: WhiteboardId) => Promise<void>;
  setActiveCanvas: (canvas: Canvas | null, boardId?: WhiteboardId | null) => void;
  activeCanvas: Canvas | null;
  activeBoardId: WhiteboardId | null;
}
