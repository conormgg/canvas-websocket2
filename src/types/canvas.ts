
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

export type TeacherId = "teacher1" | "teacher2" | "teacher3" | "teacher4" | "teacher5";
export type StudentId = "student1" | "student2";
export type WhiteboardId = TeacherId | StudentId;

export const SYNC_PAIRS: Record<TeacherId, StudentId> = {
  teacher1: "student1",
  teacher2: "student2",
  teacher3: "student1",
  teacher4: "student2",
  teacher5: "student1"
};
