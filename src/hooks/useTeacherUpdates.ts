
import { useEffect } from "react";
import { Canvas, FabricObject, util } from "fabric";
import { toast } from "sonner";
import { WhiteboardId } from "@/types/canvas";

export const useTeacherUpdates = (
  id: WhiteboardId,
  fabricRef: React.MutableRefObject<Canvas | null>,
  isSyncEnabled: boolean
) => {
  const shouldShowToastForBoard = (boardId: string) => {
    const activeBoard = window.__wbActiveBoardId;
    return activeBoard === boardId || 
           boardId === "student1" || 
           boardId === "student2";
  };

  useEffect(() => {
    // Only update boards that should receive synced updates
    if (!id.startsWith("student")) {
      return;
    }

    const handleTeacherUpdate = (e: CustomEvent) => {
      console.log(`${id} received update, sync enabled: ${isSyncEnabled}`, e.detail);
      
      if (!isSyncEnabled) {
        console.log(`Update received for ${id} but sync is disabled, ignoring`);
        return;
      }

      const canvas = fabricRef.current;
      if (!canvas) {
        console.error(`Canvas ref is null for ${id}`);
        return;
      }

      // Make sure we're in the student or split-mode view
      const isValidView = window.location.pathname.includes('/student') || 
                         window.location.pathname.includes('/split-mode');
      
      if (!isValidView) {
        console.log(`Not in student or split-mode view, ignoring update for ${id}`);
        return;
      }

      // Verify this update is meant for this specific board
      if (e.detail.targetId !== id) {
        console.log(`Update not meant for this board. Target: ${e.detail.targetId}, This board: ${id}`);
        return;
      }

      console.log(`${id} processing update from teacher board (sync enabled: ${isSyncEnabled})`, e.detail);

      try {
        util
          .enlivenObjects([e.detail.object])
          .then((objects: FabricObject[]) => {
            objects.forEach((obj) => {
              obj.selectable = true;
              obj.evented = true;
              canvas.add(obj);
              canvas.renderAll();
            });
            console.log(`Object successfully added to ${id} from teacher update`);
          })
          .catch((err) => {
            console.error("Failed to enliven object", err);
            if (shouldShowToastForBoard(id)) {
              toast.error("Could not sync object to this board.");
            }
          });
      } catch (error) {
        console.error("Error processing teacher update:", error);
        if (shouldShowToastForBoard(id)) {
          toast.error("Error syncing content from teacher's board");
        }
      }
    };

    console.log(`${id} is listening for teacher-update events (sync: ${isSyncEnabled})`);
    window.addEventListener("teacher-update", handleTeacherUpdate as EventListener);
    
    return () => {
      window.removeEventListener(
        "teacher-update",
        handleTeacherUpdate as EventListener
      );
      console.log(`${id} stopped listening for teacher-update events`);
    };
  }, [fabricRef, id, isSyncEnabled]);
};
