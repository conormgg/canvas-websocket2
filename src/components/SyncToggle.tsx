
import { Toggle } from "@/components/ui/toggle";
import { useSyncContext } from "@/context/SyncContext";
import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhiteboardId } from "@/types/canvas";

interface SyncToggleProps {
  isSplitScreen?: boolean;
  boardId?: WhiteboardId;
}

export const SyncToggle = ({ isSplitScreen = false, boardId = "teacher1" }: SyncToggleProps) => {
  const { isSyncEnabled, isSync2Enabled, toggleSync, toggleSync2 } = useSyncContext();
  
  // Map each board ID to its corresponding sync state
  const syncStateMap = {
    "teacher1": isSyncEnabled,
    "teacher2": isSync2Enabled,
    "teacher3": false,
    "teacher4": false,
    "teacher5": false
  };
  
  // Map each board ID to its corresponding toggle function
  const toggleFunctionMap = {
    "teacher1": toggleSync,
    "teacher2": toggleSync2,
    "teacher3": () => {},
    "teacher4": () => {},
    "teacher5": () => {}
  };
  
  // Get the correct sync state and toggle function for this board
  const isEnabled = syncStateMap[boardId as keyof typeof syncStateMap] || false;
  const toggleFunction = toggleFunctionMap[boardId as keyof typeof toggleFunctionMap] || toggleSync;
  
  // Only show the toggle for teacher1 and teacher2 which can actually sync
  if (boardId !== "teacher1" && boardId !== "teacher2") {
    return null;
  }
  
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
