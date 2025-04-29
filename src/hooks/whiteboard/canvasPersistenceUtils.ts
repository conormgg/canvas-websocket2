
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
    
    // Always sync between teacher and student boards regardless of toggle status
    if (boardId === "teacher2") {
      this.canvasStateManager.syncBoardState(canvas, boardId, "student2");
    } else if (boardId === "student2") {
      this.canvasStateManager.syncBoardState(canvas, boardId, "teacher2");
    } else if (boardId === "teacher1") {
      console.log("Syncing teacher1 changes to student1");
      this.canvasStateManager.syncBoardState(canvas, boardId, "student1");
    } else if (boardId === "teacher3") {
      this.canvasStateManager.syncBoardState(canvas, boardId, "student3");
    } else if (boardId === "teacher4") {
      this.canvasStateManager.syncBoardState(canvas, boardId, "student4");
    } else if (boardId === "teacher5") {
      this.canvasStateManager.syncBoardState(canvas, boardId, "student5");
    }
  }
}
