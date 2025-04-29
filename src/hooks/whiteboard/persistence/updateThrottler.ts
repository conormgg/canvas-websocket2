
import { useCallback, useRef } from 'react';
import { Canvas } from 'fabric';

export interface UpdateThrottlingState {
  lastUpdateTimeRef: React.MutableRefObject<number>;
  updateQueueRef: React.MutableRefObject<boolean>;
  mountedRef: React.MutableRefObject<boolean>;
  pendingModificationsRef: React.MutableRefObject<boolean>;
}

export interface ThrottleConfig {
  minUpdateInterval: number;
}

export const useUpdateThrottling = (config: ThrottleConfig) => {
  const lastUpdateTimeRef = useRef<number>(0);
  const updateQueueRef = useRef<boolean>(false);
  const pendingModificationsRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  
  const shouldThrottleUpdate = useCallback((): boolean => {
    const now = Date.now();
    return now - lastUpdateTimeRef.current < config.minUpdateInterval;
  }, [config.minUpdateInterval]);
  
  const scheduleUpdate = useCallback((
    callback: () => void, 
    fabricRef: React.MutableRefObject<Canvas | null>
  ) => {
    if (!mountedRef.current) return;
    
    if (!updateQueueRef.current) {
      // Schedule a save for later if we're throttling
      updateQueueRef.current = true;
      pendingModificationsRef.current = true;
      setTimeout(() => {
        if (mountedRef.current && fabricRef.current && pendingModificationsRef.current) {
          callback();
          updateQueueRef.current = false;
          pendingModificationsRef.current = false;
        }
      }, config.minUpdateInterval);
    }
  }, [config.minUpdateInterval]);
  
  const recordUpdate = useCallback(() => {
    lastUpdateTimeRef.current = Date.now();
    pendingModificationsRef.current = false;
  }, []);
  
  return {
    lastUpdateTimeRef,
    updateQueueRef,
    pendingModificationsRef,
    mountedRef,
    shouldThrottleUpdate,
    scheduleUpdate,
    recordUpdate
  };
};
