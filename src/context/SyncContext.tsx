
import React, { createContext, useContext, ReactNode } from "react";
import { WhiteboardId, TeacherId } from "@/types/canvas";
import { toast } from "sonner";
import { useSyncState, getBoardSyncState } from "@/hooks/useSyncState";
import { shouldShowToastForBoard, sendObjectToStudents } from "@/utils/syncUtils";
import {
  SYNC_STORAGE_KEY,
  SYNC2_STORAGE_KEY,
  SYNC3_STORAGE_KEY,
  SYNC4_STORAGE_KEY,
  SYNC5_STORAGE_KEY,
} from "@/config/syncConfig";

interface SyncContextProps {
  isSyncEnabled: boolean;
  isSync2Enabled: boolean;
  isSync3Enabled: boolean;
  isSync4Enabled: boolean;
  isSync5Enabled: boolean;
  toggleSync: () => void;
  toggleSync2: () => void;
  toggleSync3: () => void;
  toggleSync4: () => void;
  toggleSync5: () => void;
  sendObjectToStudents: (objectData: any, sourceId: WhiteboardId) => void;
}

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useSyncState({ storageKey: SYNC_STORAGE_KEY });
  const [isSync2Enabled, setIsSync2Enabled] = useSyncState({ storageKey: SYNC2_STORAGE_KEY });
  const [isSync3Enabled, setIsSync3Enabled] = useSyncState({ storageKey: SYNC3_STORAGE_KEY });
  const [isSync4Enabled, setIsSync4Enabled] = useSyncState({ storageKey: SYNC4_STORAGE_KEY });
  const [isSync5Enabled, setIsSync5Enabled] = useSyncState({ storageKey: SYNC5_STORAGE_KEY });

  const toggleSync = () => {
    setIsSyncEnabled((prev) => {
      const newState = !prev;
      if (shouldShowToastForBoard("teacher1")) {
        toast(newState ? "Sync 1 enabled" : "Sync 1 disabled");
      }
      return newState;
    });
  };

  const toggleSync2 = () => {
    setIsSync2Enabled((prev) => {
      const newState = !prev;
      if (shouldShowToastForBoard("teacher2")) {
        toast(newState ? "Sync 2 enabled" : "Sync 2 disabled");
      }
      return newState;
    });
  };

  const toggleSync3 = () => {
    setIsSync3Enabled((prev) => {
      const newState = !prev;
      if (shouldShowToastForBoard("teacher3")) {
        toast(newState ? "Sync 3 enabled" : "Sync 3 disabled");
      }
      return newState;
    });
  };

  const toggleSync4 = () => {
    setIsSync4Enabled((prev) => {
      const newState = !prev;
      if (shouldShowToastForBoard("teacher4")) {
        toast(newState ? "Sync 4 enabled" : "Sync 4 disabled");
      }
      return newState;
    });
  };

  const toggleSync5 = () => {
    setIsSync5Enabled((prev) => {
      const newState = !prev;
      if (shouldShowToastForBoard("teacher5")) {
        toast(newState ? "Sync 5 enabled" : "Sync 5 disabled");
      }
      return newState;
    });
  };

  const handleSendObjectToStudents = (objectData: any, sourceId: WhiteboardId) => {
    const syncStates = {
      'teacher1': isSyncEnabled,
      'teacher2': isSync2Enabled,
      'teacher3': isSync3Enabled,
      'teacher4': isSync4Enabled,
      'teacher5': isSync5Enabled
    };
    
    const isSyncEnabledForBoard = getBoardSyncState(sourceId as TeacherId, syncStates);
    sendObjectToStudents(objectData, sourceId, isSyncEnabledForBoard);
  };

  return (
    <SyncContext.Provider 
      value={{ 
        isSyncEnabled, 
        isSync2Enabled, 
        isSync3Enabled,
        isSync4Enabled,
        isSync5Enabled,
        toggleSync, 
        toggleSync2, 
        toggleSync3,
        toggleSync4,
        toggleSync5,
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
