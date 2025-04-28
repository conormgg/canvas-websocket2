
import { MousePointer, Pencil, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolButtonsProps {
  activeTool: "select" | "draw" | "eraser";
  onToolChange: (tool: "select" | "draw" | "eraser") => void;
}

export const ToolButtons = ({ activeTool, onToolChange }: ToolButtonsProps) => {
  return (
    <>
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
    </>
  );
};
