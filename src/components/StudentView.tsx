
import { Whiteboard } from "./Whiteboard";

export const StudentView = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex gap-4">
      <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
          Teacher's Board
        </div>
        <Whiteboard id="teacher" isSplitScreen={true} />
      </div>
      <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="absolute top-2 left-[calc(50%+0.5rem)] px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
          Your Board
        </div>
        <Whiteboard id="student1" isSplitScreen={true} />
      </div>
    </div>
  );
};
