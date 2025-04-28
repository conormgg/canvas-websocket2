
import { useEffect } from "react";
import { Canvas, FabricObject, util } from "fabric";
import { toast } from "sonner";
import { WhiteboardId } from "@/types/canvas";

// This hook is now mainly used for potential future cross-board updates
// that aren't teacher-to-student syncs
export const useBoardUpdates = (
  id: WhiteboardId,
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      if (e.detail.sourceId === id) return;
      
      // Skip if this is a teacher-update, which is handled by useTeacherUpdates
      if (e.detail.type === "teacher-update") return;
      
      const canvas = fabricRef.current;
      if (!canvas) return;

      console.log(`${id} received general whiteboard update from ${e.detail.sourceId}`);

      util
        .enlivenObjects([e.detail.object])
        .then((objects: FabricObject[]) => {
          objects.forEach((obj) => {
            obj.selectable = true;
            obj.evented = true;
            canvas.add(obj);
          });
          canvas.renderAll();
        })
        .catch((err) => {
          console.error(`Failed to add object to ${id} from ${e.detail.sourceId}:`, err);
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
};
