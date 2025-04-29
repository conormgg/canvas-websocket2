
import { supabase } from "@/integrations/supabase/client";
import { WhiteboardId } from "@/types/canvas";

/**
 * Service for managing whiteboard data in Supabase
 */
export class WhiteboardDataService {
  /**
   * Clear database of all whiteboard drawings
   */
  static async clearAllWhiteboardData(): Promise<void> {
    try {
      console.log('Clearing all whiteboard data from database');
      const { error } = await supabase
        .from('whiteboard_objects')
        .delete()
        .neq('id', 'placeholder'); // Delete all records
      
      if (error) {
        console.error('Error clearing whiteboard data:', error);
        return;
      }
      
      console.log('All whiteboard data cleared successfully');
    } catch (err) {
      console.error('Failed to clear whiteboard data:', err);
    }
  }

  /**
   * Load existing content from Supabase
   */
  static async loadExistingContent(boardId: WhiteboardId): Promise<Record<string, any> | null> {
    try {
      console.log(`Loading existing content for board: ${boardId}`);
      
      // For board pairs, check both boards' content
      let query;
      if (boardId === "teacher2" || boardId === "student2") {
        query = supabase
          .from('whiteboard_objects')
          .select('object_data, board_id')
          .in('board_id', ['teacher2', 'student2'])
          .order('created_at', { ascending: false })
          .limit(1);
      } else if (boardId === "teacher1" || boardId === "student1") {
        query = supabase
          .from('whiteboard_objects')
          .select('object_data, board_id')
          .in('board_id', ['teacher1', 'student1'])
          .order('created_at', { ascending: false })
          .limit(1);
      } else if (boardId === "teacher3" || boardId === "student3") {
        query = supabase
          .from('whiteboard_objects')
          .select('object_data, board_id')
          .in('board_id', ['teacher3', 'student3'])
          .order('created_at', { ascending: false })
          .limit(1);
      } else if (boardId === "teacher4" || boardId === "student4") {
        query = supabase
          .from('whiteboard_objects')
          .select('object_data, board_id')
          .in('board_id', ['teacher4', 'student4'])
          .order('created_at', { ascending: false })
          .limit(1);
      } else if (boardId === "teacher5" || boardId === "student5") {
        query = supabase
          .from('whiteboard_objects')
          .select('object_data, board_id')
          .in('board_id', ['teacher5', 'student5'])
          .order('created_at', { ascending: false })
          .limit(1);
      } else {
        query = supabase
          .from('whiteboard_objects')
          .select('object_data, board_id')
          .eq('board_id', boardId)
          .order('created_at', { ascending: false })
          .limit(1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching existing content:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        console.log(`Found existing content for board ${boardId} (data from board: ${data[0].board_id})`);
        const objectData = data[0].object_data;
        
        // Type guard to ensure objectData is a valid Record<string, any>
        if (objectData && typeof objectData === 'object' && !Array.isArray(objectData)) {
          return objectData as Record<string, any>;
        } else {
          console.error('Received invalid object data format:', objectData);
          return null;
        }
      } else {
        console.log(`No content found for board ${boardId}`);
      }
      
      return null;
    } catch (err) {
      console.error('Failed to load existing content:', err);
      return null;
    }
  }
}
