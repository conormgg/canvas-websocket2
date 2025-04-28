
import { MousePointer, Pencil, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "./ColorPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SyncToggle } from "./SyncToggle";
import { WhiteboardId } from "@/types/canvas";

interface ToolbarProps {
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  onToolChange: (tool: "select" | "draw" | "eraser") => void;
  onColorChange: (color: string) => void;
  inkThickness: number;
  onInkThicknessChange: (thickness: number) => void;
  isSplitScreen?: boolean;
  boardId?: WhiteboardId;
  isLinked?: boolean;
}

export const Toolbar = ({
  activeTool,
  activeColor,
  onToolChange,
  onColorChange,
  inkThickness,
  onInkThicknessChange,
  isSplitScreen = false,
  boardId,
  isLinked = false,
}: ToolbarProps) => {
  const containerClass = isSplitScreen
    ? "bg-[#221F26] rounded-md shadow-md p-1 flex items-center justify-center gap-1 scale-90 max-w-xs"
    : "bg-[#221F26] rounded-lg shadow-lg p-2 flex items-center gap-2";

  // Only show sync toggle on teacher's board
  const showSyncToggle = boardId === "teacher";

  return (
    <div className={containerClass}>
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

      {isSplitScreen ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onColorChange("red")}
            className="bg-red-600 w-6 h-6 rounded-full"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onColorChange("blue")}
            className="bg-blue-600 w-6 h-6 rounded-full"
          />
          <Select
            onValueChange={(value) => onInkThicknessChange(Number(value))}
            defaultValue={inkThickness.toString()}
          >
            <SelectTrigger className="w-[60px] h-[28px] text-xs text-white border border-gray-600 bg-transparent">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Thin</SelectItem>
              <SelectItem value="4">Medium</SelectItem>
              <SelectItem value="6">Thick</SelectItem>
            </SelectContent>
          </Select>
          <SyncToggle isSplitScreen={true} boardId={boardId} isLinked={isLinked} />
        </>
      ) : (
        <>
          <div className="w-px h-8 bg-gray-600 mx-2" />
          <ColorPicker
            activeColor={activeColor}
            onColorChange={onColorChange}
          />
          <div className="w-px h-8 bg-gray-600 mx-2" />
          <Select
            value={inkThickness.toString()}
            onValueChange={(value) => onInkThicknessChange(Number(value))}
          >
            <SelectTrigger className="w-24 bg-transparent text-white border-gray-600">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Thin</SelectItem>
              <SelectItem value="4">Medium</SelectItem>
              <SelectItem value="6">Thick</SelectItem>
            </SelectContent>
          </Select>
          <SyncToggle boardId={boardId} isLinked={isLinked} />
        </>
      )}
    </div>
  );
};
