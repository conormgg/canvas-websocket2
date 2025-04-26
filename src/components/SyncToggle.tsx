
import { Button } from "@/components/ui/button";
import { useSyncContext } from "@/context/SyncContext";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export const SyncToggle = () => {
  const { isSyncEnabled, toggleSync } = useSyncContext();
  
  const handleToggle = () => {
    toggleSync();
    toast(isSyncEnabled ? "Sync disabled" : "Sync enabled");
  };
  
  return (
    <Button
      variant={isSyncEnabled ? "default" : "destructive"}
      size="lg"
      onClick={handleToggle}
      className="fixed bottom-8 right-8 z-[100] shadow-lg"
    >
      {isSyncEnabled ? (
        <ToggleRight className="text-white mr-2" />
      ) : (
        <ToggleLeft className="text-white mr-2" />
      )}
      {isSyncEnabled ? "Sync On" : "Sync Off"}
    </Button>
  );
};
