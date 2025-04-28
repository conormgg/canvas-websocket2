
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { Canvas } from 'fabric';
import { toast } from 'sonner';

export const useRealtimeSync = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  boardId: WhiteboardId,
  isEnabled: boolean
) => {
  useEffect(() => {
    if (!isEnabled || !fabricRef.current) return;

    const canvas = fabricRef.current;
    
    // For student boards, subscribe to changes from the corresponding teacher board
    const teacherBoardId = boardId.replace('student', 'teacher');
    
    // Function to load existing content for the board
    const loadExistingContent = async () => {
      try {
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
          canvas.loadFromJSON(data[0].object_data, () => {
            canvas.renderAll();
            console.log('Loaded existing content for board:', boardId);
          });
        }
      } catch (err) {
        console.error('Failed to load existing content:', err);
      }
    };
    
    // Load existing content first
    loadExistingContent();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('whiteboard-sync')
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
            const objectData = payload.new.object_data;
            canvas.loadFromJSON(objectData, () => {
              canvas.renderAll();
              console.log('Canvas updated from realtime event:', payload);
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
