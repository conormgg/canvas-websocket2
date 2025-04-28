
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";
import { Link, Link2Off } from "lucide-react";

// Define sync modes
export type SyncMode = "off" | "one-way" | "two-way";

interface SyncContextProps {
  isSyncEnabled: boolean;
  toggleSync: () => void;
  sendObjectToTeacherBoards: (objectData: any, sourceId: string) => void;
  linkedBoards: WhiteboardId[];
  syncMode: SyncMode;
  setSyncMode: (mode: SyncMode) => void;
}

const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";
const SYNC_MODE_STORAGE_KEY = "whiteboard-sync-mode";

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });
  
  const [syncMode, setSyncMode] = useState<SyncMode>(() => {
    const savedMode = localStorage.getItem(SYNC_MODE_STORAGE_KEY);
    return (savedMode as SyncMode) || "two-way";
  });

  const [linkedBoards, setLinkedBoards] = useState<WhiteboardId[]>([]);

  useEffect(() => {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(isSyncEnabled));
    localStorage.setItem(SYNC_MODE_STORAGE_KEY, syncMode);
    
    if (isSyncEnabled) {
      setLinkedBoards(["teacher"]);
      toast.success(`Teacher boards linked - ${syncMode} sync mode`, {
        icon: <Link className="h-4 w-4" />
      });
    } else {
      setLinkedBoards([]);
      toast.info("Teacher boards unlinked", {
        icon: <Link2Off className="h-4 w-4" />
      });
    }
    
    console.log(`Sync ${isSyncEnabled ? "enabled" : "disabled"} in ${syncMode} mode`);
  }, [isSyncEnabled, syncMode]);
  
  // Listen for forced sync enable events (from SyncTestView)
  useEffect(() => {
    const handleForceSyncEnable = () => {
      setIsSyncEnabled(true);
    };
    
    window.addEventListener("sync-force-enable", handleForceSyncEnable);
    return () => {
      window.removeEventListener("sync-force-enable", handleForceSyncEnable);
    };
  }, []);

  const toggleSync = () => {
    setIsSyncEnabled((prev) => !prev);
  };

  const sendObjectToTeacherBoards = (objectData: any, sourceId: string) => {
    if (!isSyncEnabled) return;
    
    // In one-way mode, only allow updates from the primary teacher board
    if (syncMode === "one-way" && sourceId !== "teacher") {
      return;
    }
    
    const syncEvent = new CustomEvent("teacher-board-update", {
      detail: {
        object: objectData,
        sourceId,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(syncEvent);
    console.log(`Object sent from board ${sourceId} to all teacher boards in ${syncMode} mode:`, objectData);
  };

  return (
    <SyncContext.Provider value={{ 
      isSyncEnabled, 
      toggleSync, 
      sendObjectToTeacherBoards,
      linkedBoards,
      syncMode,
      setSyncMode
    }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSyncContext must be used within a SyncProvider");
  }
  return context;
};
