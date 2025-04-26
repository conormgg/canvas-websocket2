
import { Button } from "@/components/ui/button";
import { useSyncContext } from "@/context/SyncContext";
import { Link } from "lucide-react";
import { toast } from "sonner";

export const SyncToggle = () => {
  const { isSyncEnabled, toggleSync } = useSyncContext();
  
  const handleToggle = () => {
    toggleSync();
    toast(isSyncEnabled ? "Sync disabled" : "Sync enabled");
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="fixed bottom-4 right-4 z-50"
    >
      <Link className={isSyncEnabled ? "text-green-500" : "text-gray-400"} />
      {isSyncEnabled ? "Sync On" : "Sync Off"}
    </Button>
  );
};

