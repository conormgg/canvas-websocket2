
import { useState } from "react";
import { WhiteboardState } from "@/types/whiteboard";

export const useWhiteboardState = (initialIsMaximized: boolean = false) => {
  const [state, setState] = useState<WhiteboardState>({
    activeTool: "draw",
    activeColor: "#ff0000",
    inkThickness: 2,
    zoom: 1,
    isActive: false,
    isMaximized: initialIsMaximized,
  });

  const updateState = (updates: Partial<WhiteboardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return {
    state,
    updateState,
  };
};
