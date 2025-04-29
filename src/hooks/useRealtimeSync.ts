
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
      
      // Apply a short timeout to prevent rapid simultaneous updates
      setTimeout(() => {
        if (canvas) {
          try {
            isProcessingUpdate.current = true;
            
            // Pass source information to track update origin and prevent loops
            canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData, `realtime-${boardId}`);
            
            // Reset processing flag after a short delay
            setTimeout(() => {
              isProcessingUpdate.current = false;
            }, 150); // Delay to ensure any triggered events complete
          } catch (err) {
            console.error(`Error applying update to ${boardId}:`, err);
            isProcessingUpdate.current = false;
          }
        }
      }, 50);
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
          // Mark as an initial load to prevent re-syncing
          canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData, `initial-load-${boardId}`);
        }
      } catch (err) {
        console.error(`Error loading content for ${boardId}:`, err);
      } finally {
        // Reset with delay to prevent rapid retriggering
        setTimeout(() => {
          isProcessingUpdate.current = false;
        }, 150);
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
