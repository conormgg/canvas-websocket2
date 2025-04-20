
import { useState } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";
import { WhiteboardId } from "@/types/canvas";

export const SplitWhiteboard = () => {
  const [enlargedBoard, setEnlargedBoard] = useState<WhiteboardId | null>(null);

  const handleCtrlClick = (board: WhiteboardId, e: React.MouseEvent) => {
    if (e.ctrlKey) {
      setEnlargedBoard(enlargedBoard === board ? null : board);
    }
  };

  const whiteboardIds: WhiteboardId[] = ["teacher", "student1", "student2", "student3", "student4"];
  const studentIds = whiteboardIds.filter((id): id is Exclude<WhiteboardId, "teacher"> => id !== "teacher");

  const getTeacherBoardClassName = () => {
    if (enlargedBoard === "teacher") return "fixed inset-4 z-50";
    if (enlargedBoard !== null) return "w-1/5";
    return "w-1/2";
  };

  const getStudentGridClassName = () => {
    if (enlargedBoard === "teacher") return "w-0 opacity-0";
    if (enlargedBoard !== null) return "w-full";
    return "w-1/2";
  };

  const getStudentBoardClassName = (studentId: WhiteboardId) => {
    if (enlargedBoard === studentId) return "fixed inset-4 z-50";
    if (enlargedBoard === "teacher") return "w-0 opacity-0";
    return "";
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F1F0FB] p-4 flex gap-4">
      {/* Teacher's whiteboard */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full relative",
          getTeacherBoardClassName()
        )}
        onClick={(e) => handleCtrlClick("teacher", e)}
      >
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <Whiteboard id="teacher" />
        </div>
      </div>

      {/* Students' whiteboards grid */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full grid grid-cols-2 gap-4",
          getStudentGridClassName()
        )}
      >
        {studentIds.map((studentId) => (
          <div
            key={studentId}
            className={cn(
              "transition-all duration-300 ease-in-out bg-white rounded-xl shadow-lg overflow-hidden",
              getStudentBoardClassName(studentId)
            )}
            onClick={(e) => handleCtrlClick(studentId, e)}
          >
            <Whiteboard id={studentId} />
          </div>
        ))}
      </div>
    </div>
  );
};
