
import { useEffect } from "react";
import { Canvas, FabricObject, util } from "fabric";
import { toast } from "sonner";
import { WhiteboardId } from "@/types/canvas";
import { Link } from "lucide-react";
import { useSyncContext } from "@/context/SyncContext";

export const useTeacherBoardUpdates = (
  id: WhiteboardId,
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const { isSyncEnabled, syncMode } = useSyncContext();
  
  useEffect(() => {
    // Only teacher boards should listen for updates
    if (id !== "teacher") return;
    // Don't listen if sync is disabled
    if (!isSyncEnabled) return;

    const handleTeacherBoardUpdate = (e: CustomEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      // Generate a unique identifier for this specific canvas instance
      // This prevents a board from processing its own events in SyncTestView
      const canvasInstanceId = canvas.lowerCanvasEl?.id || canvas.upperCanvasEl?.id || "";

      // Check if this update came from this specific canvas instance
      if (e.detail.sourceId === id && e.detail.canvasInstanceId === canvasInstanceId) {
        console.log("Skipping update from self to prevent infinite loop");
        return;
      }
      
      // In one-way mode, only the primary board should affect others
      if (syncMode === "one-way" && e.detail.sourceId !== "teacher") {
        console.log("One-way sync: ignoring updates from secondary boards");
        return;
      }

      console.log(`Teacher board ${id} received update from ${e.detail.sourceId}:`, e.detail);

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
            
            toast.info("Received update from linked board", {
              icon: <Link className="h-4 w-4 text-green-500" />
            });
          })
          .catch((err) => {
            console.error("Failed to enliven object", err);
            toast.error("Could not sync object to this board.");
          });
      } catch (error) {
        console.error("Error processing teacher board update", error);
        toast.error("Error processing sync update");
      }
    };

    window.addEventListener("teacher-board-update", handleTeacherBoardUpdate as EventListener);
    return () =>
      window.removeEventListener(
        "teacher-board-update",
        handleTeacherBoardUpdate as EventListener
      );
  }, [fabricRef, id, isSyncEnabled, syncMode]);
};
