
import { useState } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";
import { StudentId } from "@/types/canvas";
import { useSyncContext } from "@/context/SyncContext";

export const StudentView = () => {
  const [enlarged, setEnlarged] = useState<StudentId | null>(null);
  const { isSyncEnabled } = useSyncContext();

  const toggle = (id: StudentId) => {
    setEnlarged(enlarged === id ? null : id);
  };

  const getBoardClass = (id: StudentId) => 
    enlarged === id ? "fixed inset-4 z-50" : "w-1/2";

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex gap-4">
      {["student1", "student2"].map((id) => (
        <div
          key={id}
          className={cn(
            "h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out",
            getBoardClass(id as StudentId)
          )}
        >
          <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
            {`Student's View ${id.replace('student', '')}`}
          </div>
          <Whiteboard
            id={id as StudentId}
            isSplitScreen={true}
            onCtrlClick={() => toggle(id as StudentId)}
            isMaximized={enlarged === id}
          />
        </div>
      ))}
    </div>
  );
};
