
import React, { createContext, useContext, useState } from 'react';

interface SyncContextType {
  isSyncEnabled: boolean;
  toggleSync: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);

  const toggleSync = () => {
    setIsSyncEnabled(prev => !prev);
  };

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

