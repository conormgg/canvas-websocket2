
import { useState, useEffect } from "react";
import { TeacherId } from "@/types/canvas";

interface SyncStateConfig {
  storageKey: string;
  initialValue?: boolean;
}

export const useSyncState = ({ storageKey, initialValue = false }: SyncStateConfig) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const savedSync = localStorage.getItem(storageKey);
    return savedSync ? JSON.parse(savedSync) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isEnabled));
    console.log(`Sync for ${storageKey} ${isEnabled ? "enabled" : "disabled"}`);
  }, [isEnabled, storageKey]);

  return [isEnabled, setIsEnabled] as const;
};

export const getBoardSyncState = (
  boardId: TeacherId,
  syncStates: Record<TeacherId, boolean>
): boolean => {
  return syncStates[boardId] || false;
};
