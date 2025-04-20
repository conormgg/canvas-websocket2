
import { Object as FabricObject } from 'fabric';

export interface UseCanvasProps {
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  inkThickness: number;
  onZoomChange: (zoom: number) => void;
  onObjectAdded?: (object: FabricObject) => void;
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export type WhiteboardId = "teacher" | "student1" | "student2" | "student3" | "student4";
export type StudentId = Exclude<WhiteboardId, "teacher">;
