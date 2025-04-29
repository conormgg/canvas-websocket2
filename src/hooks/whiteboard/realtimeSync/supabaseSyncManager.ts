
import { WhiteboardId } from "@/types/canvas";
import { ChannelManager } from "./channelManager";
import { UpdateTracker } from "./updateTracker";
import { WhiteboardDataService } from "./whiteBoardDataService";

/**
 * Manages realtime synchronization with Supabase
 */
export class SupabaseSyncManager {
  /**
   * Clear all whiteboard data from Supabase
   */
  static async clearAllWhiteboardData(): Promise<void> {
    await WhiteboardDataService.clearAllWhiteboardData();
  }

  /**
   * Load existing content from Supabase
   */
  static async loadExistingContent(boardId: WhiteboardId): Promise<Record<string, any> | null> {
    return WhiteboardDataService.loadExistingContent(boardId);
  }

  /**
   * Subscribe to realtime updates with improved infinite loop protection
   */
  static subscribeToUpdates(
    boardId: WhiteboardId, 
    onUpdate: (data: Record<string, any>) => void, 
    onDeleteEvent: () => void
  ) {
    // Generate a stable channel name - only use boardId without timestamps
    // This prevents creating multiple channels for the same board
    const channelName = ChannelManager.getChannelName(boardId);
    
    // Check if we already have a channel for this board
    const existingChannel = ChannelManager.getChannel(boardId);
    if (existingChannel) {
      // Clean up the old channel before creating a new one
      try {
        ChannelManager.removeChannel(boardId);
      } catch (err) {
        console.error('Error removing existing channel:', err);
      }
    }
    
    console.log(`Creating new subscription channel ${channelName} for board ${boardId}`);
    
    // Create and configure the channel with TypeScript compliant approach
    const channel = ChannelManager.createChannel(boardId);
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'whiteboard_objects',
        filter: boardId === "teacher2" || boardId === "student2"
          ? `board_id=in.(teacher2,student2)`
          : boardId === "teacher1" || boardId === "student1"
          ? `board_id=in.(teacher1,student1)`
          : `board_id=eq.${boardId}`
      },
      (payload: any) => {
        // Calculate a hash based on the payload to detect duplicates
        const payloadHash = JSON.stringify(payload.new || {}).slice(0, 100);
        
        // Check if this is a duplicate update
        if (UpdateTracker.isDuplicate(boardId, payloadHash)) {
          return;
        }
        
        // Check if we should throttle this update due to high frequency
        if (UpdateTracker.shouldThrottle(boardId)) {
          return;
        }
        
        console.log(`Received realtime ${payload.eventType} for board ${boardId}`);
        
        if (payload.new && 'object_data' in payload.new) {
          const objectData = payload.new.object_data;
          
          // Type guard to ensure objectData is a valid Record<string, any>
          if (objectData && typeof objectData === 'object' && !Array.isArray(objectData)) {
            // Apply the update
            onUpdate(objectData as Record<string, any>);
          } else {
            console.error('Received invalid object data format:', objectData);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'whiteboard_objects'
      },
      () => {
        onDeleteEvent();
      }
    )
    .subscribe((status: string) => {
      console.log(`Channel ${channelName} status: ${status}`);
    });
    
    // Cache the channel for future use
    ChannelManager.storeChannel(boardId, channel);
      
    return channel;
  }
  
  /**
   * Helper method to clean up channel cache
   */
  static removeChannel(boardId: WhiteboardId) {
    ChannelManager.removeChannel(boardId);
  }
  
  /**
   * Clear all cached channels - useful for cleanup
   */
  static removeAllChannels() {
    ChannelManager.removeAllChannels();
    UpdateTracker.cleanup();
  }
}
