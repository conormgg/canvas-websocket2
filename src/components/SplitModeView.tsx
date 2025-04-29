
import { useState, useEffect } from "react";
import { Whiteboard } from "./Whiteboard";
import { SyncToggle } from "./SyncToggle";
import { SupabaseSync } from "@/hooks/whiteboard/supabaseSync";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const SplitModeView = () => {
  // Define only the first two pairs of teacher-student boards
  const boardPairs = [
    { teacher: "teacher1", student: "student1" },
    { teacher: "teacher2", student: "student2" },
  ];
  
  const [isClearing, setIsClearing] = useState(false);

  // Clear all channels and cached data, then force refresh
  const handleClearCache = () => {
    setIsClearing(true);
    
    try {
      // Clear all SupabaseSync caches
      SupabaseSync.clearCache();
      
      // Force a page refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      toast.success("Cache cleared! Refreshing page...");
    } catch (err) {
      console.error("Error clearing cache:", err);
      toast.error("Failed to clear cache");
      setIsClearing(false);
    }
  };
  
  // Clear all drawing data from database (irreversible)
  const handleClearAllData = async () => {
    if (!window.confirm("This will permanently delete ALL whiteboard data. Continue?")) {
      return;
    }
    
    setIsClearing(true);
    
    try {
      // First clear all cached channels
      SupabaseSync.clearCache();
      
      // Delete all whiteboard data
      const { error } = await supabase
        .from('whiteboard_objects')
        .delete()
        .neq('board_id', 'dummy'); // Delete all records
      
      if (error) throw error;
      
      toast.success("All whiteboard data deleted! Refreshing page...");
      
      // Force refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Error clearing whiteboard data:", err);
      toast.error("Failed to clear whiteboard data");
      setIsClearing(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between p-2">
        <div className="text-lg font-medium flex flex-col">
          <span className="text-green-600">
            Real-time synchronization active between teacher and student boards
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClearCache} 
            disabled={isClearing}
            className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300"
          >
            {isClearing ? "Clearing..." : "Clear Cache & Reconnect"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClearAllData} 
            disabled={isClearing}
            className="bg-red-100 hover:bg-red-200 border-red-300"
          >
            {isClearing ? "Clearing..." : "Clear All Drawing Data"}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 h-[calc(100vh-180px)]">
        {/* First row - Teacher's View 1 and Student's View 1 */}
        <div className="flex gap-4 h-1/2">
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 1
            </div>
            <Whiteboard id="teacher1" isSplitScreen={true} />
          </div>
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Student's View 1
            </div>
            <Whiteboard id="student1" isSplitScreen={true} />
          </div>
        </div>
        
        {/* Second row - Teacher's View 2 and Student's View 2 */}
        <div className="flex gap-4 h-1/2">
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Teacher's View 2
            </div>
            <Whiteboard id="teacher2" isSplitScreen={true} />
          </div>
          <div className="w-1/2 h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-2 left-2 px-3 py-1 bg-sidebar-primary text-white text-sm font-medium rounded-md">
              Student's View 2
            </div>
            <Whiteboard id="student2" isSplitScreen={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
