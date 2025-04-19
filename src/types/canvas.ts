
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
