
import { WhiteboardId } from "@/types/canvas";
import { FabricObject, Canvas } from "fabric";

export interface RealtimeChannelConfig {
  boardId: WhiteboardId;
  channelName: string;
  channel: any; // Supabase channel instance
}

export interface UpdateThrottling {
  lastTimestamp: number;
  count: number;
}

// Type for hash tracking to prevent duplicate updates
export interface UpdateHashTracking {
  boardId: WhiteboardId;
  hash: string;
  timestamp: number;
}

// Extended type for fabric objects with ID
export interface ExtendedFabricObject extends FabricObject {
  id?: string;
}

// Props for comparing canvas states
export interface CanvasStateComparisonProps {
  state1: Record<string, any> | null;
  state2: Record<string, any> | null;
}

// Props for incremental canvas updates
export interface IncrementalUpdateProps {
  canvas: Canvas;
  newState: Record<string, any>;
}
