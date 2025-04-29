
import { Canvas } from 'fabric';
import { ContentHashGenerator } from './contentHashGenerator';
import { UpdateQueueManager } from './updateQueueManager';
import { UpdateRateLimiter } from './updateRateLimiter';
import { DuplicateUpdateTracker } from './duplicateUpdateTracker';
import { applyIncrementalUpdate, areCanvasStatesEqual } from '../canvasStateUtils';

export class CanvasUpdateManager {
  private lastLoadedContent: Record<string, any> | null = null;
  private processingInterval: number | null = null;
  private queueManager = new UpdateQueueManager();
  private rateLimiter = new UpdateRateLimiter();
  private duplicateTracker = new DuplicateUpdateTracker();

  constructor() {
    // Initialize a background processing interval
    this.processingInterval = window.setInterval(() => this.processQueue(), 1000); // Slowed down processing
    this.cleanupOldData();
  }

  // Reset counters and clean old data periodically
  private cleanupOldData(): void {
    setInterval(() => {
      this.duplicateTracker.cleanOldHashes();
    }, 60000); // Clean up every minute
  }

  // Apply updates optimistically using incremental updates
  applyCanvasUpdate(canvas: Canvas, objectData: Record<string, any>): void {
    if (!objectData || !objectData.objects) {
      console.warn('Received empty update data, skipping');
      return;
    }

    // Rate limiting - prevent too many updates (potential infinite loop protection)
    if (this.rateLimiter.isRateLimited()) {
      return;
    }

    // Generate a content hash to identify this update
    const contentHash = ContentHashGenerator.generateContentHash(objectData);
    if (!contentHash) {
      console.warn('Could not generate content hash, skipping update');
      return;
    }
    
    // Check if we've seen this exact content recently
    if (this.duplicateTracker.hasRecentDuplicate(contentHash)) {
      return;
    }
    
    // Record that we've seen this content
    this.duplicateTracker.recordUpdate(contentHash);
    
    // Add rate limiting - don't process updates too quickly
    const now = Date.now();
    if (this.rateLimiter.shouldThrottle(now)) {
      // Queue the update if it's not already there
      this.queueManager.addToQueue(contentHash, objectData);
      return;
    }
    
    this.rateLimiter.recordUpdate(now);
    
    // Skip if we've already processed this exact update
    if (this.duplicateTracker.hasProcessed(contentHash)) {
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
    
    // If we're processing an update, queue this one
    if (this.queueManager.getPendingUpdateStatus()) {
      this.queueManager.addToQueue(contentHash, objectData);
      return;
    }
    
    // Mark that we're processing an update
    this.queueManager.setPendingUpdate(true);
    
    this.performCanvasUpdate(canvas, objectData);
  }
  
  private performCanvasUpdate(canvas: Canvas, objectData: Record<string, any>): void {
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
          this.performFullCanvasReload(canvas, objectData);
        } finally {
          // Clear the pending flag
          this.queueManager.setPendingUpdate(false);
          
          // Process the next update if any
          this.queueManager.processNextUpdate(canvas, (c, data) => this.applyCanvasUpdate(c, data));
        }
      });
    } catch (err) {
      console.error('Error scheduling canvas update:', err);
      this.queueManager.setPendingUpdate(false);
    }
  }
  
  private performFullCanvasReload(canvas: Canvas, objectData: Record<string, any>): void {
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
  }
  
  processQueue(): void {
    // No need to process if already processing or queue is empty
    if (this.queueManager.getPendingUpdateStatus() || this.queueManager.getQueueSize() === 0) {
      return;
    }
    
    // Limit queue size to prevent memory issues
    this.queueManager.pruneQueue();
  }
  
  cleanup(): void {
    if (this.processingInterval !== null) {
      window.clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.queueManager.clearQueue();
    this.duplicateTracker.clearTracking();
    this.rateLimiter.cleanup();
    this.lastLoadedContent = null;
  }
  
  getLastLoadedContent(): Record<string, any> | null {
    return this.lastLoadedContent;
  }
}
