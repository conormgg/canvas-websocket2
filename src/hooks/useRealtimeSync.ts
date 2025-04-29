
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { Canvas, FabricObject } from 'fabric';

// Define the table structure since we can't modify the auto-generated types
interface WhiteboardObject {
  board_id: string;
  object_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  id: string;
}

// Helper function to compare two canvas states
const areCanvasStatesEqual = (state1: any, state2: any): boolean => {
  if (!state1 || !state2) return false;
  // Compare objects array length as a quick check
  if (state1.objects?.length !== state2.objects?.length) return false;
  
  // For deeper comparison, we use JSON stringify but this could be optimized further
  // by implementing a more efficient diff algorithm
  return JSON.stringify(state1) === JSON.stringify(state2);
};

export const useRealtimeSync = (
  fabricRef: React.MutableRefObject<Canvas | null>,
  boardId: WhiteboardId,
  isEnabled: boolean
) => {
  const lastLoadedContentRef = useRef<Record<string, any> | null>(null);
  const pendingUpdatesRef = useRef<boolean>(false);
  
  // Apply updates optimistically
  const applyCanvasUpdate = (canvas: Canvas, objectData: Record<string, any>) => {
    // Skip if we're already processing updates or if the content is the same
    if (pendingUpdatesRef.current || areCanvasStatesEqual(lastLoadedContentRef.current, objectData)) {
      console.log('Skipping redundant update');
      return;
    }
    
    // Mark that we're processing an update
    pendingUpdatesRef.current = true;
    
    // Store the state we're loading
    lastLoadedContentRef.current = objectData;
    
    // Apply the update without blocking
    setTimeout(() => {
      try {
        canvas.loadFromJSON(objectData, () => {
          // Make all objects interactive after loading
          canvas.getObjects().forEach(obj => {
            obj.set({
              selectable: true,
              evented: true,
              hasControls: true,
              hasBorders: true
            });
          });
          canvas.renderAll();
          console.log(`Canvas updated for board ${boardId}`);
        });
      } catch (err) {
        console.error('Failed to apply canvas update:', err);
      } finally {
        // Clear the pending flag
        pendingUpdatesRef.current = false;
      }
    }, 50);
  };

  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    
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
          // Fix here - ensure we're handling objectData properly as a Record<string, any>
          const objectData = data[0].object_data;
          
          // Type guard to ensure objectData is a valid Record<string, any>
          if (objectData && typeof objectData === 'object' && !Array.isArray(objectData)) {
            // Check if the content is different from what we already have
            if (areCanvasStatesEqual(lastLoadedContentRef.current, objectData)) {
              console.log('Content is identical to what we already have, skipping update');
              return;
            }
            
            // Apply the update optimistically
            applyCanvasUpdate(canvas, objectData as Record<string, any>);
          } else {
            console.error('Received invalid object data format:', objectData);
          }
        }
      } catch (err) {
        console.error('Failed to load existing content:', err);
      }
    };
    
    loadExistingContent();

    // Set up realtime subscription for two-way sync with optimized event handling
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
            // For delete events, reload the latest state
            loadExistingContent();
            return;
          }
          
          if (payload.new && 'object_data' in payload.new) {
            const objectData = payload.new.object_data;
            
            // Add type guard to ensure objectData is a valid Record<string, any>
            if (objectData && typeof objectData === 'object' && !Array.isArray(objectData)) {
              // Apply the update optimistically
              applyCanvasUpdate(canvas, objectData as Record<string, any>);
            } else {
              console.error('Received invalid object data format:', objectData);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fabricRef, boardId]);
};
