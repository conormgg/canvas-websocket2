
import { WhiteboardId } from "@/types/canvas";
import { syncPairsConfig } from "@/config/syncConfig";

export const shouldShowToastForBoard = (boardId: string): boolean => {
  const activeBoard = window.__wbActiveBoardId;
  return activeBoard === boardId || 
         boardId === "teacher1" || 
         boardId === "student1";
};

export const sendObjectToStudents = (
  objectData: any, 
  sourceId: WhiteboardId,
  isSyncEnabled: boolean
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
  
  if (!isSyncEnabled) {
    console.log(`Sync is disabled for ${sourceId}, not sending update`);
    return;
  }
  
  console.log(`Preparing to sync object from ${sourceId} to ${syncPair.studentId}`, objectData);
  
  const syncEvent = new CustomEvent("teacher-update", {
    detail: {
      object: objectData,
      sourceId,
      timestamp: Date.now(),
      targetId: syncPair.studentId
    }
  });
  
  window.dispatchEvent(syncEvent);
  console.log(`Object sent from ${sourceId} to ${syncPair.studentId}:`, objectData);
};
