
import React from "react";
import { Button } from "@/components/ui/button";
import { useSyncContext } from "@/context/SyncContext";
import { Link, Link2Off, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface SyncModeToggleProps {
  isSplitScreen?: boolean;
}

export const SyncModeToggle = ({ isSplitScreen = false }: SyncModeToggleProps) => {
  const { isSyncEnabled, toggleSync, syncMode, setSyncMode } = useSyncContext();

  const getSyncIcon = () => {
    if (!isSyncEnabled || syncMode === "off") return <Link2Off className="h-4 w-4" />;
    if (syncMode === "one-way") return <ArrowRight className="h-4 w-4 text-blue-400" />;
    return <Link className="h-4 w-4 text-green-500" />;
  };

  const getSyncLabel = () => {
    if (!isSyncEnabled || syncMode === "off") return "Sync OFF";
    if (syncMode === "one-way") return "One-way";
    return "Two-way";
  };

  const handleModeChange = (mode: "off" | "one-way" | "two-way") => {
    if (mode === "off") {
      setSyncMode("off");
      if (isSyncEnabled) {
        toggleSync();
      }
    } else {
      setSyncMode(mode);
      if (!isSyncEnabled) {
        toggleSync();
      }
    }
  };

  const getTooltipText = () => {
    if (!isSyncEnabled || syncMode === "off") {
      return "Sync disabled";
    } else if (syncMode === "one-way") {
      return "One-way sync: Teacher board sends updates to student board";
    } else {
      return "Two-way sync: Both teacher boards send and receive updates";
    }
  };
  
  const containerClass = cn(
    "flex items-center",
    isSplitScreen ? "scale-90" : ""
  );

  return (
    <div className={containerClass}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={isSyncEnabled ? "default" : "outline"} 
                    className={cn(
                      "bg-sidebar-primary hover:bg-sidebar-accent text-white rounded-md",
                      isSyncEnabled && syncMode === "two-way" ? "border-2 border-green-500" : "",
                      isSyncEnabled && syncMode === "one-way" ? "border-2 border-blue-500" : "",
                      !isSyncEnabled || syncMode === "off" ? "border border-gray-600" : ""
                    )}
                    size="sm"
                  >
                    {getSyncIcon()}
                    <span className="ml-1 text-xs">{getSyncLabel()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleModeChange("off")}>
                    <Link2Off className="h-4 w-4 mr-2" />
                    <span>Off</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleModeChange("one-way")}>
                    <ArrowRight className="h-4 w-4 mr-2 text-blue-400" />
                    <span>One-way Sync</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleModeChange("two-way")}>
                    <Link className="h-4 w-4 mr-2 text-green-500" />
                    <span>Two-way Sync</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {getTooltipText()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
