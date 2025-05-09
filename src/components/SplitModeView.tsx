
import { Whiteboard } from "./Whiteboard";
import { SyncToggle } from "./SyncToggle";

export const SplitModeView = () => {
  // Define only the first two pairs of teacher-student boards
  const boardPairs = [
    { teacher: "teacher1", student: "student1" },
    { teacher: "teacher2", student: "student2" },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between p-2">
        <div className="text-lg font-medium flex flex-col">
          <span className="text-green-600">
            Real-time synchronization active between teacher and student boards
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 h-[calc(100vh-180px)]">
        {/* First row - Teacher's View 1 and Student's View 1 */}
        <div className="flex gap-4 h-1/2">
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 1
            </div>
            <Whiteboard id="teacher1" isSplitScreen={true} />
          </div>
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Student's View 1
            </div>
            <Whiteboard id="student1" isSplitScreen={true} />
          </div>
        </div>
        
        {/* Second row - Teacher's View 2 and Student's View 2 */}
        <div className="flex gap-4 h-1/2">
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 2
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
