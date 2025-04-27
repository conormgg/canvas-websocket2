
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";

interface SyncContextProps {
  isSyncEnabled: boolean;
  toggleSync: () => void;
  sendObjectToStudents: (objectData: any) => void;
}

const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage if available, otherwise default to false
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  // Save to localStorage when sync state changes
  useEffect(() => {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(isSyncEnabled));
    console.log(`Sync ${isSyncEnabled ? "enabled" : "disabled"}`);
  }, [isSyncEnabled]);

  const toggleSync = () => {
    setIsSyncEnabled((prev) => {
      const newState = !prev;
      toast(newState ? "Sync enabled" : "Sync disabled");
      return newState;
    });
  };

  const sendObjectToStudents = (objectData: any) => {
    if (!isSyncEnabled) return;
    
    // Create a custom event to broadcast the object to student boards
    const updateEvent = new CustomEvent("teacher-update", {
      detail: {
        object: objectData,
        sourceId: "teacher"
      }
    });
    
    window.dispatchEvent(updateEvent);
    console.log("Object sent to students:", objectData);
  };

  return (
    <SyncContext.Provider value={{ isSyncEnabled, toggleSync, sendObjectToStudents }}>
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
