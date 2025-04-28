
import { TeacherId, StudentId } from "@/types/canvas";

export interface SyncPair {
  teacherId: TeacherId;
  studentId: StudentId;
  storageKey: string;
}

export const SYNC_STORAGE_KEY = "whiteboard-sync-enabled";
export const SYNC2_STORAGE_KEY = "whiteboard-sync2-enabled";

export const syncPairsConfig: SyncPair[] = [
  { teacherId: "teacher1", studentId: "student1", storageKey: SYNC_STORAGE_KEY },
  { teacherId: "teacher2", studentId: "student2", storageKey: SYNC2_STORAGE_KEY },
];

