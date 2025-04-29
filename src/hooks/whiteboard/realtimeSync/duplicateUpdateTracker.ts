
/**
 * Manages tracking of already processed updates to prevent duplicates
 */
export class DuplicateUpdateTracker {
  private updateIds: Set<string> = new Set(); // Track already processed updates
  private contentHashes: Map<string, number> = new Map(); // Track content hashes with timestamps
  
  /**
   * Check if an update has been seen recently
   */
  hasRecentDuplicate(contentHash: string): boolean {
    if (!contentHash) {
      return false;
    }
    
    const now = Date.now();
    if (this.contentHashes.has(contentHash)) {
      const lastSeenTime = this.contentHashes.get(contentHash) || 0;
      // If we've seen this exact content within the last 5 seconds, skip it
      if (now - lastSeenTime < 5000) {
        console.log('Skipping duplicate update (by content hash)');
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Record that we've seen this content
   */
  recordUpdate(contentHash: string): void {
    this.contentHashes.set(contentHash, Date.now());
    this.updateIds.add(contentHash);
    
    // Limit size of tracking set to prevent memory leaks
    if (this.updateIds.size > 30) {
      // Convert to array, remove oldest entries, and convert back to Set
      const idArray = Array.from(this.updateIds);
      this.updateIds = new Set(idArray.slice(-15)); // Keep only the most recent 15
    }
  }
  
  /**
   * Check if we've already processed this update ID
   */
  hasProcessed(contentHash: string): boolean {
    return this.updateIds.has(contentHash);
  }
  
  /**
   * Clean old hashes to prevent memory leaks
   */
  cleanOldHashes(): void {
    const now = Date.now();
    this.contentHashes.forEach((timestamp, hash) => {
      if (now - timestamp > 60000) { // Clear hashes older than 1 minute
        this.contentHashes.delete(hash);
      }
    });
  }
  
  /**
   * Clear all tracking data
   */
  clearTracking(): void {
    this.updateIds.clear();
    this.contentHashes.clear();
  }
}
