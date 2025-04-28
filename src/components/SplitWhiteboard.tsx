import { useState, useEffect } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";
import { WhiteboardId, TeacherId } from "@/types/canvas";

export const SplitWhiteboard = () => {
  const [enlarged, setEnlarged] = useState<WhiteboardId | null>(null);
  
  // The secondary boards
  const secondaryBoards: TeacherId[] = [
    "teacher2",
    "teacher3",
    "teacher4",
    "teacher5"
  ];
  
  // Initialize active board tracking when component mounts
  useEffect(() => {
    if (typeof window.__wbActiveBoard === 'undefined') {
      window.__wbActiveBoard = null;
    }
    if (typeof window.__wbActiveBoardId === 'undefined') {
      window.__wbActiveBoardId = null;
    }
    
    return () => {
      window.__wbActiveBoard = null;
      window.__wbActiveBoardId = null;
    };
  }, []);

  const toggle = (id: WhiteboardId, e: React.MouseEvent) => {
    if (e.target instanceof HTMLCanvasElement) {
      window.__wbActiveBoard = e.target;
      window.__wbActiveBoardId = id;
    }
    
    if (e.ctrlKey) {
      setEnlarged(enlarged === id ? null : id);
    }
  };

  const teacherCls =
    enlarged === "teacher1"
      ? "fixed inset-4 z-50"
      : enlarged
      ? "w-1/5"
      : "w-1/2";

  const secondaryBoardsContainerCls =
    enlarged === "teacher1" ? "w-0 opacity-0" : enlarged ? "w-full" : "w-1/2";

  const secondaryBoardCls = (id: TeacherId) => {
    if (enlarged === id) return "fixed inset-4 z-50";
    if (enlarged === "teacher1") return "w-0 opacity-0";
    return "";
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex gap-4">
      <div
        className={cn(
          "transition-all duration-300 ease-in-out h-full relative",
          teacherCls
        )}
        onClick={(e) => toggle("teacher1", e)}
      >
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <Whiteboard 
            id="teacher1" 
            isSplitScreen={!enlarged}
            toolbarProps={{
              backgroundColor: "[#F97316]"
            }}
          />
        </div>
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out h-full grid grid-cols-2 gap-4",
          secondaryBoardsContainerCls
        )}
      >
        {secondaryBoards.map((id) => (
          <div
            key={id}
            className={cn(
              "relative bg-white rounded-xl shadow-lg overflow-hidden",
              secondaryBoardCls(id)
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
