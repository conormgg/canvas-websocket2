
import { useRef, useEffect } from 'react';
import { Canvas, util, FabricObject } from 'fabric';
import { WhiteboardId } from '@/types/canvas';
import { toast } from 'sonner';

interface UseWhiteboardSyncProps {
  id: WhiteboardId;
  fabricRef: React.MutableRefObject<Canvas | null>;
}

export const useWhiteboardSync = ({ id, fabricRef }: UseWhiteboardSyncProps) => {
  const linkedBoardId = useRef<WhiteboardId | null>(null);

  useEffect(() => {
    if (id === "student1") {
      linkedBoardId.current = "student1";
    } else if (id === "teacher" && window.location.pathname.includes("student")) {
      // This is the teacher's board in student view - no direct link needed
    }
  }, [id]);

  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      const detail = e.detail;
      
      const shouldProcess = 
        detail.targetId === id || 
        (id === "student1" && detail.sourceId === "student1") ||
        (id === "student1" && detail.sourceId === "student1");
      
      if (detail.sourceId === id || !shouldProcess) return;
      
      console.log(`${id} received update from ${detail.sourceId}`);
      
      const canvas = fabricRef.current;
      if (!canvas) return;

      util
        .enlivenObjects([detail.object])
        .then((objects: FabricObject[]) => {
          objects.forEach((obj) => {
            obj.selectable = true;
            obj.evented = true;
            canvas.add(obj);
          });
          canvas.renderAll();
        })
        .catch((err) => {
          console.error("Failed to enliven object", err);
          toast.error("Could not sync object to this board.");
        });
    };

    window.addEventListener("whiteboard-update", handleUpdate as EventListener);
    return () =>
      window.removeEventListener(
        "whiteboard-update",
        handleUpdate as EventListener
      );
  }, [fabricRef, id]);

  const handleObjectAdded = (object: FabricObject) => {
    if (linkedBoardId.current) {
      const event = new CustomEvent("whiteboard-update", {
        detail: {
          object: object.toJSON(),
          sourceId: id,
          targetId: linkedBoardId.current
        }
      });
      console.log(`Broadcasting from ${id} to ${linkedBoardId.current}`);
      window.dispatchEvent(event);
    }
  };

  return { handleObjectAdded };
};
