
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { WhiteboardObject } from './types';

export class SupabaseSync {
  // Load existing content from Supabase
  static async loadExistingContent(boardId: WhiteboardId): Promise<Record<string, any> | null> {
    try {
      console.log(`Loading existing content for board: ${boardId}`);
      
      // Handle both pairs for two-way sync
      let query;
      if (boardId === "teacher2" || boardId === "student2") {
        query = supabase
            .from('whiteboard_objects')
            .select('object_data')
            .in('board_id', ['teacher2', 'student2'])
            .order('created_at', { ascending: false })
            .limit(1);
      } else if (boardId === "teacher1" || boardId === "student1") {
        query = supabase
            .from('whiteboard_objects')
            .select('object_data')
            .in('board_id', ['teacher1', 'student1'])
            .order('created_at', { ascending: false })
            .limit(1);
      } else {
        query = supabase
            .from('whiteboard_objects')
            .select('object_data')
            .eq('board_id', boardId)
            .order('created_at', { ascending: false })
            .limit(1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching existing content:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        console.log(`Found existing content for board ${boardId}`);
        // Ensure we're handling objectData properly as a Record<string, any>
        const objectData = data[0].object_data;
        
        // Type guard to ensure objectData is a valid Record<string, any>
        if (objectData && typeof objectData === 'object' && !Array.isArray(objectData)) {
          return objectData as Record<string, any>;
        } else {
          console.error('Received invalid object data format:', objectData);
          return null;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Failed to load existing content:', err);
      return null;
    }
  }

  // Subscribe to realtime updates
  static subscribeToUpdates(
    boardId: WhiteboardId, 
    onUpdate: (data: Record<string, any>) => void, 
    onDeleteEvent: () => void
  ) {
    // Track the last received update timestamp to prevent duplicate processing
    let lastUpdateTimestamp = Date.now();
    
    // Configure the correct filter based on board ID for two-way sync
    let filter;
    if (boardId === "teacher2" || boardId === "student2") {
      filter = `board_id=in.(teacher2,student2)`;
    } else if (boardId === "teacher1" || boardId === "student1") {
      filter = `board_id=in.(teacher1,student1)`;
    } else {
      filter = `board_id=eq.${boardId}`;
    }
    
    // Set up realtime subscription for two-way sync with optimized event handling
    const channel = supabase
      .channel(`whiteboard-sync-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whiteboard_objects',
          filter: filter
        },
        (payload) => {
          const currentTimestamp = Date.now();
          
          // Ignore updates that are too close in time (likely duplicates)
          if (currentTimestamp - lastUpdateTimestamp < 100) {
            console.log(`Ignoring potential duplicate update received within 100ms for ${boardId}`);
            return;
          }
          
          lastUpdateTimestamp = currentTimestamp;
          console.log(`Received realtime ${payload.eventType} for board ${boardId}`);
          
          if (payload.eventType === 'DELETE') {
            // For delete events, reload the latest state
            onDeleteEvent();
            return;
          }
          
          if (payload.new && 'object_data' in payload.new) {
            const objectData = payload.new.object_data;
            
            // Add type guard to ensure objectData is a valid Record<string, any>
            if (objectData && typeof objectData === 'object' && !Array.isArray(objectData)) {
              // Apply the update optimistically
              onUpdate(objectData as Record<string, any>);
            } else {
              console.error('Received invalid object data format:', objectData);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Supabase channel status for ${boardId}: ${status}`);
      });
      
    return channel;
  }
}
