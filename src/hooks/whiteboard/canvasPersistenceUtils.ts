
import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { CanvasStateManager } from './canvasStateManager';

export class CanvasPersistenceUtils {
  private saveTimeoutRef: number | null = null;
  private canvasStateManager: CanvasStateManager;
  private readonly DEBOUNCE_TIMEOUT: number = 500;
  private isSaving: boolean = false;
  private lastSaveTime: number = 0;
  private MIN_SAVE_INTERVAL: number = 1000; // Minimum time between saves in ms

  constructor() {
    this.canvasStateManager = new CanvasStateManager();
    this.saveTimeoutRef = null;
  }

  getStateManager(): CanvasStateManager {
    return this.canvasStateManager;
  }

  clearTimeout(): void {
    if (this.saveTimeoutRef) {
      window.clearTimeout(this.saveTimeoutRef);
      this.saveTimeoutRef = null;
    }
  }

  debouncedSave(canvas: Canvas, boardId: WhiteboardId): void {
    // Check if we're currently saving or if we've saved too recently
    const now = Date.now();
    if (this.isSaving || (now - this.lastSaveTime < this.MIN_SAVE_INTERVAL)) {
      // If there's an existing timeout, clear it and set a new one
      this.clearTimeout();
      
      this.saveTimeoutRef = window.setTimeout(() => {
        this.debouncedSave(canvas, boardId);
      }, this.DEBOUNCE_TIMEOUT);
      
      return;
    }
    
    this.clearTimeout();
    
    this.saveTimeoutRef = window.setTimeout(() => {
      this.performSave(canvas, boardId);
    }, this.DEBOUNCE_TIMEOUT);
  }
  
  private async performSave(canvas: Canvas, boardId: WhiteboardId): Promise<void> {
    if (this.isSaving) return;
    
    try {
      this.isSaving = true;
      await this.canvasStateManager.saveCanvasState(canvas, boardId);
      this.lastSaveTime = Date.now();
    } catch (err) {
      console.error(`Error saving canvas for ${boardId}:`, err);
    } finally {
      this.isSaving = false;
    }
  }

  handleSyncedModification(canvas: Canvas, boardId: WhiteboardId): void {
    console.log(`Canvas ${boardId} modified, queuing save`);
    this.debouncedSave(canvas, boardId);
    
    // Handle two-way sync for specific boards
    if (boardId === "teacher2") {
      this.canvasStateManager.syncBoardState(canvas, boardId, "student2");
    } else if (boardId === "student2") {
      this.canvasStateManager.syncBoardState(canvas, boardId, "teacher2");
    } else if (boardId === "teacher1") {
      this.canvasStateManager.syncBoardState(canvas, boardId, "student1");
    }
  }
}
