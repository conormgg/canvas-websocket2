
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";

interface SyncContextProps {
  isSyncEnabled: boolean;
  isSync2Enabled: boolean;
  toggleSync: () => void;
  toggleSync2: () => void;
  sendObjectToStudents: (objectData: any, sourceId: WhiteboardId) => void;
}

const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";
const SYNC2_STORAGE_KEY = "whiteboard-sync2-enabled";

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  const [isSync2Enabled, setIsSync2Enabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC2_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  useEffect(() => {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(isSyncEnabled));
    console.log(`Sync ${isSyncEnabled ? "enabled" : "disabled"}`);
  }, [isSyncEnabled]);

  useEffect(() => {
    localStorage.setItem(SYNC2_STORAGE_KEY, JSON.stringify(isSync2Enabled));
    console.log(`Sync 2 ${isSync2Enabled ? "enabled" : "disabled"}`);
  }, [isSync2Enabled]);

  const toggleSync = () => {
    setIsSyncEnabled((prev) => {
      const newState = !prev;
      toast(newState ? "Sync enabled" : "Sync disabled");
      return newState;
    });
  };

  const toggleSync2 = () => {
    setIsSync2Enabled((prev) => {
      const newState = !prev;
      toast(newState ? "Sync 2 enabled" : "Sync 2 disabled");
      return newState;
    });
  };

  const sendObjectToStudents = (objectData: any, sourceId: WhiteboardId) => {
    const syncPairs = {
      'teacher': { targetId: 'student1', enabled: isSyncEnabled },
      'teacher2': { targetId: 'student2', enabled: isSync2Enabled }
    };
    
    const syncConfig = syncPairs[sourceId as keyof typeof syncPairs];
    if (!syncConfig || !syncConfig.enabled) {
      console.log(`Object from ${sourceId} not synced - either not a teacher board or sync disabled`);
      return;
    }
    
    const syncEvent = new CustomEvent("teacher-update", {
      detail: {
        object: objectData,
        sourceId,
        timestamp: Date.now(),
        targetId: syncConfig.targetId
      }
    });
    
    window.dispatchEvent(syncEvent);
    console.log(`Object sent from ${sourceId} to ${syncConfig.targetId}:`, objectData);
  };

  return (
    <SyncContext.Provider value={{ isSyncEnabled, isSync2Enabled, toggleSync, toggleSync2, sendObjectToStudents }}>
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
