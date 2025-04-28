
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";

interface SyncContextProps {
  isSyncEnabled: boolean;
  toggleSync: () => void;
  sendObjectToStudents: (objectData: any) => void;
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
    
    // Create a custom event to broadcast the object data to student boards
    const syncEvent = new CustomEvent("teacher-update", {
      detail: {
        object: objectData,
        sourceId: "teacher",
        timestamp: Date.now(), // Add timestamp for ordering events
        targetId: "teacher" // This specifies which board in the student view should receive updates
      }
    });
    
    // Dispatch the event for student boards to listen for
    window.dispatchEvent(syncEvent);
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
