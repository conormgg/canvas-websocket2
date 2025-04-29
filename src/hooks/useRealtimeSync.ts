
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { Canvas } from 'fabric';
import { CanvasUpdateManager } from './whiteboard/realtimeSync/canvasUpdateManager';
import { SupabaseSync } from './whiteboard/supabaseSync';

export const useRealtimeSync = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  boardId: WhiteboardId,
  isEnabled: boolean
) => {
  const canvasUpdateManager = useRef<CanvasUpdateManager>(new CanvasUpdateManager());
  const isInitialLoad = useRef<boolean>(true);
  const cleanupRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const channelRef = useRef<any>(null); // Track the channel for cleanup
  
  // Make sure we clear all drawings from database when requested
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearDatabase') === 'true') {
      console.log('Clear database parameter detected, clearing all drawings');
      SupabaseSync.clearAllWhiteboardData();
      urlParams.delete('clearDatabase');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);
  
  // Use useEffect cleanup to properly remove listeners
  useEffect(() => {
    mountedRef.current = true;
    cleanupRef.current = false;
    
    return () => {
      mountedRef.current = false;
      cleanupRef.current = true;
      
      if (canvasUpdateManager.current) {
        canvasUpdateManager.current.cleanup();
      }
      
      SupabaseSync.removeChannel(boardId);
      
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.error(`Error removing channel from ref for board ${boardId}:`, err);
        }
        channelRef.current = null;
      }
    };
  }, [boardId]);
  
  useEffect(() => {
    if (!fabricRef.current || cleanupRef.current || !mountedRef.current) return;

    const canvas = fabricRef.current;
    
    // Clear any cached channel data to ensure fresh connection
    const cacheKey = `supabase-channel-whiteboard-sync-${boardId}`;
    sessionStorage.removeItem(cacheKey);
    
    const handleCanvasUpdate = (objectData: Record<string, any>) => {
      if (!canvas || !objectData || cleanupRef.current || !mountedRef.current) return;
      
      console.log(`Applying update to canvas ${boardId}`);
      canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData);
    };
    
    const loadContentDebounced = (() => {
      let timeout: number | null = null;
      
      return () => {
        if (cleanupRef.current || !mountedRef.current) return;
        
        if (timeout !== null) {
          window.clearTimeout(timeout);
        }
        
        timeout = window.setTimeout(async () => {
          if (cleanupRef.current || !mountedRef.current) return;
          
          console.log(`Loading content for board ${boardId}`);
          const objectData = await SupabaseSync.loadExistingContent(boardId);
          if (objectData && mountedRef.current && !cleanupRef.current) {
            handleCanvasUpdate(objectData);
          }
          
          isInitialLoad.current = false;
          timeout = null;
        }, isInitialLoad.current ? 300 : 800);
      };
    })();
    
    // Load content immediately on mount
    loadContentDebounced();

    // Create subscription with a slight delay to avoid race conditions
    const subscribeTimer = setTimeout(() => {
      if (!cleanupRef.current && mountedRef.current) {
        console.log(`Creating subscription for ${boardId}`);
        const channel = SupabaseSync.subscribeToUpdates(
          boardId,
          handleCanvasUpdate,
          loadContentDebounced
        );
        
        channelRef.current = channel;
      }
    }, 800);

    return () => {
      clearTimeout(subscribeTimer);
      
      if (canvasUpdateManager.current) {
        canvasUpdateManager.current.cleanup();
      }
      
      SupabaseSync.removeChannel(boardId);
      
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.error(`Error removing channel for board ${boardId}:`, err);
        }
        channelRef.current = null;
      }
      
      isInitialLoad.current = true;
    };
  }, [fabricRef, boardId]);
  
  return {
    clearAllDrawings: SupabaseSync.clearAllWhiteboardData
  };
};
