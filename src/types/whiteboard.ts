import { WhiteboardId } from "./canvas";

export interface WhiteboardProps {
  id: WhiteboardId;
  isSplitScreen?: boolean;
  onCtrlClick?: () => void;
  isMaximized?: boolean;
  toolbarProps?: {
    backgroundColor?: string;
  };
}

export interface WhiteboardState {
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  inkThickness: number;
  zoom: number;
  isActive: boolean;
  isMaximized: boolean;
}
