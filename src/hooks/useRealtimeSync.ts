
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
  
  // Use useEffect cleanup to properly remove listeners
  useEffect(() => {
    return () => {
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
    if (!fabricRef.current || !isEnabled || cleanupRef.current) return;

    const canvas = fabricRef.current;
    let channel: any = null;
    
    // Helper function to apply canvas updates
    const handleCanvasUpdate = (objectData: Record<string, any>) => {
      if (canvas && objectData && !cleanupRef.current) {
        canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData);
      }
    };
    
    // Load existing content from Supabase
    const loadContent = async () => {
      if (cleanupRef.current) return;
      
      if (isInitialLoad.current) {
        console.log(`Initial load of content for board ${boardId}`);
        const objectData = await SupabaseSync.loadExistingContent(boardId);
        if (objectData) {
          handleCanvasUpdate(objectData);
        }
        isInitialLoad.current = false;
      } else {
        console.log(`Reload of content for board ${boardId} (not initial)`);
        const objectData = await SupabaseSync.loadExistingContent(boardId);
        if (objectData) {
          handleCanvasUpdate(objectData);
        }
      }
    };
    
    // Initial load
    loadContent();

    // Subscribe to realtime updates with a short delay to prevent duplicate updates
    const subscribeTimer = setTimeout(() => {
      if (!cleanupRef.current) {
        channel = SupabaseSync.subscribeToUpdates(
          boardId,
          handleCanvasUpdate,
          loadContent // Reload content on DELETE events
        );
      }
    }, 300);

    return () => {
      clearTimeout(subscribeTimer);
      
      // Clean up resources
      if (canvasUpdateManager.current) {
        canvasUpdateManager.current.cleanup();
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
      isInitialLoad.current = true;
    };
  }, [fabricRef, boardId, isEnabled]);
};
