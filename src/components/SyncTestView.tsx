
import { useState, useEffect } from "react";
import { Whiteboard } from "./Whiteboard";
import { toast } from "sonner";

export const SyncTestView = () => {
  // Ensure both boards remain synchronized
  useEffect(() => {
    // Make sure sync is enabled when this view loads
    const syncEvent = new CustomEvent("sync-force-enable", {});
    window.dispatchEvent(syncEvent);
    
    toast.info("Sync mode automatically enabled in test view", {
      duration: 3000,
    });
    
    return () => {
      // Clean up if needed
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] flex">
      <div className="w-1/2 h-full p-4">
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
            Teacher Board 1
          </div>
          <Whiteboard id="teacher" isSplitScreen={true} />
        </div>
      </div>
      <div className="w-1/2 h-full p-4 border-l-2 border-gray-200">
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="absolute top-2 right-6 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
            Teacher Board 2
          </div>
          <Whiteboard id="teacher" isSplitScreen={true} />
        </div>
      </div>
    </div>
  );
};
