
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

  const studentIds: WhiteboardId[] = ["student1", "student2", "student3", "student4"];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F1F0FB] p-4 flex gap-4">
      {/* Teacher's whiteboard */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full relative",
          enlargedBoard === "teacher" ? "fixed inset-4 z-50" : 
          enlargedBoard ? "w-0 opacity-0" : "w-1/2"
        )}
      >
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <Whiteboard id="teacher" />
        </div>
      </div>

      {/* Students' whiteboards grid */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full",
          enlargedBoard === "teacher" ? "w-0 opacity-0" : 
          enlargedBoard && enlargedBoard !== "teacher" ? "fixed inset-4 z-50" : "w-1/2",
          "grid grid-cols-2 gap-4"
        )}
      >
        {studentIds.map((studentId) => (
          <div
            key={studentId}
            className={cn(
              "transition-all duration-300 ease-in-out bg-white rounded-xl shadow-lg overflow-hidden",
              enlargedBoard === studentId ? "fixed inset-4 z-50" : ""
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
