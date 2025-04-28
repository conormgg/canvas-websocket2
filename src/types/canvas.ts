
import { Object as FabricObject } from 'fabric';

export interface UseCanvasProps {
  id?: "teacher" | "student1" | "student2" | "student3" | "student4";
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  inkThickness: number;
  onZoomChange?: (zoom: number) => void;
  onObjectAdded?: (object: FabricObject) => void;
  isSplitScreen?: boolean;
  instanceId?: string;
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export type WhiteboardId = "teacher" | "student1" | "student2" | "student3" | "student4";
export type StudentId = Exclude<WhiteboardId, "teacher">;
