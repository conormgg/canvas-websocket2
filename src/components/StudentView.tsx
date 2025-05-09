
import { useState, useEffect } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";
import { WhiteboardId } from "@/types/canvas";

export const StudentView = () => {
  const [enlarged, setEnlarged] = useState<WhiteboardId | null>(null);
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);

  const toggle = (id: WhiteboardId) => {
    setEnlarged(enlarged === id ? null : id);
  };

  const teacherCls = enlarged === "student1" ? "fixed inset-4 z-50" : "w-1/2";
  const studentCls = enlarged === "student2" ? "fixed inset-4 z-50" : "w-1/2";
  
  // Rotate active boards much less frequently
  useEffect(() => {
    const boards = ["student1", "student2"];
    const interval = setInterval(() => {
      // Just trigger a re-render by rotating the active index
      // This ensures each board gets refreshed periodically
      setActiveBoardIndex(prevIndex => (prevIndex + 1) % boards.length);
    }, 30000);  // Increased to 30 seconds for much less frequent refreshes
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex gap-4 relative">
      <div className={cn("h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out", teacherCls)}>
        <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
          Student's Board 1
        </div>
        <Whiteboard 
          id="student1" 
          isSplitScreen={true}
          onCtrlClick={() => toggle("student1")}
          isMaximized={enlarged === "student1"}
        />
      </div>
      <div className={cn("h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out", studentCls)}>
        <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
          Student's Board 2
        </div>
        <Whiteboard 
          id="student2" 
          isSplitScreen={true}
          onCtrlClick={() => toggle("student2")}
          isMaximized={enlarged === "student2"}
        />
      </div>
    </div>
  );
};
