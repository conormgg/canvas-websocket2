
import { Canvas } from 'fabric';
import { areCanvasStatesEqual, applyIncrementalUpdate } from './canvasStateUtils';

export class CanvasUpdateManager {
  private lastLoadedContent: Record<string, any> | null = null;
  private isPendingUpdate: boolean = false;
  private updateQueue: Record<string, any>[] = [];
  private processingInterval: number | null = null;
  private updateIds: Set<string> = new Set(); // Track already processed updates

  constructor() {
    // Initialize a background processing interval
    this.processingInterval = window.setInterval(() => this.processQueue(), 500);
  }

  // Apply updates optimistically using incremental updates
  applyCanvasUpdate(canvas: Canvas, objectData: Record<string, any>): void {
    if (!objectData) {
      console.warn('Received empty update data, skipping');
      return;
    }

    // Generate a content hash to identify this update
    const contentHash = JSON.stringify(objectData);
    
    // Skip if we've already processed this exact update
    if (this.updateIds.has(contentHash)) {
      console.log('Skipping duplicate update');
      return;
    }

    // Skip if the content is the same (simple check)
    if (areCanvasStatesEqual({state1: this.lastLoadedContent, state2: objectData})) {
      console.log('Skipping redundant update (same state)');
      return;
    }
    
    // Store the state we're loading for future comparison
    this.lastLoadedContent = objectData;
    
    // Add to processed updates
    this.updateIds.add(contentHash);
    
    // Limit size of tracking set to prevent memory leaks
    if (this.updateIds.size > 100) {
      // Convert to array, remove oldest entries, and convert back to Set
      const idArray = Array.from(this.updateIds);
      this.updateIds = new Set(idArray.slice(-50));
    }
    
    // If we're processing an update, queue this one
    if (this.isPendingUpdate) {
      console.log('Update queued for later processing');
      // Only queue if it's not a duplicate (by simple check)
      const isDuplicate = this.updateQueue.some(
        update => JSON.stringify(update) === contentHash
      );
      
      if (!isDuplicate) {
        this.updateQueue.push(objectData);
      }
      return;
    }
    
    // Mark that we're processing an update
    this.isPendingUpdate = true;
    
    // Apply the update without blocking and without flickering
    try {
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
              this.applyCanvasUpdate(canvas, nextUpdate);
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
    if (this.updateQueue.length > 10) {
      console.log(`Pruning update queue from ${this.updateQueue.length} to 5 items`);
      // Keep only the most recent updates
      this.updateQueue = this.updateQueue.slice(-5);
    }
  }
  
  cleanup(): void {
    if (this.processingInterval !== null) {
      window.clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.updateQueue = [];
    this.updateIds.clear();
    this.isPendingUpdate = false;
  }
  
  getLastLoadedContent(): Record<string, any> | null {
    return this.lastLoadedContent;
  }
}
