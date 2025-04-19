
import { MousePointer, Pencil, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "./ColorPicker";

interface ToolbarProps {
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  onToolChange: (tool: "select" | "draw" | "eraser") => void;
  onColorChange: (color: string) => void;
}

export const Toolbar = ({ activeTool, activeColor, onToolChange, onColorChange }: ToolbarProps) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#221F26] rounded-lg shadow-lg p-2 flex items-center gap-2">
      <Button
        variant={activeTool === "select" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onToolChange("select")}
        className="text-white hover:text-white"
      >
        <MousePointer className="h-5 w-5" />
      </Button>
      <Button
        variant={activeTool === "draw" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onToolChange("draw")}
        className="text-white hover:text-white"
      >
        <Pencil className="h-5 w-5" />
      </Button>
      <Button
        variant={activeTool === "eraser" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onToolChange("eraser")}
        className="text-white hover:text-white"
      >
        <Eraser className="h-5 w-5" />
      </Button>
      <div className="w-px h-8 bg-gray-600 mx-2" />
      <ColorPicker activeColor={activeColor} onColorChange={onColorChange} />
    </div>
  );
};
