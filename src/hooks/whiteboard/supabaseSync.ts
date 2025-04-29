
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';
import { WhiteboardObject } from './types';

export class SupabaseSync {
  private static channelCache = new Map<string, any>();
  private static lastInsertTimestamps = new Map<string, number>();
  private static MIN_UPDATE_INTERVAL = 1000; // Increased to prevent update storms
  private static updateCounts = new Map<string, number>();
  private static resetCountsInterval: number | null = null;
  private static latestUpdateHashes = new Map<string, string>(); // Track the latest update hash per board

  // Static initialization
  static {
    // Reset update counts every minute to prevent permanent throttling
    SupabaseSync.resetCountsInterval = window.setInterval(() => {
      SupabaseSync.updateCounts.clear();
    }, 60000);
  }

  // Clear database of all whiteboard drawings
  static async clearAllWhiteboardData(): Promise<void> {
    try {
      console.log('Clearing all whiteboard data from database');
      const { error } = await supabase
        .from('whiteboard_objects')
        .delete()
        .neq('id', 'placeholder'); // Delete all records
      
      if (error) {
        console.error('Error clearing whiteboard data:', error);
        return;
      }
      
      console.log('All whiteboard data cleared successfully');
    } catch (err) {
      console.error('Failed to clear whiteboard data:', err);
    }
  }

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

  // Generate a stable channel name based on boardId
  private static getChannelName(boardId: WhiteboardId): string {
    return `whiteboard-sync-${boardId}`;
  }

  // Subscribe to realtime updates with improved infinite loop protection
  static subscribeToUpdates(
    boardId: WhiteboardId, 
    onUpdate: (data: Record<string, any>) => void, 
    onDeleteEvent: () => void
  ) {
    // Generate a more stable channel name - only use boardId without timestamps
    // This prevents creating multiple channels for the same board
    const channelName = this.getChannelName(boardId);
    
    // Check if we already have a channel for this board
    if (this.channelCache.has(boardId)) {
      // Clean up the old channel before creating a new one
      const existingChannel = this.channelCache.get(boardId);
      if (existingChannel) {
        try {
          supabase.removeChannel(existingChannel);
        } catch (err) {
          console.error('Error removing existing channel:', err);
        }
        this.channelCache.delete(boardId);
      }
    }
    
    console.log(`Creating new subscription channel ${channelName} for board ${boardId}`);
    
    // Fixed: TypeScript compliant usage of Supabase channel API
    const channel = supabase
      .channel(channelName)
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
          // Calculate a hash based on the payload to detect duplicates
          const payloadHash = JSON.stringify(payload.new || {}).slice(0, 100);
          const lastHash = this.latestUpdateHashes.get(boardId);
          
          // If this is the same as the last update we processed, skip it
          if (lastHash === payloadHash) {
            console.log(`Skipping duplicate update for board ${boardId}`);
            return;
          }
          
          // Store this hash for future duplicate detection
          this.latestUpdateHashes.set(boardId, payloadHash);
          
          // Implement rate limiting to prevent infinite loops
          const now = Date.now();
          const lastUpdateTime = this.lastInsertTimestamps.get(boardId) || 0;
          
          // Update the count of updates for this board
          const currentCount = this.updateCounts.get(boardId) || 0;
          this.updateCounts.set(boardId, currentCount + 1);
          
          // If we're getting too many updates in a short time, it might be an infinite loop
          if (currentCount > 30) { // Lowered threshold - more than 30 updates per minute might indicate a loop
            console.warn(`Possible infinite loop detected for board ${boardId}, throttling updates`);
            
            // Only process 1 in 10 updates until the counter resets (more aggressive throttling)
            if (currentCount % 10 !== 0) {
              return;
            }
          }
          
          // Basic rate limiting - more aggressive to prevent storms
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
            
            // Type guard to ensure objectData is a valid Record<string, any>
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
        console.log(`Channel ${channelName} status: ${status}`);
      });
    
    // Cache the channel for future use
    this.channelCache.set(boardId, channel);
      
    return channel;
  }
  
  // Helper method to clean up channel cache
  static removeChannel(boardId: WhiteboardId) {
    const channel = this.channelCache.get(boardId);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.error(`Error removing channel for board ${boardId}:`, err);
      }
      this.channelCache.delete(boardId);
      console.log(`Removed channel for board ${boardId}`);
    }
  }
  
  // Clear all cached channels - useful for cleanup
  static removeAllChannels() {
    for (const [boardId, channel] of this.channelCache.entries()) {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error(`Error removing channel for board ${boardId}:`, err);
        }
      }
    }
    this.channelCache.clear();
    
    // Also clear the interval that resets update counts
    if (this.resetCountsInterval) {
      clearInterval(this.resetCountsInterval);
      this.resetCountsInterval = null;
    }
    
    console.log('Removed all Supabase channels');
  }
}
