
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { WhiteboardObject } from './types';

export class SupabaseSync {
  private static channelCache = new Map<string, any>();
  private static lastInsertTimestamps = new Map<string, number>();
  private static MIN_UPDATE_INTERVAL = 500; // Minimum time between updates in ms

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

  // Subscribe to realtime updates
  static subscribeToUpdates(
    boardId: WhiteboardId, 
    onUpdate: (data: Record<string, any>) => void, 
    onDeleteEvent: () => void
  ) {
    // Generate a unique channel name for this specific board and session
    const channelName = `whiteboard-sync-${boardId}-${Date.now()}`;
    
    // Check if we already have a channel for this board
    const existingChannel = this.channelCache.get(boardId);
    if (existingChannel) {
      console.log(`Using existing channel for board ${boardId}`);
      return existingChannel;
    }
    
    console.log(`Creating new subscription channel ${channelName} for board ${boardId}`);
    
    // Set up realtime subscription for two-way sync with optimized event handling
    const channel = supabase
      .channel(channelName)
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
          // Rate limit updates to prevent infinite loops
          const now = Date.now();
          const lastUpdateTime = this.lastInsertTimestamps.get(boardId) || 0;
          
          if (now - lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
            console.log(`Throttling update for board ${boardId}, too soon after last update`);
            return;
          }
          
          console.log(`Received realtime ${payload.eventType} for board ${boardId}`);
          this.lastInsertTimestamps.set(boardId, now);
          
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
      .subscribe();
    
    // Cache the channel for future use
    this.channelCache.set(boardId, channel);
      
    return channel;
  }
  
  // Helper method to clean up channel cache
  static removeChannel(boardId: WhiteboardId) {
    const channel = this.channelCache.get(boardId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channelCache.delete(boardId);
      console.log(`Removed channel for board ${boardId}`);
    }
  }
  
  // Clear all cached channels - useful for cleanup
  static removeAllChannels() {
    for (const [boardId, channel] of this.channelCache.entries()) {
      if (channel) {
        supabase.removeChannel(channel);
      }
    }
    this.channelCache.clear();
    console.log('Removed all Supabase channels');
  }
}
