
import React, { createContext, useContext, useState, ReactNode } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";

interface SyncContextProps {
  isSyncEnabled: boolean;
  toggleSync: () => void;
  sendObjectToStudents: (objectData: any) => void;
}

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(false);

  const toggleSync = () => {
    setIsSyncEnabled((prev) => {
      const newState = !prev;
      toast(newState ? "Sync enabled" : "Sync disabled");
      console.log(`Sync ${newState ? "enabled" : "disabled"}`);
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
