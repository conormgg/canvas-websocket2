
import { useState } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";
import { WhiteboardId } from "@/types/canvas";
import { useSyncContext } from "@/context/SyncContext";
import { Link } from "lucide-react";

export const StudentView = () => {
  const [enlarged, setEnlarged] = useState<WhiteboardId | null>(null);
  const { linkedBoards } = useSyncContext();

  const toggle = (id: WhiteboardId) => {
    setEnlarged(enlarged === id ? null : id);
  };

  const teacherCls = enlarged === "teacher" ? "fixed inset-4 z-50" : "w-1/2";
  const studentCls = enlarged === "student1" ? "fixed inset-4 z-50" : "w-1/2";
  
  const isTeacherLinked = linkedBoards.includes("teacher");

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex gap-4 relative">
      <div className={cn(
        "h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out", 
        teacherCls,
        isTeacherLinked && "border-2 border-green-400"
      )}>
        <div className={cn(
          "absolute top-2 left-2 px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1 z-10",
          isTeacherLinked 
            ? "bg-green-100 text-green-700" 
            : "bg-sidebar-primary text-white"
        )}>
          {isTeacherLinked && <Link className="h-3 w-3" />}
          Teacher's Board
        </div>
        <Whiteboard 
          id="teacher" 
          isSplitScreen={true}
          onCtrlClick={() => toggle("teacher")}
          isMaximized={enlarged === "teacher"}
        />
      </div>
      <div className={cn("h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out", studentCls)}>
        <div className="absolute top-2 left-[calc(50%+0.5rem)] px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md z-10">
          Your Board
        </div>
        <Whiteboard 
          id="student1" 
          isSplitScreen={true}
          onCtrlClick={() => toggle("student1")}
          isMaximized={enlarged === "student1"}
        />
      </div>
    </div>
  );
};
