
export interface UseCanvasProps {
  id?: WhiteboardId;
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  inkThickness: number;
  onZoomChange?: (zoom: number) => void;
  onObjectAdded?: (object: FabricObject) => void;
  isSplitScreen?: boolean;
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export type WhiteboardId = "teacher" | "teacher2" | "student1" | "student2";
export type StudentId = "student1" | "student2";

