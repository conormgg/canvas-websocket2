
import { Toggle } from "@/components/ui/toggle";
import { useSyncContext } from "@/context/SyncContext";
import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhiteboardId } from "@/types/canvas";

interface SyncToggleProps {
  isSplitScreen?: boolean;
  boardId?: WhiteboardId;
}

export const SyncToggle = ({ isSplitScreen = false, boardId = "teacher" }: SyncToggleProps) => {
  const { isSyncEnabled, isSync2Enabled, toggleSync, toggleSync2 } = useSyncContext();
  
  // Determine which sync state and toggle function to use based on the board ID
  const isEnabled = boardId === "teacher" ? isSyncEnabled : boardId === "teacher2" ? isSync2Enabled : false;
  const toggleFunction = boardId === "teacher" ? toggleSync : boardId === "teacher2" ? toggleSync2 : toggleSync;
  
  const containerClass = isSplitScreen
    ? "scale-90"
    : "";
  
  return (
    <Toggle 
      pressed={isEnabled}
      onPressedChange={toggleFunction}
      className={cn(
        "bg-sidebar-primary hover:bg-sidebar-accent text-white rounded-md",
        isEnabled ? "border-2 border-green-500" : "border border-gray-600",
        containerClass
      )}
      aria-label="Toggle whiteboard sync"
    >
      <Repeat className={cn("h-4 w-4 mr-1", isEnabled ? "text-green-500" : "")} />
      Sync {isEnabled ? "ON" : "OFF"}
    </Toggle>
  );
};
