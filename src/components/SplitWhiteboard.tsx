
import { useState } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";
import { WhiteboardId, StudentId } from "@/types/canvas";

export const SplitWhiteboard = () => {
  const [enlarged, setEnlarged] = useState<WhiteboardId | null>(null);
  const studentIds: StudentId[] = ["student1", "student2", "student3", "student4"];

  const toggle = (id: WhiteboardId, e: React.MouseEvent) => {
    if (e.ctrlKey) {
      setEnlarged(enlarged === id ? null : id);
    }
  };

  const teacherCls = enlarged === "teacher"
    ? "fixed inset-4 z-50"
    : enlarged ? "w-1/5" : "w-1/2";

  const studentGridCls = enlarged === "teacher"
    ? "w-0 opacity-0"
    : enlarged ? "w-full" : "w-1/2";

  const studentCls = (id: StudentId) => {
    if (enlarged === id) return "fixed inset-4 z-50";
    if (enlarged === "teacher") return "w-0 opacity-0";
    return "";
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#D3E4FD] p-4 flex gap-4">
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full relative",
          teacherCls
        )}
        onClick={(e) => toggle("teacher", e)}
      >
        <div className="h-full bg-white rounded-xl shadow-lg overflow-visible">
          <Whiteboard id="teacher" />
        </div>
      </div>

      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full grid grid-cols-2 gap-4",
          studentGridCls
        )}
      >
        {studentIds.map((studentId) => (
          <div
            key={studentId}
            className={cn(
              "transition-all duration-300 ease-in-out bg-white rounded-xl shadow-lg overflow-visible",
              studentCls(studentId)
            )}
            onClick={(e) => toggle(studentId, e)}
          >
            <Whiteboard id={studentId} />
          </div>
        ))}
      </div>
    </div>
  );
};
