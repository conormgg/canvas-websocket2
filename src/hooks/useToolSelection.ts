
import { useState } from "react";

type Tool = "select" | "draw" | "eraser";

export const useToolSelection = (initialTool: Tool = "draw") => {
  const [activeTool, setActiveTool] = useState<Tool>(initialTool);

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
  };

  return {
    activeTool,
    handleToolChange
  };
};
