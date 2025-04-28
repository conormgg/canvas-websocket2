
import { Whiteboard } from "./Whiteboard";
import { useSyncContext } from "@/context/SyncContext";
import { SyncToggle } from "./SyncToggle";

export const SplitModeView = () => {
  const { isSyncEnabled, isSync2Enabled } = useSyncContext();

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between p-2">
        <div className="text-lg font-medium flex flex-col">
          <span className={`${isSyncEnabled ? "text-green-600" : "text-gray-600"}`}>
            Sync Teacher's View 1 → Student's View 1: {isSyncEnabled ? "Active" : "Disabled"}
          </span>
          <span className={`${isSync2Enabled ? "text-green-600" : "text-gray-600"}`}>
            Sync Teacher's View 2 → Student's View 2: {isSync2Enabled ? "Active" : "Disabled"}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4 h-[calc(100vh-100px)]"> {/* Added fixed height */}
        {/* Top row - Teacher's View 1 and Student's View 1 */}
        <div className="flex gap-4 h-1/2"> {/* Changed to h-1/2 */}
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 1
            </div>
            <div className="absolute top-2 right-2 z-10">
              <SyncToggle isSplitScreen={true} boardId="teacher" />
            </div>
            <Whiteboard id="teacher" isSplitScreen={true} />
          </div>
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Student's View 1
            </div>
            <Whiteboard id="student1" isSplitScreen={true} />
          </div>
        </div>
        {/* Bottom row - Teacher's View 2 and Student's View 2 */}
        <div className="flex gap-4 h-1/2"> {/* Changed to h-1/2 */}
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 2
            </div>
            <div className="absolute top-2 right-2 z-10">
              <SyncToggle isSplitScreen={true} boardId="teacher2" />
            </div>
            <Whiteboard id="teacher2" isSplitScreen={true} />
          </div>
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Student's View 2
            </div>
            <Whiteboard id="student2" isSplitScreen={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
