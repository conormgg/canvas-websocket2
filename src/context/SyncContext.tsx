import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";

interface SyncContextProps {
  isSyncEnabled: boolean;
  toggleSync: () => void;
  sendObjectToStudents: (objectData: any, sourceId: WhiteboardId) => void;
}

const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

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

  const sendObjectToStudents = (objectData: any, sourceId: WhiteboardId) => {
    if (!isSyncEnabled) return;
    
    const syncPairs = {
      'teacher': 'student1',
      'teacher2': 'student2'
    };
    
    const targetId = syncPairs[sourceId as keyof typeof syncPairs];
    if (!targetId) {
      console.log(`Object from ${sourceId} not synced - not a teacher board`);
      return;
    }
    
    const syncEvent = new CustomEvent("teacher-update", {
      detail: {
        object: objectData,
        sourceId,
        timestamp: Date.now(),
        targetId
      }
    });
    
    window.dispatchEvent(syncEvent);
    console.log(`Object sent from ${sourceId} to ${targetId}:`, objectData);
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
