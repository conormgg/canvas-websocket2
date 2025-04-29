
import { WhiteboardId } from '@/types/canvas';
import { SupabaseSyncManager } from './realtimeSync/supabaseSyncManager';

/**
 * Main class for Supabase synchronization, now acting as a facade for the refactored logic
 */
export class SupabaseSync {
  /**
   * Clear database of all whiteboard drawings
   */
  static async clearAllWhiteboardData(): Promise<void> {
    return SupabaseSyncManager.clearAllWhiteboardData();
  }

  /**
   * Load existing content from Supabase
   */
  static async loadExistingContent(boardId: WhiteboardId): Promise<Record<string, any> | null> {
    return SupabaseSyncManager.loadExistingContent(boardId);
  }

  /**
   * Helper method to get a stable channel name based on boardId
   */
  private static getChannelName(boardId: WhiteboardId): string {
    return `whiteboard-sync-${boardId}`;
  }

  /**
   * Subscribe to realtime updates with improved infinite loop protection
   */
  static subscribeToUpdates(
    boardId: WhiteboardId, 
    onUpdate: (data: Record<string, any>) => void, 
    onDeleteEvent: () => void
  ) {
    return SupabaseSyncManager.subscribeToUpdates(boardId, onUpdate, onDeleteEvent);
  }
  
  /**
   * Helper method to clean up channel cache
   */
  static removeChannel(boardId: WhiteboardId) {
    SupabaseSyncManager.removeChannel(boardId);
  }
  
  /**
   * Clear all cached channels - useful for cleanup
   */
  static removeAllChannels() {
    SupabaseSyncManager.removeAllChannels();
  }
}
