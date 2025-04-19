
export interface UseCanvasProps {
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  inkThickness: number;
  onZoomChange: (zoom: number) => void;
}

export interface CanvasPosition {
  x: number;
  y: number;
}
