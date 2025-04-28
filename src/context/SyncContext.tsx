
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId, TeacherId, StudentId } from "@/types/canvas";
import { toast } from "sonner";

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

// Define storage keys for each sync state
const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";
const SYNC2_STORAGE_KEY = "whiteboard-sync2-enabled";
const SYNC3_STORAGE_KEY = "whiteboard-sync3-enabled";
const SYNC4_STORAGE_KEY = "whiteboard-sync4-enabled";
const SYNC5_STORAGE_KEY = "whiteboard-sync5-enabled";

// Define teacher-to-student board mapping
interface SyncPair {
  teacherId: TeacherId;
  studentId: StudentId;
  storageKey: string;
}

const syncPairsConfig: SyncPair[] = [
  { teacherId: "teacher1", studentId: "student1", storageKey: SYNC_STORAGE_KEY },
  { teacherId: "teacher2", studentId: "student2", storageKey: SYNC2_STORAGE_KEY },
  { teacherId: "teacher3", studentId: "student1", storageKey: SYNC3_STORAGE_KEY },
  { teacherId: "teacher4", studentId: "student2", storageKey: SYNC4_STORAGE_KEY },
  { teacherId: "teacher5", studentId: "student1", storageKey: SYNC5_STORAGE_KEY },
];

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  // Initialize sync states from local storage
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  const [isSync2Enabled, setIsSync2Enabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC2_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  const [isSync3Enabled, setIsSync3Enabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC3_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  const [isSync4Enabled, setIsSync4Enabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC4_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  const [isSync5Enabled, setIsSync5Enabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(SYNC5_STORAGE_KEY);
    return savedSync ? JSON.parse(savedSync) : false;
  });

  // Save sync states to local storage when they change
  useEffect(() => {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(isSyncEnabled));
    console.log(`Sync 1 ${isSyncEnabled ? "enabled" : "disabled"}`);
  }, [isSyncEnabled]);

  useEffect(() => {
    localStorage.setItem(SYNC2_STORAGE_KEY, JSON.stringify(isSync2Enabled));
    console.log(`Sync 2 ${isSync2Enabled ? "enabled" : "disabled"}`);
  }, [isSync2Enabled]);

  useEffect(() => {
    localStorage.setItem(SYNC3_STORAGE_KEY, JSON.stringify(isSync3Enabled));
    console.log(`Sync 3 ${isSync3Enabled ? "enabled" : "disabled"}`);
  }, [isSync3Enabled]);

  useEffect(() => {
    localStorage.setItem(SYNC4_STORAGE_KEY, JSON.stringify(isSync4Enabled));
    console.log(`Sync 4 ${isSync4Enabled ? "enabled" : "disabled"}`);
  }, [isSync4Enabled]);

  useEffect(() => {
    localStorage.setItem(SYNC5_STORAGE_KEY, JSON.stringify(isSync5Enabled));
    console.log(`Sync 5 ${isSync5Enabled ? "enabled" : "disabled"}`);
  }, [isSync5Enabled]);

  // Toggle functions for each sync state
  const toggleSync = () => {
    setIsSyncEnabled((prev) => {
      const newState = !prev;
      toast(newState ? "Sync 1 enabled" : "Sync 1 disabled");
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

  const toggleSync3 = () => {
    setIsSync3Enabled((prev) => {
      const newState = !prev;
      toast(newState ? "Sync 3 enabled" : "Sync 3 disabled");
      return newState;
    });
  };

  const toggleSync4 = () => {
    setIsSync4Enabled((prev) => {
      const newState = !prev;
      toast(newState ? "Sync 4 enabled" : "Sync 4 disabled");
      return newState;
    });
  };

  const toggleSync5 = () => {
    setIsSync5Enabled((prev) => {
      const newState = !prev;
      toast(newState ? "Sync 5 enabled" : "Sync 5 disabled");
      return newState;
    });
  };

  // Get the current sync state for a specific teacher board
  const getBoardSyncState = (boardId: TeacherId): boolean => {
    const syncStates = {
      'teacher1': isSyncEnabled,
      'teacher2': isSync2Enabled,
      'teacher3': isSync3Enabled,
      'teacher4': isSync4Enabled,
      'teacher5': isSync5Enabled
    };
    
    return syncStates[boardId] || false;
  };

  // Send object from teacher board to student board
  const sendObjectToStudents = (objectData: any, sourceId: WhiteboardId) => {
    // Only process if it's a teacher board
    if (!sourceId.startsWith('teacher')) {
      console.log(`Object from ${sourceId} not synced - not a teacher board`);
      return;
    }
    
    // Find the matching sync pair configuration
    const syncPair = syncPairsConfig.find(pair => pair.teacherId === sourceId);
    
    if (!syncPair) {
      console.log(`No sync configuration found for ${sourceId}`);
      return;
    }
    
    // Check if sync is enabled for this teacher board
    const isSyncEnabledForBoard = getBoardSyncState(sourceId as TeacherId);
    
    if (!isSyncEnabledForBoard) {
      console.log(`Sync is disabled for ${sourceId}, not sending update`);
      return;
    }
    
    // Create and dispatch the sync event
    const syncEvent = new CustomEvent("teacher-update", {
      detail: {
        object: objectData,
        sourceId,
        timestamp: Date.now(),
        targetId: syncPair.studentId
      }
    });
    
    window.dispatchEvent(syncEvent);
    console.log(`Object sent from ${sourceId} to ${syncPair.studentId}:`, objectData);
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
        sendObjectToStudents 
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
