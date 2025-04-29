
import { Canvas } from 'fabric';
import { areCanvasStatesEqual, applyIncrementalUpdate } from './canvasStateUtils';

export class CanvasUpdateManager {
  private lastLoadedContent: Record<string, any> | null = null;
  private isPendingUpdate: boolean = false;
  private lastUpdateTime: number = 0;
  private updateDebounceTime: number = 300; // ms

  constructor() {}

  // Apply updates optimistically using incremental updates
  applyCanvasUpdate(canvas: Canvas, objectData: Record<string, any>): void {
    const now = Date.now();
    
    // Skip if we're already processing updates or if updates are coming too quickly
    if (this.isPendingUpdate || (now - this.lastUpdateTime < this.updateDebounceTime)) {
      console.log('Skipping update - already processing or too soon after last update');
      return;
    }
    
    // Skip if the content is the same
    if (areCanvasStatesEqual({state1: this.lastLoadedContent, state2: objectData})) {
      console.log('Skipping redundant update - content identical');
      return;
    }
    
    // Mark that we're processing an update
    this.isPendingUpdate = true;
    this.lastUpdateTime = now;
    
    // Store the state we're loading
    this.lastLoadedContent = objectData;
    
    // Apply the update without blocking and without flickering
    setTimeout(() => {
      try {
        // Use incremental update instead of full reload to prevent duplicating objects
        applyIncrementalUpdate({canvas, newState: objectData});
        console.log(`Canvas updated incrementally at ${new Date().toISOString()}`);
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
            console.log(`Canvas updated (fallback method) at ${new Date().toISOString()}`);
          });
        } catch (fallbackErr) {
          console.error('Fallback update also failed:', fallbackErr);
        }
      } finally {
        // Clear the pending flag
        this.isPendingUpdate = false;
      }
    }, 50);
  }
  
  getLastLoadedContent(): Record<string, any> | null {
    return this.lastLoadedContent;
  }
}
