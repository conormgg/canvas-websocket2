
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { WhiteboardObject } from './types';

export class SupabaseSync {
  // Cache to prevent duplicate channel creation
  private static channelCache = new Map<string, any>();

  // Load existing content from Supabase
  static async loadExistingContent(boardId: WhiteboardId): Promise<Record<string, any> | null> {
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

  // Subscribe to realtime updates with protection against duplicate/infinite updates
  static subscribeToUpdates(
    boardId: WhiteboardId, 
    onUpdate: (data: Record<string, any>) => void, 
    onDeleteEvent: () => void
  ) {
    // Check if a channel for this board already exists to prevent duplicate subscriptions
    const channelKey = `whiteboard-sync-${boardId}`;
    const existingChannel = this.channelCache.get(channelKey);
    if (existingChannel) {
      console.log(`Using existing channel for board ${boardId}`);
      return existingChannel;
    }
    
    // Set up realtime subscription for two-way sync with optimized event handling
    // Fixed: Using the correct API format for the current Supabase client version
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes', 
        { 
          event: '*',
          schema: 'public',
          table: 'whiteboard_objects',
          filter: boardId === "teacher2" || boardId === "student2"
            ? `board_id=in.(teacher2,student2)`
            : `board_id=eq.${boardId}`
        },
        (payload) => {
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
        console.log(`Channel ${channelKey} status:`, status);
      });
      
    // Cache the channel for future reference
    this.channelCache.set(channelKey, channel);
    return channel;
  }

  // Clean up channel and remove from cache
  static cleanupChannel(boardId: WhiteboardId): void {
    const channelKey = `whiteboard-sync-${boardId}`;
    const channel = this.channelCache.get(channelKey);
    if (channel) {
      console.log(`Cleaning up channel for board ${boardId}`);
      supabase.removeChannel(channel);
      this.channelCache.delete(channelKey);
    }
  }
}
