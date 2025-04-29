import { Canvas } from 'fabric';

/**
 * Manages the queue of canvas updates
 */
export class UpdateQueueManager {
  private updateQueue: Record<string, any>[] = [];
  private isPendingUpdate: boolean = false;
  private MAX_QUEUE_SIZE: number = 3;
  
  /**
   * Add an update to the queue if it's not already present
   */
  addToQueue(contentHash: string, objectData: Record<string, any>): boolean {
    // Only queue if it's not already in the queue
    if (!this.updateQueue.some(update => 
      contentHash === ContentHashGenerator.generateContentHash(update))) {
      
      // Check queue size before adding
      if (this.updateQueue.length < this.MAX_QUEUE_SIZE) {
        console.log('Update queued for later processing');
        this.updateQueue.push(objectData);
        return true;
      } else {
        console.log('Update queue full, dropping update');
      }
    }
    return false;
  }
  
  /**
   * Process the next update in the queue
   */
  processNextUpdate(canvas: Canvas, 
    applyUpdateFn: (canvas: Canvas, update: Record<string, any>) => void): void {
    if (this.updateQueue.length > 0 && canvas && !this.isPendingUpdate) {
      const nextUpdate = this.updateQueue.shift();
      if (nextUpdate) {
        // Process with delay to prevent too rapid updates
        setTimeout(() => applyUpdateFn(canvas, nextUpdate), 300);
      }
    }
  }
  
  /**
   * Set the pending update flag
   */
  setPendingUpdate(isPending: boolean): void {
    this.isPendingUpdate = isPending;
  }
  
  /**
   * Get the pending update status
   */
  getPendingUpdateStatus(): boolean {
    return this.isPendingUpdate;
  }
  
  /**
   * Limit the queue size to prevent memory issues
   */
  pruneQueue(): void {
    if (this.updateQueue.length > this.MAX_QUEUE_SIZE) {
      console.log(`Pruning update queue from ${this.updateQueue.length} to ${this.MAX_QUEUE_SIZE} items`);
      // Keep only the most recent updates
      this.updateQueue = this.updateQueue.slice(-this.MAX_QUEUE_SIZE);
    }
  }
  
  /**
   * Clear the update queue
   */
  clearQueue(): void {
    this.updateQueue = [];
    this.isPendingUpdate = false;
  }
  
  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.updateQueue.length;
  }
}

// Circular dependency, import after class definition
import { ContentHashGenerator } from './contentHashGenerator';
