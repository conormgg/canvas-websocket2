
import { Toggle } from "@/components/ui/toggle";
import { useSyncContext } from "@/context/SyncContext";
import { Link, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhiteboardId } from "@/types/canvas";

interface SyncToggleProps {
  isSplitScreen?: boolean;
  boardId?: WhiteboardId;
  isLinked?: boolean;
}

export const SyncToggle = ({ 
  isSplitScreen = false,
  boardId,
  isLinked = false
}: SyncToggleProps) => {
  const { isSyncEnabled, toggleSync } = useSyncContext();
  
  // Only enable toggle on teacher's board
  const isTeacherBoard = boardId === "teacher";
  const showToggle = isTeacherBoard;
  
  const containerClass = isSplitScreen
    ? "scale-90"
    : "";
  
  if (!showToggle && !isLinked) return null;
  
  // If it's a linked board but not the teacher board, show indicator only
  if (isLinked && !isTeacherBoard) {
    return (
      <div className={cn(
        "flex items-center gap-1 bg-sidebar-primary px-2 py-1 rounded-md text-xs text-white",
        "border-2 border-green-500",
        containerClass
      )}>
        <Link className="h-3 w-3 text-green-500" />
        <span>Linked</span>
      </div>
    );
  }
  
  return (
    <Toggle 
      pressed={isSyncEnabled}
      onPressedChange={toggleSync}
      className={cn(
        "bg-sidebar-primary hover:bg-sidebar-accent text-white rounded-md",
        isSyncEnabled ? "border-2 border-green-500" : "border border-gray-600",
        containerClass
      )}
      aria-label="Toggle whiteboard sync"
      disabled={!isTeacherBoard}
    >
      {isSyncEnabled ? (
        <Link className="h-4 w-4 mr-1 text-green-500" />
      ) : (
        <Link2Off className="h-4 w-4 mr-1" />
      )}
      Sync {isSyncEnabled ? "ON" : "OFF"}
    </Toggle>
  );
};
