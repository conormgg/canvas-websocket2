
import { useState, useEffect } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";
import { WhiteboardId, StudentId } from "@/types/canvas";

export const SplitWhiteboard = () => {
  const [enlarged, setEnlarged] = useState<WhiteboardId | null>(null);
  const studentIds: StudentId[] = [
    "student1",
    "student2"
  ];
  
  // Initialize active board tracking when component mounts
  useEffect(() => {
    // Initialize global tracking variables if they don't exist
    if (typeof window.__wbActiveBoard === 'undefined') {
      window.__wbActiveBoard = null;
    }
    if (typeof window.__wbActiveBoardId === 'undefined') {
      window.__wbActiveBoardId = null;
    }
    
    // Clean up
    return () => {
      window.__wbActiveBoard = null;
      window.__wbActiveBoardId = null;
    };
  }, []);

  const toggle = (id: WhiteboardId, e: React.MouseEvent) => {
    // Update active board tracking
    if (e.target instanceof HTMLCanvasElement) {
      window.__wbActiveBoard = e.target;
      window.__wbActiveBoardId = id;
    }
    
    if (e.ctrlKey) {
      setEnlarged(enlarged === id ? null : id);
    }
  };

  const teacherCls =
    enlarged === "teacher"
      ? "fixed inset-4 z-50"
      : enlarged
      ? "w-1/5"
      : "w-1/2";

  const studentGridCls =
    enlarged === "teacher" ? "w-0 opacity-0" : enlarged ? "w-full" : "w-1/2";

  const studentCls = (id: StudentId) => {
    if (enlarged === id) return "fixed inset-4 z-50";
    if (enlarged === "teacher") return "w-0 opacity-0";
    return "";
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex gap-4">
      <div
        className={cn(
          "transition-all duration-300 ease-in-out h-full relative",
          teacherCls
        )}
        onClick={(e) => toggle("teacher", e)}
      >
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <Whiteboard id="teacher" isSplitScreen={!enlarged} />
        </div>
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out h-full grid grid-cols-2 gap-4",
          studentGridCls
        )}
      >
        {studentIds.map((id) => (
          <div
            key={id}
            className={cn(
              "relative bg-white rounded-xl shadow-lg overflow-hidden",
              studentCls(id)
            )}
            onClick={(e) => toggle(id, e)}
          >
            <Whiteboard id={id} isSplitScreen={!enlarged} />
          </div>
        ))}
      </div>
    </div>
  );
};
