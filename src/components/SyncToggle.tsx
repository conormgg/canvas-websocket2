
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
  const { 
    isSyncEnabled, 
    isSync2Enabled, 
    isSync3Enabled, 
    isSync4Enabled, 
    isSync5Enabled, 
    toggleSync, 
    toggleSync2, 
    toggleSync3, 
    toggleSync4, 
    toggleSync5 
  } = useSyncContext();
  
  // Determine which sync state and toggle function to use based on the board ID
  const syncStateMap = {
    "teacher1": isSyncEnabled,
    "teacher2": isSync2Enabled,
    "teacher3": isSync3Enabled,
    "teacher4": isSync4Enabled,
    "teacher5": isSync5Enabled
  };
  
  const toggleFunctionMap = {
    "teacher1": toggleSync,
    "teacher2": toggleSync2,
    "teacher3": toggleSync3,
    "teacher4": toggleSync4,
    "teacher5": toggleSync5
  };
  
  const isEnabled = syncStateMap[boardId as keyof typeof syncStateMap] || false;
  const toggleFunction = toggleFunctionMap[boardId as keyof typeof toggleFunctionMap] || toggleSync;
  
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
