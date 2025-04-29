
/**
 * Utility for generating content hashes to identify unique updates
 */
export class ContentHashGenerator {
  /**
   * Generate a unique hash for an update to prevent duplicates
   */
  static generateContentHash(objectData: Record<string, any>): string {
    if (!objectData || !objectData.objects) return '';
    
    try {
      // Extract only essential data for comparing updates
      const essentialData = {
        objectCount: objectData.objects?.length || 0,
        objects: objectData.objects?.map((obj: any) => ({
          id: obj.id || '',
          type: obj.type || '',
          top: Math.round(obj.top || 0),
          left: Math.round(obj.left || 0),
          // For path objects, use a more detailed hash
          path: obj.path ? JSON.stringify(obj.path).substring(0, 100) : '', 
          points: obj.points ? JSON.stringify(obj.points).substring(0, 100) : ''
        }))
      };
      return JSON.stringify(essentialData);
    } catch (err) {
      console.error('Error generating content hash:', err);
      return Date.now().toString(); // Fallback to timestamp if hash generation fails
    }
  }
}
