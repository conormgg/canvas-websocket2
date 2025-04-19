
import { useState } from "react";
import { Whiteboard } from "./Whiteboard";
import { cn } from "@/lib/utils";

export const SplitWhiteboard = () => {
  const [enlargedBoard, setEnlargedBoard] = useState<"left" | "right" | null>(null);

  const handleCtrlClick = (board: "left" | "right", e: React.MouseEvent) => {
    if (e.ctrlKey) {
      setEnlargedBoard(enlargedBoard === board ? null : board);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex">
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full",
          enlargedBoard === "left" ? "w-full" : enlargedBoard === "right" ? "w-0" : "w-1/2"
        )}
        onClick={(e) => handleCtrlClick("left", e)}
      >
        <Whiteboard id="left" />
      </div>
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out h-full",
          enlargedBoard === "right" ? "w-full" : enlargedBoard === "left" ? "w-0" : "w-1/2"
        )}
        onClick={(e) => handleCtrlClick("right", e)}
      >
        <Whiteboard id="right" />
      </div>
    </div>
  );
};
