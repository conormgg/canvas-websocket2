import { Canvas } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { CanvasStateManager } from './canvasStateManager';

export class CanvasPersistenceUtils {
  private saveTimeoutRef: number | null = null;
  private canvasStateManager: CanvasStateManager;
  private readonly DEBOUNCE_TIMEOUT: number = 500;

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
    this.clearTimeout();
    
    this.saveTimeoutRef = window.setTimeout(() => {
      this.canvasStateManager.saveCanvasState(canvas, boardId);
    }, this.DEBOUNCE_TIMEOUT);
  }

  handleSyncedModification(canvas: Canvas, boardId: WhiteboardId): void {
    console.log(`Canvas ${boardId} modified, queuing save`);
    this.debouncedSave(canvas, boardId);
    
    // Sync from teacher to student
    if (boardId === "teacher1") {
      console.log("Syncing teacher1 changes to student1");
      // Force immediate sync without debounce for critical teacher->student path
      this.canvasStateManager.syncBoardState(canvas, boardId, "student1");
    } else if (boardId === "teacher2") {
      console.log("Syncing teacher2 changes to student2");
      this.canvasStateManager.syncBoardState(canvas, boardId, "student2");
    } else if (boardId === "teacher3") {
      console.log("Syncing teacher3 changes to student3");
      this.canvasStateManager.syncBoardState(canvas, boardId, "student3");
    } else if (boardId === "teacher4") {
      console.log("Syncing teacher4 changes to student4");
      this.canvasStateManager.syncBoardState(canvas, boardId, "student4");
    } else if (boardId === "teacher5") {
      console.log("Syncing teacher5 changes to student5");
      this.canvasStateManager.syncBoardState(canvas, boardId, "student5");
    }
    
    // We'll keep the reverse sync direction for completeness, but the primary focus
    // is on teacher1->student1 sync working correctly
    else if (boardId === "student1") {
      console.log("Syncing student1 changes to teacher1");
      this.canvasStateManager.syncBoardState(canvas, boardId, "teacher1");
    } else if (boardId === "student2") {
      console.log("Syncing student2 changes to teacher2");
      this.canvasStateManager.syncBoardState(canvas, boardId, "teacher2");
    } else if (boardId === "student3") {
      console.log("Syncing student3 changes to teacher3");
      this.canvasStateManager.syncBoardState(canvas, boardId, "teacher3");
    } else if (boardId === "student4") {
      console.log("Syncing student4 changes to teacher4");
      this.canvasStateManager.syncBoardState(canvas, boardId, "teacher4");
    } else if (boardId === "student5") {
      console.log("Syncing student5 changes to teacher5");
      this.canvasStateManager.syncBoardState(canvas, boardId, "teacher5");
    }
  }
}
