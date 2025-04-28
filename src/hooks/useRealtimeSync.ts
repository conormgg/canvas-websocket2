
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

    // Subscribe to realtime updates
    const channel = supabase
      .channel('whiteboard-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whiteboard_objects',
          filter: `board_id=student${boardId.charAt(boardId.length - 1)}`
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
