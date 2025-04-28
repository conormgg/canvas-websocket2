
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
    let lastLoadedContent: string | null = null;
    
    const loadExistingContent = async () => {
      try {
        console.log(`Loading existing content for board: ${boardId}`);
        
        // For board 2, check both teacher2 and student2 content
        const query = (boardId === "teacher2" || boardId === "student2") 
          ? supabase
              .from('whiteboard_objects')
              .select('object_data')
              .in('board_id', ['teacher2', 'student2'])
              .order('created_at', { ascending: false })
              .limit(1)
          : supabase
              .from('whiteboard_objects')
              .select('object_data')
              .eq('board_id', boardId)
              .order('created_at', { ascending: false })
              .limit(1);
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching existing content:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`Found existing content for board ${boardId}`);
          const objectData = data[0].object_data;
          
          // Check if the content is different from what we already loaded
          const contentString = JSON.stringify(objectData);
          if (contentString === lastLoadedContent) {
            console.log('Content is the same as already loaded, skipping update');
            return;
          }
          
          // Store the loaded content for future comparison
          lastLoadedContent = contentString;
          
          setTimeout(() => {
            canvas.loadFromJSON(objectData as Record<string, any>, () => {
              canvas.getObjects().forEach(obj => {
                obj.set({
                  selectable: true,
                  evented: true,
                  hasControls: true,
                  hasBorders: true
                });
              });
              canvas.renderAll();
              console.log('Loaded existing content for board:', boardId);
            });
          }, 100);
        }
      } catch (err) {
        console.error('Failed to load existing content:', err);
      }
    };
    
    loadExistingContent();

    // Set up realtime subscription for two-way sync
    const channel = supabase
      .channel(`whiteboard-sync-${boardId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'whiteboard_objects',
          filter: boardId === "teacher2" || boardId === "student2"
            ? `board_id=in.(teacher2,student2)`
            : `board_id=eq.${boardId}`
        },
        (payload: { new: WhiteboardObject; eventType: string }) => {
          console.log(`Received realtime ${payload.eventType} for board ${boardId}`);
          
          if (payload.eventType === 'DELETE') {
            // For delete events, we don't clear the board but reload latest state
            loadExistingContent();
            return;
          }
          
          if (payload.new && 'object_data' in payload.new) {
            const objectData = payload.new.object_data;
            
            // Check if the content is different from what we already loaded
            const contentString = JSON.stringify(objectData);
            if (contentString === lastLoadedContent) {
              console.log('Content is the same as already loaded, skipping update');
              return;
            }
            
            // Store the loaded content for future comparison
            lastLoadedContent = contentString;
            
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fabricRef, boardId]);
};
