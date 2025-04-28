
import { TeacherId, StudentId } from "@/types/canvas";

export interface SyncPair {
  teacherId: TeacherId;
  studentId: StudentId;
  storageKey: string;
}

export const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";
export const SYNC2_STORAGE_KEY = "whiteboard-sync2-enabled";
export const SYNC3_STORAGE_KEY = "whiteboard-sync3-enabled";
export const SYNC4_STORAGE_KEY = "whiteboard-sync4-enabled";
export const SYNC5_STORAGE_KEY = "whiteboard-sync5-enabled";

export const syncPairsConfig: SyncPair[] = [
  { teacherId: "teacher1", studentId: "student1", storageKey: SYNC_STORAGE_KEY },
  { teacherId: "teacher2", studentId: "student2", storageKey: SYNC2_STORAGE_KEY },
  { teacherId: "teacher3", studentId: "student1", storageKey: SYNC3_STORAGE_KEY },
  { teacherId: "teacher4", studentId: "student2", storageKey: SYNC4_STORAGE_KEY },
  { teacherId: "teacher5", studentId: "student1", storageKey: SYNC5_STORAGE_KEY },
];
