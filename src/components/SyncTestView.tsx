
import { SplitWhiteboard } from "./SplitWhiteboard";
import { StudentView } from "./StudentView";

export const SyncTestView = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] flex">
      <div className="w-1/2 h-full">
        <SplitWhiteboard />
      </div>
      <div className="w-1/2 h-full border-l-2 border-gray-200">
        <StudentView />
      </div>
    </div>
  );
};
