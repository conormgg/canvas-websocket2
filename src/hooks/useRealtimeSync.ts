
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { Canvas } from 'fabric';

// Define the table structure since we can't modify the auto-generated types
interface WhiteboardObject {
  board_id: string;
  object_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  id: string;
}

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
        
        const { data, error } = await (supabase
          .from('whiteboard_objects') as any)
          .select('object_data')
          .eq('board_id', boardId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) {
          console.error('Error fetching existing content:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`Found existing content for board ${boardId}`);
          const objectData = data[0].object_data;
          
          // Add a small delay to ensure canvas is fully initialized
          setTimeout(() => {
            canvas.loadFromJSON(objectData as Record<string, any>, () => {
              canvas.renderAll();
              console.log('Loaded existing content for board:', boardId);
            });
          }, 100);
        } else {
          console.log(`No existing content found for board: ${boardId}`);
        }
      } catch (err) {
        console.error('Failed to load existing content:', err);
      }
    };
    
    // Load existing content on initial mount
    loadExistingContent();

    // Fix for TypeScript error - properly define the channel with correct types
    const channel = supabase
      .channel(`whiteboard-sync-${boardId}`)
      .on(
        'postgres_changes', 
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'whiteboard_objects',
          filter: `board_id=eq.${boardId}`
        },
        (payload: { new: WhiteboardObject; eventType: string }) => {
          console.log(`Received realtime ${payload.eventType} for board ${boardId}`);
          
          if (payload.eventType === 'DELETE') {
            // Handle deletion by reloading latest state
            loadExistingContent();
            return;
          }
          
          if (payload.new && 'object_data' in payload.new) {
            const objectData = payload.new.object_data;
            canvas.loadFromJSON(objectData as Record<string, any>, () => {
              // Make all objects selectable again after loading
              canvas.getObjects().forEach(obj => {
                obj.set({
                  selectable: true,
                  evented: true,
                  hasControls: true,
                  hasBorders: true
                });
              });
              
              canvas.renderAll();
              console.log('Canvas updated from realtime event');
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${boardId}: ${status}`);
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fabricRef, boardId]); // Removed isEnabled dependency to ensure real-time updates happen always
};
