
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SyncContextType {
  isSyncEnabled: boolean;
  toggleSync: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize with sync disabled to ensure boards work independently by default
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);

  const toggleSync = () => {
    setIsSyncEnabled(prev => !prev);
    console.log("Sync toggled to:", !isSyncEnabled);
  };

  // Log when component mounts
  useEffect(() => {
    console.log("SyncProvider mounted, sync is:", isSyncEnabled ? "enabled" : "disabled");
  }, []);

  return (
    <SyncContext.Provider value={{ isSyncEnabled, toggleSync }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
