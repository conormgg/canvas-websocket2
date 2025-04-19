
import { useState } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";

type StudentId = "student1" | "student2" | "student3" | "student4";
type BoardId = "teacher" | StudentId;

export const SplitWhiteboard = () => {
  const [enlargedBoard, setEnlargedBoard] = useState<BoardId | null>(null);

  const handleCtrlClick = (board: BoardId, e: React.MouseEvent) => {
    if (e.ctrlKey) {
      setEnlargedBoard(enlargedBoard === board ? null : board);
    }
  };

  const studentIds: StudentId[] = ["student1", "student2", "student3", "student4"];

  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-100 flex">
      {/* Teacher's whiteboard */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full bg-white border-r-2 border-neutral-300",
          enlargedBoard === "teacher" ? "w-full" : enlargedBoard ? "w-0" : "w-1/2"
        )}
        onClick={(e) => handleCtrlClick("teacher", e)}
      >
        <Whiteboard id="teacher" />
      </div>

      {/* Students' whiteboards grid */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full",
          enlargedBoard === "teacher" ? "w-0" : enlargedBoard && enlargedBoard !== "teacher" ? "w-full" : "w-1/2",
          "grid grid-cols-2 gap-2 p-2"
        )}
      >
        {studentIds.map((studentId) => (
          <div
            key={studentId}
            className={cn(
              "transition-all duration-300 ease-in-out bg-white border border-neutral-200 rounded-lg overflow-hidden",
              enlargedBoard === studentId ? "col-span-2 row-span-2" : ""
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
