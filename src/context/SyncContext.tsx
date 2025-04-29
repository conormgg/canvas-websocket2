
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WhiteboardId } from "@/types/canvas";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WhiteboardObject {
  board_id: string;
  object_data: any;
  created_at?: string;
  updated_at?: string;
  id?: string;
}

interface SyncContextProps {
  sendObjectToStudents: (objectData: any, sourceId: WhiteboardId) => void;
}

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  // Remove all the sync toggle state since sync is always enabled now

  const sendObjectToStudents = async (objectData: any, sourceId: WhiteboardId) => {
    const syncPairs = {
      'teacher1': { targetId: 'student1' },
      'teacher2': { targetId: 'student2' },
      'teacher3': { targetId: 'student3' },
      'teacher4': { targetId: 'student4' },
      'teacher5': { targetId: 'student5' }
    };
    
    const syncConfig = syncPairs[sourceId as keyof typeof syncPairs];
    if (!syncConfig) {
      console.log(`Object from ${sourceId} not synced - not a teacher board`);
      return;
    }

    try {
      const { error } = await (supabase
        .from('whiteboard_objects') as any)
        .insert({
          board_id: syncConfig.targetId,
          object_data: objectData
        } as WhiteboardObject);

      if (error) throw error;
      
      console.log(`Object sent from ${sourceId} to ${syncConfig.targetId}:`, objectData);
    } catch (error) {
      console.error('Error syncing whiteboard object:', error);
      toast.error('Failed to sync whiteboard object');
    }
  };

  return (
    <SyncContext.Provider 
      value={{ 
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
