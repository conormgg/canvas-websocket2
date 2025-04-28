
import { useEffect } from "react";
import { Canvas, FabricObject, util } from "fabric";
import { toast } from "sonner";
import { WhiteboardId } from "@/types/canvas";
import { useSyncContext } from "@/context/SyncContext";
import { Link } from "lucide-react";

export const useBoardSync = (
  boardId: WhiteboardId,
  fabricRef: React.MutableRefObject<Canvas | null>,
  instanceId: string,
) => {
  const { isSyncEnabled, syncMode, sendUpdate } = useSyncContext();

  // Send updates when objects are added
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    const handleObjectAdded = (e: any) => {
      if (!isSyncEnabled || syncMode === "off") return;
      if (!e.target) return;
      
      // Only teacher boards should send updates in one-way mode
      if (syncMode === "one-way" && boardId !== "teacher") {
        return;
      }
      
      try {
        const objectData = e.target.toJSON();
        console.log(`Board ${boardId} (${instanceId}) added object, sending update in ${syncMode} mode`);
        sendUpdate(objectData, boardId, instanceId);
      } catch (err) {
        console.error("Failed to send object update:", err);
      }
    };
    
    canvas.on('object:added', handleObjectAdded);
    
    return () => {
      canvas.off('object:added', handleObjectAdded);
    };
  }, [fabricRef, boardId, isSyncEnabled, syncMode, instanceId, sendUpdate]);

  // Receive updates from other boards
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const handleBoardUpdate = (e: CustomEvent) => {
      if (!isSyncEnabled || syncMode === "off") return;
      
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      const eventData = e.detail;
      
      // Skip updates from self to prevent infinite loops
      if (eventData.instanceId === instanceId) {
        console.log(`Skipping update from self (${instanceId}) to prevent loop`);
        return;
      }
      
      // In one-way mode, student board should only receive, not send
      if (syncMode === "one-way") {
        // If this is a teacher board, only accept updates from teacher-view teacher board
        if (boardId === "teacher" && eventData.sourceId === "teacher") {
          console.log("One-way sync: Teacher board ignoring updates from other teachers");
          return;
        }
        
        // If this is a student board, only accept updates from teacher boards
        if (boardId !== "teacher" && eventData.sourceId !== "teacher") {
          console.log("One-way sync: Student board ignoring updates from non-teacher boards");
          return;
        }
      }
      
      console.log(`Board ${boardId} (${instanceId}) received update from ${eventData.sourceId}`);
      
      try {
        util.enlivenObjects([eventData.object])
          .then((objects: FabricObject[]) => {
            objects.forEach((obj) => {
              obj.selectable = true;
              obj.evented = true;
              canvas.add(obj);
            });
            canvas.renderAll();
            
            toast.info(`Received update from ${eventData.sourceId === "teacher" ? "teacher" : "student"} board`, {
              icon: <Link className="h-4 w-4 text-green-500" />
            });
          })
          .catch((err) => {
            console.error("Failed to add synced object:", err);
            toast.error("Failed to sync object to this board");
          });
      } catch (error) {
        console.error("Error processing board update:", error);
      }
    };

    window.addEventListener("board-sync-update", handleBoardUpdate as EventListener);
    return () => {
      window.removeEventListener("board-sync-update", handleBoardUpdate as EventListener);
    };
  }, [fabricRef, boardId, instanceId, isSyncEnabled, syncMode]);
  
  return {
    isSyncEnabled,
    syncMode
  };
};
