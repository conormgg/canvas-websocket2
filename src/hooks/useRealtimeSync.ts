
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
  
  useEffect(() => {
    if (!fabricRef.current || !isEnabled) return;

    const canvas = fabricRef.current;
    
    // Helper function to apply canvas updates
    const handleCanvasUpdate = (objectData: Record<string, any>) => {
      if (canvas) {
        canvasUpdateManager.current.applyCanvasUpdate(canvas, objectData);
      }
    };
    
    // Load existing content from Supabase
    const loadContent = async () => {
      const objectData = await SupabaseSync.loadExistingContent(boardId);
      if (objectData) {
        handleCanvasUpdate(objectData);
      }
    };
    
    loadContent();

    // Subscribe to realtime updates from Supabase
    const channel = SupabaseSync.subscribeToUpdates(
      boardId,
      handleCanvasUpdate,
      loadContent // Reload content on DELETE events
    );

    return () => {
      // Clean up resources
      if (canvasUpdateManager.current) {
        canvasUpdateManager.current.cleanup();
      }
      supabase.removeChannel(channel);
    };
  }, [fabricRef, boardId, isEnabled]);
};
