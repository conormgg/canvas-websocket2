
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardId } from '@/types/canvas';

export class SupabaseSync {
  // Track which boards have active channels to prevent multiple subscriptions
  private static activeChannels: Map<WhiteboardId, any> = new Map();
  
  // Cache the last loaded content to avoid redundant processing
  private static contentCache: Map<WhiteboardId, any> = new Map();
  
  // Track update sources to prevent loops
  private static updateSources: Map<string, number> = new Map();

  /**
   * Clear all active channels and cached content
   */
  static clearCache(): void {
    // Close and remove all active channels
    this.activeChannels.forEach((channel, boardId) => {
      console.log(`Clearing channel for ${boardId}`);
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.error(`Error removing channel for ${boardId}:`, err);
      }
    });
    
    // Clear maps
    this.activeChannels.clear();
    this.contentCache.clear();
    this.updateSources.clear();
    
    console.log('All channels and caches cleared');
  }

  /**
   * Load existing content for a given board
   */
  static async loadExistingContent(boardId: WhiteboardId): Promise<any> {
    console.log(`Loading existing content for ${boardId}`);
    
    try {
      const { data, error } = await supabase
        .from('whiteboard_objects')
        .select('object_data')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const objectData = data[0].object_data;
        
        // Cache the content to avoid redundant processing
        this.contentCache.set(boardId, JSON.stringify(objectData));
        
        console.log(`Loaded content for ${boardId}`);
        return objectData;
      }
      
      console.log(`No existing content found for ${boardId}`);
      return null;
    } catch (err) {
      console.error(`Error loading content for ${boardId}:`, err);
      return null;
    }
  }
  
  /**
   * Subscribe to updates for a given board
   */
  static subscribeToUpdates(
    boardId: WhiteboardId,
    onUpdate: (objectData: any) => void,
    onDelete: () => void
  ): any {
    // If a channel already exists for this board, remove it first
    if (this.activeChannels.has(boardId)) {
      console.log(`Removing existing channel for ${boardId}`);
      supabase.removeChannel(this.activeChannels.get(boardId));
      this.activeChannels.delete(boardId);
    }
    
    console.log(`Subscribing to updates for ${boardId}`);
    
    // Create a channel for this board
    const channel = supabase.channel(`board-${boardId}`);
    
    // Subscribe to INSERT events - updated for Supabase client v2
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'whiteboard_objects',
        filter: `board_id=eq.${boardId}`
      },
      (payload: any) => {
        console.log(`Received update for ${boardId}:`, payload);
        
        const objectData = payload.new.object_data;
        
        // Check if this is a duplicate update by comparing with cache
        const cachedContent = this.contentCache.get(boardId);
        if (cachedContent === JSON.stringify(objectData)) {
          console.log(`Skipping duplicate update for ${boardId}`);
          return;
        }
        
        // Update cache
        this.contentCache.set(boardId, JSON.stringify(objectData));
        
        // Track update source to prevent loops
        const sourceId = `update-${boardId}-${Date.now()}`;
        this.updateSources.set(sourceId, Date.now());
        
        // Clean up old sources (after 10 seconds)
        setTimeout(() => {
          this.updateSources.delete(sourceId);
        }, 10000);
        
        // Apply update
        onUpdate(objectData);
      }
    )
    // Subscribe to DELETE events - updated for Supabase client v2
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'whiteboard_objects',
        filter: `board_id=eq.${boardId}`
      },
      () => {
        console.log(`Received DELETE event for ${boardId}`);
        // Clear cache
        this.contentCache.delete(boardId);
        // Reload content
        onDelete();
      }
    );
    
    // Save the channel for future reference
    this.activeChannels.set(boardId, channel);
    
    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`Subscription status for ${boardId}: ${status}`);
    });
    
    return channel;
  }
  
  /**
   * Check if an update is from a specific source
   */
  static isUpdateFromSource(source: string): boolean {
    return this.updateSources.has(source);
  }
}
