
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
    // Only student boards should listen for updates from teacher
    if (id !== "student1") return;

    const handleTeacherUpdate = (e: CustomEvent) => {
      if (!isSyncEnabled) return;

      const canvas = fabricRef.current;
      if (!canvas) return;

      console.log(`Student board ${id} received update:`, e.detail);

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
