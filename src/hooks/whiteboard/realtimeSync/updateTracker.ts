
import { WhiteboardId } from "@/types/canvas";
import { UpdateThrottling, UpdateHashTracking } from "./types";

/**
 * Tracks and manages update frequency to prevent infinite loops and duplicate updates
 */
export class UpdateTracker {
  private static lastInsertTimestamps = new Map<string, number>();
  private static updateCounts = new Map<string, number>();
  private static resetCountsInterval: number | null = null;
  private static MIN_UPDATE_INTERVAL = 1000; // 1 second minimum between updates
  private static latestUpdateHashes = new Map<string, string>(); // Hash tracking
  private static updateHistory: UpdateHashTracking[] = []; // Keep track of recent updates
  
  // Static initialization
  static {
    // Reset update counts every minute to prevent permanent throttling
    UpdateTracker.resetCountsInterval = window.setInterval(() => {
      UpdateTracker.updateCounts.clear();
      // Cleanup old entries from history (older than 1 minute)
      const now = Date.now();
      UpdateTracker.updateHistory = UpdateTracker.updateHistory.filter(
        entry => now - entry.timestamp < 60000
      );
    }, 60000);
  }
  
  /**
   * Clean up tracker resources
   */
  static cleanup(): void {
    if (UpdateTracker.resetCountsInterval) {
      clearInterval(UpdateTracker.resetCountsInterval);
      UpdateTracker.resetCountsInterval = null;
    }
  }
  
  /**
   * Check if an update should be throttled based on rate limiting
   */
  static shouldThrottle(boardId: WhiteboardId): boolean {
    const now = Date.now();
    const lastUpdateTime = this.lastInsertTimestamps.get(boardId) || 0;
    
    // Update the count of updates for this board
    const currentCount = this.updateCounts.get(boardId) || 0;
    this.updateCounts.set(boardId, currentCount + 1);
    
    // If we're getting too many updates in a short time, it might be an infinite loop
    if (currentCount > 30) { // More than 30 updates per minute might indicate a loop
      console.warn(`Possible infinite loop detected for board ${boardId}, throttling updates`);
      
      // Only process 1 in 10 updates until the counter resets (aggressive throttling)
      if (currentCount % 10 !== 0) {
        return true;
      }
    }
    
    // Basic rate limiting
    if (now - lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
      console.log(`Throttling update for board ${boardId}, too soon after last update`);
      return true;
    }
    
    // Update the timestamp
    this.lastInsertTimestamps.set(boardId, now);
    return false;
  }
  
  /**
   * Check if an update is a duplicate based on content hash
   */
  static isDuplicate(boardId: WhiteboardId, payloadHash: string): boolean {
    const lastHash = this.latestUpdateHashes.get(boardId);
    
    // If this is the same as the last update we processed for this board, skip it
    if (lastHash === payloadHash) {
      console.log(`Skipping duplicate update for board ${boardId}`);
      return true;
    }
    
    // Check if we've seen this hash recently across any board (more aggressive duplicate detection)
    const isDuplicateAcrossBoards = this.updateHistory.some(
      entry => entry.hash === payloadHash && Date.now() - entry.timestamp < 5000
    );
    
    if (isDuplicateAcrossBoards) {
      console.log(`Skipping cross-board duplicate update for ${boardId}`);
      return true;
    }
    
    // Store this hash for future duplicate detection
    this.latestUpdateHashes.set(boardId, payloadHash);
    this.updateHistory.push({
      boardId,
      hash: payloadHash,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.updateHistory.length > 50) {
      this.updateHistory.shift();
    }
    
    return false;
  }
}
