
import { useState, useEffect } from "react";
import { Whiteboard } from "./Whiteboard";
import { toast } from "sonner";
import { useSyncContext } from "@/context/SyncContext";
import { Button } from "@/components/ui/button";
import { Link, Link2Off, ArrowRight } from "lucide-react";

export const SyncTestView = () => {
  const { isSyncEnabled, syncMode, setSyncMode } = useSyncContext();

  useEffect(() => {
    // Make sure sync is enabled when this view loads, but don't force the mode
    const syncEvent = new CustomEvent("sync-force-enable", {});
    window.dispatchEvent(syncEvent);
    
    if (!isSyncEnabled) {
      toast.info("Sync mode automatically enabled in test view", {
        duration: 3000,
      });
    }
  }, []);

  const toggleSyncMode = () => {
    if (syncMode === "off") {
      setSyncMode("one-way");
      toast.info("One-way sync mode enabled", {
        icon: <ArrowRight className="h-4 w-4 text-blue-400" />
      });
    } else if (syncMode === "one-way") {
      setSyncMode("two-way");
      toast.success("Two-way sync mode enabled", {
        icon: <Link className="h-4 w-4 text-green-500" />
      });
    } else {
      setSyncMode("off");
      toast.info("Sync mode disabled", {
        icon: <Link2Off className="h-4 w-4" />
      });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] flex flex-col">
      <div className="flex justify-center p-2 gap-2 bg-sidebar-primary text-white">
        <p className="text-sm font-medium">
          Sync Mode: {syncMode === "off" ? "Off" : syncMode === "one-way" ? "One-way" : "Two-way"}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSyncMode}
          className="h-6 py-0 px-2 text-xs ml-2 bg-transparent border-white text-white hover:bg-sidebar-accent"
        >
          Change Mode
        </Button>
      </div>
      
      <div className="flex flex-1">
        <div className="w-1/2 h-full p-4">
          <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md z-10">
              Teacher Board 1
            </div>
            <Whiteboard id="teacher" isSplitScreen={true} />
          </div>
        </div>
        <div className="w-1/2 h-full p-4 border-l-2 border-gray-200">
          <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 right-6 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md z-10">
              Student Board
            </div>
            <Whiteboard id="student1" isSplitScreen={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
