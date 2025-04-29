
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { Canvas } from 'fabric';
import { CanvasUpdateManager } from './whiteboard/canvasUpdateManager';
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
    // This will run only once when the component is mounted
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearDatabase') === 'true') {
      console.log('Clear database parameter detected, clearing all drawings');
      SupabaseSync.clearAllWhiteboardData();
      // Remove the query parameter to prevent repeated clearing
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
      
      // Clean up the update manager
      if (canvasUpdateManager.current) {
        canvasUpdateManager.current.cleanup();
      }
      
      // Remove the Supabase channel for this board
      SupabaseSync.removeChannel(boardId);
      
      // Also clean up the local channel reference
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
    if (!fabricRef.current || !isEnabled || cleanupRef.current || !mountedRef.current) return;

    const canvas = fabricRef.current;
    const boardSessionId = `${boardId}-${Date.now()}`;
    
    // Helper function to apply canvas updates
    const handleCanvasUpdate = (objectData: Record<string, any>) => {
      if (!canvas || !objectData || cleanupRef.current || !mountedRef.current) return;
      
      canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData);
    };
    
    // Load existing content from Supabase - with debounce to prevent rapid reloads
    const loadContentDebounced = (() => {
      let timeout: number | null = null;
      
      return () => {
        if (cleanupRef.current || !mountedRef.current) return;
        
        // Clear any pending load
        if (timeout !== null) {
          window.clearTimeout(timeout);
        }
        
        // Schedule a new load with a delay
        timeout = window.setTimeout(async () => {
          if (cleanupRef.current || !mountedRef.current) return;
          
          console.log(`Loading content for board ${boardId}`);
          const objectData = await SupabaseSync.loadExistingContent(boardId);
          if (objectData && mountedRef.current && !cleanupRef.current) {
            handleCanvasUpdate(objectData);
          }
          
          isInitialLoad.current = false;
          timeout = null;
        }, isInitialLoad.current ? 300 : 800); // Longer delay for non-initial loads
      };
    })();
    
    // Initial load
    loadContentDebounced();

    // Subscribe to realtime updates with a longer delay to prevent duplicate updates
    const subscribeTimer = setTimeout(() => {
      if (!cleanupRef.current && mountedRef.current) {
        // Store the channel in the ref for proper cleanup
        const channel = SupabaseSync.subscribeToUpdates(
          boardId,
          handleCanvasUpdate,
          loadContentDebounced // Debounced reload content on DELETE events
        );
        
        channelRef.current = channel;
      }
    }, 800); // Increased delay

    return () => {
      clearTimeout(subscribeTimer);
      
      // Clean up resources
      if (canvasUpdateManager.current) {
        canvasUpdateManager.current.cleanup();
      }
      
      // Remove channel using both our static method and local ref
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
  }, [fabricRef, boardId, isEnabled]);
  
  // For debugging/maintenance - expose a method to clear all drawings
  return {
    clearAllDrawings: SupabaseSync.clearAllWhiteboardData
  };
};
