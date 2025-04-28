
import { WhiteboardId } from "@/types/canvas";
import { ToolButtons } from "./toolbar/ToolButtons";
import { ColorPicker } from "./ColorPicker";
import { InkThicknessSelector } from "./toolbar/InkThicknessSelector";
import { CompactColorSelector } from "./toolbar/CompactColorSelector";
import { SyncToggle } from "./SyncToggle";

interface ToolbarProps {
  activeTool: "select" | "draw" | "eraser";
  activeColor: string;
  onToolChange: (tool: "select" | "draw" | "eraser") => void;
  onColorChange: (color: string) => void;
  inkThickness: number;
  onInkThicknessChange: (thickness: number) => void;
  isSplitScreen?: boolean;
  boardId?: WhiteboardId;
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
}: ToolbarProps) => {
  const containerClass = isSplitScreen
    ? "bg-[#221F26] rounded-md shadow-md p-1 flex items-center justify-center gap-1 scale-90 max-w-xs"
    : "bg-[#221F26] rounded-lg shadow-lg p-2 flex items-center gap-2";

  const showSyncToggle = boardId === "teacher1" && !isSplitScreen;

  return (
    <div className={containerClass}>
      <ToolButtons 
        activeTool={activeTool}
        onToolChange={onToolChange}
      />

      {isSplitScreen ? (
        <>
          <CompactColorSelector onColorChange={onColorChange} />
          <InkThicknessSelector
            inkThickness={inkThickness}
            onInkThicknessChange={onInkThicknessChange}
            isSplitScreen={true}
          />
          {showSyncToggle && <SyncToggle isSplitScreen={true} boardId={boardId} />}
        </>
      ) : (
        <>
          <div className="w-px h-8 bg-gray-600 mx-2" />
          <ColorPicker
            activeColor={activeColor}
            onColorChange={onColorChange}
          />
          <div className="w-px h-8 bg-gray-600 mx-2" />
          <InkThicknessSelector
            inkThickness={inkThickness}
            onInkThicknessChange={onInkThicknessChange}
          />
          {showSyncToggle && <SyncToggle boardId={boardId} />}
        </>
      )}
    </div>
  );
};
