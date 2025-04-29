
import { Canvas, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';

export interface WhiteboardObject {
  board_id: string;
  object_data: any;
  created_at?: string;
  updated_at?: string;
  id?: string;
}

export interface CanvasPersistenceProps {
  fabricRef: React.MutableRefObject<Canvas | null>;
  boardId: WhiteboardId;
  isTeacherView: boolean;
}

export interface ObjectModificationHandlers {
  handleObjectAdded: (object: FabricObject) => void;
  handleObjectModified: (canvas: Canvas) => void;
}
