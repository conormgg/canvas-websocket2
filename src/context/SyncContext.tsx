
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";
import { Link, LinkOff } from "lucide-react";

interface SyncContextProps {
  isSyncEnabled: boolean;
  toggleSync: () => void;
  sendObjectToTeacherBoards: (objectData: any) => void;
  linkedBoards: WhiteboardId[];
}

// Use localStorage to persist sync state across views
const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";

// Create a context for sync functionality
const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage if available, otherwise default to false
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  // Array of boards that are currently linked
  const [linkedBoards, setLinkedBoards] = useState<WhiteboardId[]>([]);

  // Save to localStorage when sync state changes
  useEffect(() => {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(isSyncEnabled));
    
    // Update linked boards list when sync is toggled
    if (isSyncEnabled) {
      setLinkedBoards(["teacher"]);
      toast.success("Teacher boards linked across views", {
        icon: <Link className="h-4 w-4" />
      });
    } else {
      setLinkedBoards([]);
      toast.info("Teacher boards unlinked", {
        icon: <LinkOff className="h-4 w-4" />
      });
    }
    
    console.log(`Sync ${isSyncEnabled ? "enabled" : "disabled"}`);
  }, [isSyncEnabled]);

  const toggleSync = () => {
    setIsSyncEnabled((prev) => !prev);
  };

  const sendObjectToTeacherBoards = (objectData: any) => {
    if (!isSyncEnabled) return;
    
    // Create a custom event to broadcast the object data to teacher boards in other views
    const syncEvent = new CustomEvent("teacher-board-update", {
      detail: {
        object: objectData,
        timestamp: Date.now()
      }
    });
    
    // Dispatch the event for teacher boards to listen for
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
