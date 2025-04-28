
import { Whiteboard } from "./Whiteboard";
import { useSyncContext } from "@/context/SyncContext";
import { SyncToggle } from "./SyncToggle";

export const SplitModeView = () => {
  const { isSyncEnabled } = useSyncContext();

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between p-2">
        <div className="text-lg font-medium">
          {isSyncEnabled ? (
            <span className="text-green-600">Sync Active: Teacher's View 1 → Student's View 1</span>
          ) : (
            <span className="text-gray-600">Sync Disabled</span>
          )}
        </div>
        <SyncToggle />
      </div>
      <div className="flex gap-4 flex-1">
        <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
            Teacher's View 1
          </div>
          <Whiteboard id="teacher" isSplitScreen={true} />
        </div>
        <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="absolute top-2 left-[calc(50%+0.5rem)] px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
            Student's View 1
          </div>
          <Whiteboard id="teacher" isSplitScreen={true} />
        </div>
      </div>
    </div>
  );
};
