
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';

// Define the table structure
export interface WhiteboardObject {
  board_id: string;
  object_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  id: string;
}

// Define a custom type to include the id property fabric.js doesn't expose in TypeScript
export interface ExtendedFabricObject extends FabricObject {
  id?: string;
}

// Props for the state comparison utility
export interface CanvasStateComparisonProps {
  state1: any;
  state2: any;
}

// Props for the incremental update utility
export interface IncrementalUpdateProps {
  canvas: Canvas;
  newState: Record<string, any>;
}

// Props for the realtime sync hook
export interface RealtimeSyncProps {
  fabricRef: React.MutableRefObject<Canvas | null>;
  boardId: WhiteboardId;
  isEnabled: boolean;
}
