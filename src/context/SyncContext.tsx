import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";
import { Link, Link2Off } from "lucide-react";

interface SyncContextProps {
  isSyncEnabled: boolean;
  toggleSync: () => void;
  sendObjectToTeacherBoards: (objectData: any) => void;
  linkedBoards: WhiteboardId[];
}

const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  const [linkedBoards, setLinkedBoards] = useState<WhiteboardId[]>([]);

  useEffect(() => {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(isSyncEnabled));
    
    if (isSyncEnabled) {
      setLinkedBoards(["teacher"]);
      toast.success("Teacher boards linked across views", {
        icon: <Link className="h-4 w-4" />
      });
    } else {
      setLinkedBoards([]);
      toast.info("Teacher boards unlinked", {
        icon: <Link2Off className="h-4 w-4" />
      });
    }
    
    console.log(`Sync ${isSyncEnabled ? "enabled" : "disabled"}`);
  }, [isSyncEnabled]);

  const toggleSync = () => {
    setIsSyncEnabled((prev) => !prev);
  };

  const sendObjectToTeacherBoards = (objectData: any) => {
    if (!isSyncEnabled) return;
    
    const syncEvent = new CustomEvent("teacher-board-update", {
      detail: {
        object: objectData,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(syncEvent);
    console.log("Object sent to all teacher boards:", objectData);
  };

  return (
    <SyncContext.Provider value={{ 
      isSyncEnabled, 
      toggleSync, 
      sendObjectToTeacherBoards,
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
