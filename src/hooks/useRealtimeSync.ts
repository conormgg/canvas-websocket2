
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
  const isProcessingUpdate = useRef<boolean>(false);
  const channelRef = useRef<any>(null);
  
  useEffect(() => {
    if (!fabricRef.current || !isEnabled) return;

    const canvas = fabricRef.current;
    
    // Helper function to apply canvas updates with protection against reentrant calls
    const handleCanvasUpdate = (objectData: Record<string, any>) => {
      if (isProcessingUpdate.current) {
        console.log(`Skipping update for ${boardId} - already processing an update`);
        return;
      }
      
      if (canvas) {
        try {
          isProcessingUpdate.current = true;
          canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData);
        } finally {
          // Always reset the processing flag even if an error occurs
          isProcessingUpdate.current = false;
        }
      }
    };
    
    // Load existing content from Supabase
    const loadContent = async () => {
      if (isProcessingUpdate.current) {
        console.log(`Skipping content load for ${boardId} - already processing`);
        return;
      }
      
      try {
        isProcessingUpdate.current = true;
        const objectData = await SupabaseSync.loadExistingContent(boardId);
        if (objectData) {
          canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData);
        }
      } catch (err) {
        console.error(`Error loading content for ${boardId}:`, err);
      } finally {
        isProcessingUpdate.current = false;
      }
    };
    
    loadContent();

    // Subscribe to realtime updates from Supabase with safeguard against double subscription
    if (channelRef.current) {
      console.log(`Cleaning up previous channel for ${boardId}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    channelRef.current = SupabaseSync.subscribeToUpdates(
      boardId,
      handleCanvasUpdate,
      loadContent // Reload content on DELETE events
    );

    return () => {
      if (channelRef.current) {
        console.log(`Cleaning up channel for ${boardId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fabricRef, boardId, isEnabled]); // Add isEnabled as dependency to properly handle toggling
};
