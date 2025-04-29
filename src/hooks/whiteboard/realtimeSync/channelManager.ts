
import { supabase } from "@/integrations/supabase/client";
import { WhiteboardId } from "@/types/canvas";
import { RealtimeChannelConfig } from "./types";

/**
 * Manages Supabase realtime channels for whiteboard sync
 */
export class ChannelManager {
  private static channelCache = new Map<string, any>();
  private static MIN_CLEANUP_INTERVAL = 60000; // 1 minute
  private static lastCleanupTime = 0;
  
  /**
   * Generate a stable channel name based on boardId
   */
  static getChannelName(boardId: WhiteboardId): string {
    return `whiteboard-sync-${boardId}`;
  }
  
  /**
   * Create a new Supabase channel
   */
  static createChannel(boardId: WhiteboardId): any {
    const channelName = this.getChannelName(boardId);
    return supabase.channel(channelName);
  }
  
  /**
   * Store channel in cache
   */
  static storeChannel(boardId: WhiteboardId, channel: any): void {
    this.channelCache.set(boardId, channel);
    console.log(`Stored channel for board ${boardId}`);
  }
  
  /**
   * Get channel from cache
   */
  static getChannel(boardId: WhiteboardId): any | null {
    return this.channelCache.get(boardId) || null;
  }
  
  /**
   * Remove channel for a specific board
   */
  static removeChannel(boardId: WhiteboardId): void {
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
  
  /**
   * Clean up all channels
   */
  static removeAllChannels(): void {
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
    console.log('Removed all Supabase channels');
  }
  
  /**
   * Periodic cleanup of unused channels to prevent leaks
   */
  static periodicCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanupTime > this.MIN_CLEANUP_INTERVAL) {
      // In the future, we could implement logic to remove inactive channels
      this.lastCleanupTime = now;
    }
  }
}
