
import { useState } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";
import { TeacherId } from "@/types/canvas";
import { useSyncContext } from "@/context/SyncContext";

export const TeacherView = () => {
  const [enlarged, setEnlarged] = useState<TeacherId | null>(null);
  const { isSyncEnabled } = useSyncContext();
  
  const teacherBoards: TeacherId[] = ["teacher1", "teacher2", "teacher3", "teacher4", "teacher5"];

  const toggle = (id: TeacherId) => {
    setEnlarged(enlarged === id ? null : id);
  };

  const getBoardClass = (id: TeacherId) => {
    if (enlarged === id) return "fixed inset-4 z-50";
    if (enlarged) return "w-1/5";
    return "w-1/3 h-1/2"; // Default size in grid
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4">
      <div className={cn(
        "grid grid-cols-3 gap-4 h-full",
        enlarged ? "grid-cols-5" : "grid-cols-3"
      )}>
        {teacherBoards.map((id) => (
          <div
            key={id}
            className={cn(
              "bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out",
              getBoardClass(id)
            )}
          >
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              {`Teacher's View ${id.replace('teacher', '')}`}
            </div>
            <Whiteboard
              id={id}
              isSplitScreen={true}
              onCtrlClick={() => toggle(id)}
              isMaximized={enlarged === id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
