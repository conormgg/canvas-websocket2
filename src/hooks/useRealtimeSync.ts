
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { Canvas } from 'fabric';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export const useRealtimeSync = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  boardId: WhiteboardId,
  isEnabled: boolean
) => {
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    
    // Function to load existing content for the board
    const loadExistingContent = async () => {
      try {
        console.log(`Loading existing content for board: ${boardId}`);
        
        const { data, error } = await supabase
          .from('whiteboard_objects')
          .select('object_data')
          .eq('board_id', boardId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) {
          console.error('Error fetching existing content:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`Found existing content for board ${boardId}:`, data[0]);
          // Properly handle the Json type by converting to a string if needed
          const objectData = data[0].object_data;
          canvas.loadFromJSON(objectData as Record<string, any>, () => {
            canvas.renderAll();
            console.log('Loaded existing content for board:', boardId);
          });
        } else {
          console.log(`No existing content found for board: ${boardId}`);
        }
      } catch (err) {
        console.error('Failed to load existing content:', err);
      }
    };
    
    // Load existing content on initial mount
    loadExistingContent();

    // Only set up realtime subscription if enabled
    if (!isEnabled) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel('whiteboard-sync-' + boardId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whiteboard_objects',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => {
          if (payload.new && 'object_data' in payload.new) {
            console.log(`Received realtime update for board ${boardId}:`, payload);
            const objectData = payload.new.object_data;
            canvas.loadFromJSON(objectData as Record<string, any>, () => {
              canvas.renderAll();
              console.log('Canvas updated from realtime event');
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fabricRef, boardId, isEnabled]);
};
