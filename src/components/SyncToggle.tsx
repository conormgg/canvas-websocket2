
import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhiteboardId } from "@/types/canvas";

interface SyncToggleProps {
  isSplitScreen?: boolean;
  boardId?: WhiteboardId;
}

export const SyncToggle = ({ isSplitScreen = false, boardId = "teacher1" }: SyncToggleProps) => {
  // Always show sync as enabled since we removed toggle functionality
  const containerClass = isSplitScreen ? "scale-90" : "";
  
  return (
    <div 
      className={cn(
        "bg-sidebar-primary text-white rounded-md px-3 py-2 flex items-center",
        "border-2 border-green-500",
        containerClass
      )}
      aria-label="Whiteboard sync status"
    >
      <Repeat className="h-4 w-4 mr-1 text-green-500" />
      Sync ON
    </div>
  );
};
