
import { Object as FabricObject } from "fabric";

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

export type WhiteboardId = "teacher1" | "teacher2" | "teacher3" | "teacher4" | "teacher5" | "student1" | "student2" | "student3" | "student4" | "student5";
export type StudentId = "student1" | "student2" | "student3" | "student4" | "student5";
export type TeacherId = "teacher1" | "teacher2" | "teacher3" | "teacher4" | "teacher5";
