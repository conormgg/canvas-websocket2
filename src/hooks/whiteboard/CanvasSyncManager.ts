
import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { WhiteboardObject } from './persistenceTypes';
import { useSyncContext } from '@/context/SyncContext';
import { toast } from 'sonner';

/**
 * Manages synchronization between teacher and student boards
 */
export class CanvasSyncManager {
  private syncCooldowns: Map<string, number> = new Map();
  private readonly SYNC_COOLDOWN_MS = 500;
  
  /**
   * Synchronize content from one board to another
   */
  async syncBoards(
    fromBoardId: WhiteboardId, 
    toBoardId: WhiteboardId, 
    objectData: any
  ): Promise<boolean> {
    const syncKey = `${fromBoardId}-${toBoardId}`;
    
    // Prevent rapid sync operations
    if (this.isInCooldown(syncKey)) {
      console.log(`Sync operation in cooldown: ${syncKey}`);
      return false;
    }
    
    this.setCooldown(syncKey);
    
    try {
      console.log(`Syncing from ${fromBoardId} to ${toBoardId}`);
      
      const { error } = await supabase
        .from('whiteboard_objects')
        .insert({
          board_id: toBoardId,
          object_data: objectData
        } as WhiteboardObject);
      
      if (error) {
        console.error(`Failed to sync from ${fromBoardId} to ${toBoardId}:`, error);
        toast.error('Failed to sync whiteboard');
        return false;
      }
      
      console.log(`Successfully synced from ${fromBoardId} to ${toBoardId}`);
      return true;
    } catch (err) {
      console.error(`Error during sync from ${fromBoardId} to ${toBoardId}:`, err);
      toast.error('Failed to sync whiteboard');
      return false;
    }
  }
  
  /**
   * Check if there's an active cooldown for this sync pair
   */
  private isInCooldown(syncKey: string): boolean {
    const lastSync = this.syncCooldowns.get(syncKey) || 0;
    return Date.now() - lastSync < this.SYNC_COOLDOWN_MS;
  }
  
  /**
   * Set a cooldown for this sync pair
   */
  private setCooldown(syncKey: string): void {
    this.syncCooldowns.set(syncKey, Date.now());
  }
  
  /**
   * Determine if sync should happen based on current settings and board IDs
   */
  shouldSync(fromBoardId: WhiteboardId, toBoardId: WhiteboardId): boolean {
    // These mappings would typically come from useSyncContext, but for static checks:
    const syncPairs: Record<string, string> = {
      'teacher1': 'student1',
      'teacher2': 'student2',
      'teacher3': 'student3',
      'teacher4': 'student4',
      'teacher5': 'student5'
    };
    
    // Verify this is a valid sync pair
    return syncPairs[fromBoardId] === toBoardId;
  }
}
