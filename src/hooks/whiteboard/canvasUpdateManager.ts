import { Canvas } from 'fabric';
import { areCanvasStatesEqual, applyIncrementalUpdate } from './canvasStateUtils';

export class CanvasUpdateManager {
  private lastLoadedContent: Record<string, any> | null = null;
  private isPendingUpdate: boolean = false;
  private updateQueue: Record<string, any>[] = [];
  private processingInterval: number | null = null;
  private updateIds: Set<string> = new Set(); // Track already processed updates
  private lastUpdateTimestamp: number = 0;
  private updateCounter: number = 0;
  private MAX_UPDATES_PER_MINUTE: number = 60; // Reduced limit to prevent infinite loops
  private MAX_QUEUE_SIZE: number = 3; // Limit queue size
  private contentHashes: Map<string, number> = new Map(); // Track content hashes with timestamps

  constructor() {
    // Initialize a background processing interval
    this.processingInterval = window.setInterval(() => this.processQueue(), 1000); // Slowed down processing
    this.resetUpdateCounter();
  }

  // Reset the update counter every minute to prevent permanent throttling
  private resetUpdateCounter(): void {
    setInterval(() => {
      this.updateCounter = 0;
      // Clear old hashes to prevent memory leaks
      const now = Date.now();
      this.contentHashes.forEach((timestamp, hash) => {
        if (now - timestamp > 60000) { // Clear hashes older than 1 minute
          this.contentHashes.delete(hash);
        }
      });
    }, 60000); // Reset counter every minute
  }

  // Generate a unique hash for an update to prevent duplicates
  private generateContentHash(objectData: Record<string, any>): string {
    if (!objectData || !objectData.objects) return '';
    
    try {
      // Extract only essential data for comparing updates
      const essentialData = {
        objectCount: objectData.objects?.length || 0,
        objects: objectData.objects?.map((obj: any) => ({
          id: obj.id || '',
          type: obj.type || '',
          top: Math.round(obj.top || 0),
          left: Math.round(obj.left || 0),
          // For path objects, use a more detailed hash
          path: obj.path ? JSON.stringify(obj.path).substring(0, 100) : '', 
          points: obj.points ? JSON.stringify(obj.points).substring(0, 100) : ''
        }))
      };
      return JSON.stringify(essentialData);
    } catch (err) {
      console.error('Error generating content hash:', err);
      return Date.now().toString(); // Fallback to timestamp if hash generation fails
    }
  }

  // Apply updates optimistically using incremental updates
  applyCanvasUpdate(canvas: Canvas, objectData: Record<string, any>): void {
    if (!objectData || !objectData.objects) {
      console.warn('Received empty update data, skipping');
      return;
    }

    // Rate limiting - prevent too many updates (potential infinite loop protection)
    this.updateCounter++;
    if (this.updateCounter > this.MAX_UPDATES_PER_MINUTE) {
      console.warn('Update rate limit exceeded, possible infinite loop detected');
      // Skip every other update when rate limited
      if (this.updateCounter % 2 === 0) {
        return;
      }
    }

    // Generate a content hash to identify this update
    const contentHash = this.generateContentHash(objectData);
    if (!contentHash) {
      console.warn('Could not generate content hash, skipping update');
      return;
    }
    
    // Check if we've seen this exact content recently (within the last minute)
    const now = Date.now();
    if (this.contentHashes.has(contentHash)) {
      const lastSeenTime = this.contentHashes.get(contentHash) || 0;
      // If we've seen this exact content within the last 5 seconds, skip it
      if (now - lastSeenTime < 5000) {
        console.log('Skipping duplicate update (by content hash)');
        return;
      }
    }
    
    // Record that we've seen this content
    this.contentHashes.set(contentHash, now);
    
    // Add rate limiting - don't process updates too quickly
    if (now - this.lastUpdateTimestamp < 300) { // Increased delay between updates
      // Only queue if it's not already in the queue and not already processed
      if (!this.updateIds.has(contentHash) && 
          !this.updateQueue.some(update => this.generateContentHash(update) === contentHash)) {
        // Check queue size before adding
        if (this.updateQueue.length < this.MAX_QUEUE_SIZE) {
          console.log('Update queued for later processing');
          this.updateQueue.push(objectData);
        } else {
          console.log('Update queue full, dropping update');
        }
      }
      return;
    }
    
    this.lastUpdateTimestamp = now;
    
    // Skip if we've already processed this exact update
    if (this.updateIds.has(contentHash)) {
      console.log('Skipping duplicate update');
      return;
    }

    // Skip if the content is the same (simple check)
    if (this.lastLoadedContent && areCanvasStatesEqual({
      state1: this.lastLoadedContent, 
      state2: objectData
    })) {
      console.log('Skipping redundant update (same state)');
      return;
    }
    
    // Store the state we're loading for future comparison
    this.lastLoadedContent = {...objectData};
    
    // Add to processed updates
    this.updateIds.add(contentHash);
    
    // Limit size of tracking set to prevent memory leaks
    if (this.updateIds.size > 30) {
      // Convert to array, remove oldest entries, and convert back to Set
      const idArray = Array.from(this.updateIds);
      this.updateIds = new Set(idArray.slice(-15)); // Keep only the most recent 15
    }
    
    // If we're processing an update, queue this one
    if (this.isPendingUpdate) {
      // Only queue if it's not a duplicate
      if (!this.updateQueue.some(update => this.generateContentHash(update) === contentHash)) {
        if (this.updateQueue.length < this.MAX_QUEUE_SIZE) {
          console.log('Update queued for later processing');
          this.updateQueue.push(objectData);
        } else {
          console.log('Update queue full, dropping update');
        }
      }
      return;
    }
    
    // Mark that we're processing an update
    this.isPendingUpdate = true;
    
    try {
      // Apply the update in the next animation frame for smoother rendering
      requestAnimationFrame(() => {
        try {
          // Use incremental update instead of full reload
          applyIncrementalUpdate({canvas, newState: objectData});
          console.log(`Canvas updated incrementally`);
        } catch (err) {
          console.error('Failed to apply canvas update:', err);
          // Fallback to full reload if incremental update fails
          try {
            canvas.loadFromJSON(objectData, () => {
              // Make all objects interactive after loading
              canvas.getObjects().forEach(obj => {
                obj.set({
                  selectable: true,
                  evented: true,
                  hasControls: true,
                  hasBorders: true
                });
              });
              canvas.renderAll();
              console.log(`Canvas updated (fallback method)`);
            });
          } catch (fallbackErr) {
            console.error('Fallback update also failed:', fallbackErr);
          }
        } finally {
          // Clear the pending flag
          this.isPendingUpdate = false;
          
          // Process the next update if any
          if (this.updateQueue.length > 0 && canvas) {
            const nextUpdate = this.updateQueue.shift();
            if (nextUpdate) {
              // Wait a bit before processing the next update to prevent too rapid updates
              setTimeout(() => this.applyCanvasUpdate(canvas, nextUpdate), 300); // Increased delay
            }
          }
        }
      });
    } catch (err) {
      console.error('Error scheduling canvas update:', err);
      this.isPendingUpdate = false;
    }
  }
  
  processQueue(): void {
    // No need to process if already processing or queue is empty
    if (this.isPendingUpdate || this.updateQueue.length === 0) {
      return;
    }
    
    // Limit queue size to prevent memory issues
    if (this.updateQueue.length > this.MAX_QUEUE_SIZE) {
      console.log(`Pruning update queue from ${this.updateQueue.length} to ${this.MAX_QUEUE_SIZE} items`);
      // Keep only the most recent updates
      this.updateQueue = this.updateQueue.slice(-this.MAX_QUEUE_SIZE);
    }
  }
  
  cleanup(): void {
    if (this.processingInterval !== null) {
      window.clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.updateQueue = [];
    this.updateIds.clear();
    this.contentHashes.clear();
    this.isPendingUpdate = false;
    this.lastLoadedContent = null;
  }
  
  getLastLoadedContent(): Record<string, any> | null {
    return this.lastLoadedContent;
  }
}
