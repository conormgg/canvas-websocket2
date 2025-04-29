
import { WhiteboardId } from "@/types/canvas";

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
