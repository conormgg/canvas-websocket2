
import { Toggle } from "@/components/ui/toggle";
import { useSyncContext } from "@/context/SyncContext";
import { SyncIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncToggleProps {
  isSplitScreen?: boolean;
}

export const SyncToggle = ({ isSplitScreen = false }: SyncToggleProps) => {
  const { isSyncEnabled, toggleSync } = useSyncContext();
  
  const containerClass = isSplitScreen
    ? "scale-90"
    : "";
  
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
    >
      <SyncIcon className={cn("h-4 w-4 mr-1", isSyncEnabled ? "text-green-500" : "")} />
      Sync {isSyncEnabled ? "ON" : "OFF"}
    </Toggle>
  );
};
