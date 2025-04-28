
import { Whiteboard } from "./Whiteboard";
import { useSyncContext } from "@/context/SyncContext";
import { SyncToggle } from "./SyncToggle";

export const SplitModeView = () => {
  const { 
    isSyncEnabled, 
    isSync2Enabled, 
    isSync3Enabled, 
    isSync4Enabled, 
    isSync5Enabled 
  } = useSyncContext();

  // Define the pairs of teacher-student boards
  const boardPairs = [
    { teacher: "teacher", student: "student1", sync: isSyncEnabled },
    { teacher: "teacher2", student: "student2", sync: isSync2Enabled },
    { teacher: "teacher3", student: "student3", sync: isSync3Enabled },
    { teacher: "teacher4", student: "student4", sync: isSync4Enabled },
    { teacher: "teacher5", student: "student5", sync: isSync5Enabled },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between p-2">
        <div className="text-lg font-medium flex flex-col">
          {boardPairs.map((pair, index) => (
            <span 
              key={index} 
              className={`${pair.sync ? "text-green-600" : "text-gray-600"}`}
            >
              Sync Teacher's View {index === 0 ? '1' : index + 1} → Student's View {index === 0 ? '1' : index + 1}: 
              {pair.sync ? " Active" : " Disabled"}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-4 h-[calc(100vh-180px)]">
        {/* First row - Teacher's View 1 and Student's View 1 */}
        <div className="flex gap-4 h-1/5">
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
        
        {/* Second row - Teacher's View 2 and Student's View 2 */}
        <div className="flex gap-4 h-1/5">
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
        
        {/* Third row - Teacher's View 3 and Student's View 3 */}
        <div className="flex gap-4 h-1/5">
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 3
            </div>
            <div className="absolute top-2 right-2 z-10">
              <SyncToggle isSplitScreen={true} boardId="teacher3" />
            </div>
            <Whiteboard id="teacher3" isSplitScreen={true} />
          </div>
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Student's View 3
            </div>
            <Whiteboard id="student3" isSplitScreen={true} />
          </div>
        </div>
        
        {/* Fourth row - Teacher's View 4 and Student's View 4 */}
        <div className="flex gap-4 h-1/5">
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 4
            </div>
            <div className="absolute top-2 right-2 z-10">
              <SyncToggle isSplitScreen={true} boardId="teacher4" />
            </div>
            <Whiteboard id="teacher4" isSplitScreen={true} />
          </div>
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Student's View 4
            </div>
            <Whiteboard id="student4" isSplitScreen={true} />
          </div>
        </div>
        
        {/* Fifth row - Teacher's View 5 and Student's View 5 */}
        <div className="flex gap-4 h-1/5">
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 5
            </div>
            <div className="absolute top-2 right-2 z-10">
              <SyncToggle isSplitScreen={true} boardId="teacher5" />
            </div>
            <Whiteboard id="teacher5" isSplitScreen={true} />
          </div>
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Student's View 5
            </div>
            <Whiteboard id="student5" isSplitScreen={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
