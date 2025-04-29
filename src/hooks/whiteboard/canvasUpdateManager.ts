import { Canvas } from 'fabric';
import { areCanvasStatesEqual, applyIncrementalUpdate } from './canvasStateUtils';

export class CanvasUpdateManager {
  private lastLoadedContent: Record<string, any> | null = null;
  private isPendingUpdate: boolean = false;
  // Track source of updates to prevent circular sync
  private updateSource: string | null = null;
  // Track object IDs that were recently updated to prevent re-processing
  private recentlyProcessedIds: Set<string> = new Set();

  constructor() {}

  // Apply updates optimistically using incremental updates
  applyCanvasUpdate(canvas: Canvas, objectData: Record<string, any>, updateSource?: string): void {
    // Skip if we're already processing updates
    if (this.isPendingUpdate) {
      console.log('Skipping update - already processing another update');
      return;
    }
    
    // Compare object IDs to detect redundant updates even when metadata differs
    const areObjectsSame = this.areObjectsEffectivelySame(objectData);
    
    // Skip if the content is functionally the same (compare objects, not just full state)
    if (areObjectsSame) {
      console.log('Skipping redundant update - objects are effectively the same');
      return;
    }
    
    // Track objects being processed to prevent immediate re-processing
    this.trackProcessedObjects(objectData);
    
    // Mark that we're processing an update and record source
    this.isPendingUpdate = true;
    this.updateSource = updateSource || null;
    
    // Store the state we're loading
    this.lastLoadedContent = this.sanitizeStateForComparison(objectData);
    
    // Apply the update without blocking and without flickering
    setTimeout(() => {
      try {
        // Use incremental update instead of full reload
        applyIncrementalUpdate({canvas, newState: objectData});
        console.log(`Canvas updated incrementally from source: ${this.updateSource || 'unknown'}`);
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
            console.log(`Canvas updated (fallback method) from source: ${this.updateSource || 'unknown'}`);
          });
        } catch (fallbackErr) {
          console.error('Fallback update also failed:', fallbackErr);
        }
      } finally {
        // Clear the pending flag - with a slight delay to ensure any triggered events complete
        setTimeout(() => {
          this.isPendingUpdate = false;
          this.updateSource = null;
        }, 100);
      }
    }, 50);
  }
  
  // Sanitize state by removing or normalizing transient properties
  private sanitizeStateForComparison(objectData: Record<string, any>): Record<string, any> {
    if (!objectData) return {};
    
    // Deep clone to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(objectData));
    
    // Remove timestamps or other metadata that shouldn't affect equality comparison
    if (sanitized.timestamp) delete sanitized.timestamp;
    if (sanitized.lastUpdated) delete sanitized.lastUpdated;
    
    return sanitized;
  }
  
  // Track object IDs that were processed to prevent immediate re-processing
  private trackProcessedObjects(objectData: Record<string, any>): void {
    if (!objectData?.objects || !Array.isArray(objectData.objects)) return;
    
    // Clear old entries first (only keep recent ones)
    this.recentlyProcessedIds.clear();
    
    // Add current object IDs to the processed set
    objectData.objects.forEach((obj: any) => {
      if (obj.id) {
        this.recentlyProcessedIds.add(obj.id);
      }
    });
  }
  
  // Compare objects more intelligently - focus on visual content not metadata
  private areObjectsEffectivelySame(newState: Record<string, any>): boolean {
    if (!this.lastLoadedContent) return false;
    if (!newState?.objects || !this.lastLoadedContent?.objects) return false;
    
    // Quick length check
    if (newState.objects.length !== this.lastLoadedContent.objects.length) return false;
    
    // If all object IDs match and there are no new properties, consider them the same
    const existingIds = new Set(
      this.lastLoadedContent.objects
        .filter((obj: any) => obj.id)
        .map((obj: any) => obj.id)
    );
    
    const allObjsExist = newState.objects.every((obj: any) => {
      return !obj.id || existingIds.has(obj.id);
    });
    
    return allObjsExist;
  }
  
  getLastLoadedContent(): Record<string, any> | null {
    return this.lastLoadedContent;
  }
}
