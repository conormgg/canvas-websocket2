
import { WhiteboardId, TeacherId } from "@/types/canvas";
import { syncPairsConfig } from "@/config/syncConfig";
import { toast } from "sonner";

// Debounce utility to prevent rapid event firing
const debounceMap = new Map<string, NodeJS.Timeout>();
const debounce = (fn: Function, id: string, delay: number = 100) => {
  if (debounceMap.has(id)) {
    clearTimeout(debounceMap.get(id));
  }
  
  const timeout = setTimeout(() => {
    fn();
    debounceMap.delete(id);
  }, delay);
  
  debounceMap.set(id, timeout);
};

export const shouldShowToastForBoard = (boardId: string): boolean => {
  const activeBoard = window.__wbActiveBoardId;
  return activeBoard === boardId || 
         boardId === "teacher1" || 
         boardId === "student1" ||
         boardId === "teacher2" || 
         boardId === "student2";
};

export const sendObjectToStudents = (
  objectData: any, 
  sourceId: WhiteboardId,
  isSyncEnabled: boolean = false
) => {
  if (!sourceId.startsWith('teacher')) {
    console.log(`Object from ${sourceId} not synced - not a teacher board`);
    return;
  }
  
  const syncPair = syncPairsConfig.find(pair => pair.teacherId === sourceId);
  
  if (!syncPair) {
    console.log(`No sync configuration found for ${sourceId}`);
    return;
  }
  
  // Get sync state from localStorage directly in case context isn't updated
  let actualSyncEnabled = isSyncEnabled;
  try {
    const storedSyncState = localStorage.getItem(syncPair.storageKey);
    if (storedSyncState !== null) {
      actualSyncEnabled = JSON.parse(storedSyncState);
    }
  } catch (err) {
    console.warn(`Error reading sync state from localStorage for ${sourceId}:`, err);
    // Fall back to passed value
  }
  
  if (!actualSyncEnabled) {
    console.log(`Sync is disabled for ${sourceId}, not sending update`);
    return;
  }
  
  console.log(`Preparing to sync object from ${sourceId} to ${syncPair.studentId}`, objectData);
  
  // Use debounce to prevent multiple events in quick succession
  debounce(() => {
    try {
      const syncEvent = new CustomEvent("teacher-update", {
        detail: {
          object: objectData,
          sourceId,
          timestamp: Date.now(),
          targetId: syncPair.studentId
        }
      });
      
      window.dispatchEvent(syncEvent);
      console.log(`Object sent from ${sourceId} to ${syncPair.studentId}`);
      
      // Show visual confirmation for teacher board - but limit frequency
      if (shouldShowToastForBoard(sourceId)) {
        toast.success(`Synced to student board ${syncPair.studentId}`, { 
          duration: 1000,
          position: 'bottom-right'
        });
      }
    } catch (err) {
      console.error(`Error dispatching sync event from ${sourceId}:`, err);
      if (shouldShowToastForBoard(sourceId)) {
        toast.error("Failed to sync with student board");
      }
    }
  }, `${sourceId}-${Date.now()}`);
};
