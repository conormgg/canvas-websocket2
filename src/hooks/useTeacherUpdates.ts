
import { useEffect } from "react";
import { Canvas, FabricObject, util } from "fabric";
import { toast } from "sonner";
import { WhiteboardId } from "@/types/canvas";

export const useTeacherUpdates = (
  id: WhiteboardId,
  fabricRef: React.MutableRefObject<Canvas | null>,
  isSyncEnabled: boolean
) => {
  useEffect(() => {
    // Only update the board with id="teacher" in the student view
    // This corresponds to student's view 1 in the naming convention
    if (id !== "teacher") {
      return;
    }

    const handleTeacherUpdate = (e: CustomEvent) => {
      if (!isSyncEnabled) return;

      const canvas = fabricRef.current;
      if (!canvas) return;

      // Make sure we're in the student view by checking URL
      const isStudentView = window.location.pathname.includes('/student') || 
                          window.location.pathname.includes('/split-mode');
      
      if (!isStudentView) {
        // Don't process updates if we're in teacher view
        return;
      }

      // Verify this update is meant for this specific board
      if (e.detail.targetId !== id) {
        console.log(`Update not meant for this board. Target: ${e.detail.targetId}, This board: ${id}`);
        return;
      }

      console.log(`Student view 1 (teacher board) received update:`, e.detail);

      util
        .enlivenObjects([e.detail.object])
        .then((objects: FabricObject[]) => {
          objects.forEach((obj) => {
            obj.selectable = true;
            obj.evented = true;
            canvas.add(obj);
            canvas.renderAll();
          });
        })
        .catch((err) => {
          console.error("Failed to enliven object", err);
          toast.error("Could not sync object to this board.");
        });
    };

    window.addEventListener("teacher-update", handleTeacherUpdate as EventListener);
    return () =>
      window.removeEventListener(
        "teacher-update",
        handleTeacherUpdate as EventListener
      );
  }, [fabricRef, id, isSyncEnabled]);
};
