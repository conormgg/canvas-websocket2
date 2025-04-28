
import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { WhiteboardId, TeacherId } from "@/types/canvas";
import { toast } from "sonner";
import { useSyncState, getBoardSyncState } from "@/hooks/useSyncState";
import { shouldShowToastForBoard, sendObjectToStudents } from "@/utils/syncUtils";
import {
  SYNC_STORAGE_KEY,
  SYNC2_STORAGE_KEY,
  syncPairsConfig
} from "@/config/syncConfig";

interface SyncContextProps {
  isSyncEnabled: boolean;
  isSync2Enabled: boolean;
  toggleSync: () => void;
  toggleSync2: () => void;
  sendObjectToStudents: (objectData: any, sourceId: WhiteboardId) => void;
}

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useSyncState({ storageKey: SYNC_STORAGE_KEY });
  const [isSync2Enabled, setIsSync2Enabled] = useSyncState({ storageKey: SYNC2_STORAGE_KEY });

  // Debug sync states on provider initialization
  useEffect(() => {
    console.log("SyncProvider initialized with sync states:", {
      "teacher1->student1": isSyncEnabled,
      "teacher2->student2": isSync2Enabled
    });
    
    // Check localStorage directly to verify
    try {
      const sync1State = localStorage.getItem(SYNC_STORAGE_KEY);
      const sync2State = localStorage.getItem(SYNC2_STORAGE_KEY);
      console.log("localStorage sync states:", {
        [SYNC_STORAGE_KEY]: sync1State ? JSON.parse(sync1State) : false,
        [SYNC2_STORAGE_KEY]: sync2State ? JSON.parse(sync2State) : false
      });
    } catch (err) {
      console.error("Error reading sync states from localStorage:", err);
    }
  }, [isSyncEnabled, isSync2Enabled]);

  const toggleSync = () => {
    setIsSyncEnabled((prev) => {
      const newState = !prev;
      if (shouldShowToastForBoard("teacher1")) {
        toast(newState ? "Sync 1 enabled" : "Sync 1 disabled");
      }
      console.log(`Sync 1 (teacher1->student1) ${newState ? 'enabled' : 'disabled'}`);
      return newState;
    });
  };

  const toggleSync2 = () => {
    setIsSync2Enabled((prev) => {
      const newState = !prev;
      if (shouldShowToastForBoard("teacher2")) {
        toast(newState ? "Sync 2 enabled" : "Sync 2 disabled");
      }
      console.log(`Sync 2 (teacher2->student2) ${newState ? 'enabled' : 'disabled'}`);
      return newState;
    });
  };

  const handleSendObjectToStudents = (objectData: any, sourceId: WhiteboardId) => {
    // Create a complete map of all possible teacher IDs to their sync states
    const syncStates: Record<TeacherId, boolean> = {
      'teacher1': isSyncEnabled,
      'teacher2': isSync2Enabled,
      'teacher3': false,
      'teacher4': false,
      'teacher5': false
    };
    
    const isSyncEnabledForBoard = getBoardSyncState(sourceId as TeacherId, syncStates);
    console.log(`Sending object from ${sourceId}, sync enabled: ${isSyncEnabledForBoard}`);
    sendObjectToStudents(objectData, sourceId, isSyncEnabledForBoard);
  };

  return (
    <SyncContext.Provider 
      value={{ 
        isSyncEnabled, 
        isSync2Enabled,
        toggleSync, 
        toggleSync2,
        sendObjectToStudents: handleSendObjectToStudents
      }}
    >
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
