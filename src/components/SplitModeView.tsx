
import { Whiteboard } from "./Whiteboard";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const SplitModeView = () => {
  // Define only the first two pairs of teacher-student boards
  const boardPairs = [
    { teacher: "teacher1", student: "student1" },
    { teacher: "teacher2", student: "student2" },
  ];

  const [syncActive, setSyncActive] = useState(true);

  // Add clear cache button functionality
  const handleClearCache = () => {
    // Clear all supabase channel cache
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('supabase-channel-')) {
        localStorage.removeItem(key);
      }
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('supabase-channel-')) {
        sessionStorage.removeItem(key);
      }
    }

    // Close all active Supabase connections to force a reconnect
    supabase.realtime.disconnect();
    
    toast.success("Cache cleared successfully. Page will refresh in 1 second.");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleClearAllData = async () => {
    try {
      // Clear all whiteboard data from the database
      const { error } = await supabase
        .from('whiteboard_objects')
        .delete()
        .neq('id', 'placeholder');
      
      if (error) {
        console.error('Error clearing whiteboard data:', error);
        toast.error('Failed to clear whiteboard data');
        return;
      }
      
      toast.success("All whiteboard data cleared. Refreshing page in 1 second.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Failed to clear whiteboard data:', err);
      toast.error('Failed to clear whiteboard data');
    }
  };

  // Clear cache on mount to ensure fresh connections
  useEffect(() => {
    handleClearCache();
    
    // Show a toast to inform user
    toast("Sync is enabled between teacher and student boards");
    
    return () => {
      // Clean up Supabase connections when component unmounts
      supabase.realtime.disconnect();
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E8EDF5] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between p-2">
        <div className="text-lg font-medium flex flex-col">
          <span className="text-green-600">
            Real-time synchronization active between teacher and student boards
          </span>
          <span className="text-sm text-blue-700 mt-1">
            Changes on teacher boards will automatically sync to student boards
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={handleClearCache}
          >
            Clear Cache & Reconnect
          </button>
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            onClick={handleClearAllData}
          >
            Clear All Drawing Data
          </button>
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
