
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";
import { Link, Link2Off, ArrowRight } from "lucide-react";

// Define sync modes
export type SyncMode = "off" | "one-way" | "two-way";

interface SyncContextProps {
  isSyncEnabled: boolean;
  syncMode: SyncMode;
  toggleSync: () => void;
  setSyncMode: (mode: SyncMode) => void;
  sendUpdate: (objectData: any, sourceId: string, instanceId: string) => void;
  linkedBoards: WhiteboardId[];
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
    const savedMode = localStorage.getItem(SYNC_MODE_STORAGE_KEY) as SyncMode | null;
    return savedMode || "off";
  });

  const [linkedBoards, setLinkedBoards] = useState<WhiteboardId[]>([]);

  useEffect(() => {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(isSyncEnabled));
    localStorage.setItem(SYNC_MODE_STORAGE_KEY, syncMode);
    
    if (isSyncEnabled) {
      setLinkedBoards(["teacher"]);
      const syncIcon = syncMode === "one-way" 
        ? <ArrowRight className="h-4 w-4 text-blue-400" /> 
        : <Link className="h-4 w-4 text-green-500" />;
      
      toast.success(`Teacher boards linked - ${syncMode} sync mode`, {
        icon: syncIcon
      });
    } else {
      setLinkedBoards([]);
      setSyncMode("off");
      toast.info("Sync disabled", {
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
    if (isSyncEnabled) {
      // Turn off sync completely
      setIsSyncEnabled(false);
      setSyncMode("off");
    } else {
      // Turn on sync with the last mode or default to "two-way"
      setIsSyncEnabled(true);
      if (syncMode === "off") {
        setSyncMode("two-way");
      }
    }
  };

  const sendUpdate = (objectData: any, sourceId: string, instanceId: string) => {
    if (!isSyncEnabled) return;
    
    // Add verification to prevent sending unwanted updates
    if (syncMode === "off") return;
    
    // In one-way mode, only allow updates from the teacher view's teacher board
    if (syncMode === "one-way" && sourceId !== "teacher") {
      console.log("One-way sync: Blocking update from non-teacher source", sourceId);
      return;
    }
    
    const syncEvent = new CustomEvent("board-sync-update", {
      detail: {
        object: objectData,
        sourceId,
        instanceId,
        syncMode,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(syncEvent);
    console.log(`Object sent from board ${sourceId} (${instanceId}) in ${syncMode} mode`);
  };

  return (
    <SyncContext.Provider value={{ 
      isSyncEnabled, 
      syncMode,
      toggleSync, 
      setSyncMode,
      sendUpdate,
      linkedBoards
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
