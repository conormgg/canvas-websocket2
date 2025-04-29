
import { useEffect, useRef } from 'react';
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
    
    return () => {
      mountedRef.current = false;
      cleanupRef.current = true;
      
      // Clean up the update manager
      if (canvasUpdateManager.current) {
        canvasUpdateManager.current.cleanup();
      }
      
      // Remove the Supabase channel for this board
      SupabaseSync.removeChannel(boardId);
    };
  }, [boardId]);
  
  useEffect(() => {
    if (!fabricRef.current || !isEnabled || cleanupRef.current || !mountedRef.current) return;

    const canvas = fabricRef.current;
    let channel: any = null;
    const boardSessionId = `${boardId}-${Date.now()}`;
    
    // Helper function to apply canvas updates
    const handleCanvasUpdate = (objectData: Record<string, any>) => {
      if (!canvas || !objectData || cleanupRef.current || !mountedRef.current) return;
      
      canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData);
    };
    
    // Load existing content from Supabase
    const loadContent = async () => {
      if (cleanupRef.current || !mountedRef.current) return;
      
      if (isInitialLoad.current) {
        console.log(`Initial load of content for board ${boardId}`);
        const objectData = await SupabaseSync.loadExistingContent(boardId);
        if (objectData && mountedRef.current) {
          handleCanvasUpdate(objectData);
        }
        isInitialLoad.current = false;
      } else {
        console.log(`Reload of content for board ${boardId} (not initial)`);
        const objectData = await SupabaseSync.loadExistingContent(boardId);
        if (objectData && mountedRef.current) {
          handleCanvasUpdate(objectData);
        }
      }
    };
    
    // Initial load
    loadContent();

    // Subscribe to realtime updates with a longer delay to prevent duplicate updates
    const subscribeTimer = setTimeout(() => {
      if (!cleanupRef.current && mountedRef.current) {
        channel = SupabaseSync.subscribeToUpdates(
          boardId,
          handleCanvasUpdate,
          loadContent // Reload content on DELETE events
        );
      }
    }, 500);

    return () => {
      clearTimeout(subscribeTimer);
      
      // Clean up resources
      if (canvasUpdateManager.current) {
        canvasUpdateManager.current.cleanup();
      }
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error(`Error removing channel for board ${boardId}:`, err);
        }
      }
      isInitialLoad.current = true;
    };
  }, [fabricRef, boardId, isEnabled]);
  
  // For debugging/maintenance - expose a method to clear all drawings
  return {
    clearAllDrawings: SupabaseSync.clearAllWhiteboardData
  };
};
