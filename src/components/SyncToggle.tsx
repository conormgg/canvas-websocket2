
import { Toggle } from "@/components/ui/toggle";
import { useSyncContext } from "@/context/SyncContext";
import { SplitIcon } from "lucide-react";
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
        containerClass
      )}
      aria-label="Toggle whiteboard sync"
    >
      <SplitIcon className="h-4 w-4 mr-1" />
      Sync {isSyncEnabled ? "ON" : "OFF"}
    </Toggle>
  );
};
