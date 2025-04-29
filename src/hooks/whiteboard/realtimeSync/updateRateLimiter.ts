
/**
 * Handles rate limiting for updates to prevent infinite loops
 */
export class UpdateRateLimiter {
  private updateCounter: number = 0;
  private lastUpdateTimestamp: number = 0;
  private MAX_UPDATES_PER_MINUTE: number = 60; // Reduced limit to prevent infinite loops
  
  constructor() {
    this.resetUpdateCounter();
  }
  
  /**
   * Reset the update counter every minute to prevent permanent throttling
   */
  private resetUpdateCounter(): void {
    setInterval(() => {
      this.updateCounter = 0;
    }, 60000); // Reset counter every minute
  }
  
  /**
   * Check if we're exceeding the rate limit
   */
  isRateLimited(): boolean {
    this.updateCounter++;
    if (this.updateCounter > this.MAX_UPDATES_PER_MINUTE) {
      console.warn('Update rate limit exceeded, possible infinite loop detected');
      // Skip every other update when rate limited
      return (this.updateCounter % 2 === 0);
    }
    return false;
  }
  
  /**
   * Check if we should throttle based on time since last update
   */
  shouldThrottle(currentTime: number): boolean {
    return (currentTime - this.lastUpdateTimestamp < 300); // Increased delay between updates
  }
  
  /**
   * Update the timestamp of the last update
   */
  recordUpdate(timestamp: number): void {
    this.lastUpdateTimestamp = timestamp;
  }
  
  /**
   * Get the last update timestamp
   */
  getLastUpdateTimestamp(): number {
    return this.lastUpdateTimestamp;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.updateCounter = 0;
    this.lastUpdateTimestamp = 0;
  }
}
