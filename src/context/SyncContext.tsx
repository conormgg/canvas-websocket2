
import React, { createContext, useContext, ReactNode } from "react";
import { WhiteboardId, TeacherId } from "@/types/canvas";
import { toast } from "sonner";
import { useSyncState, getBoardSyncState } from "@/hooks/useSyncState";
import { shouldShowToastForBoard, sendObjectToStudents } from "@/utils/syncUtils";
import {
  SYNC_STORAGE_KEY,
  SYNC2_STORAGE_KEY,
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

  const handleSendObjectToStudents = (objectData: any, sourceId: WhiteboardId) => {
    const syncStates = {
      'teacher1': isSyncEnabled,
      'teacher2': isSync2Enabled,
    };
    
    const isSyncEnabledForBoard = getBoardSyncState(sourceId as TeacherId, syncStates);
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

