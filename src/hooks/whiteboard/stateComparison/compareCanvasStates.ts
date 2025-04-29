
import { CanvasStateComparisonProps } from '../types';

/**
 * Helper function to compare two canvas states more efficiently
 * @param param0 Object containing state1 and state2 to compare
 * @returns Boolean indicating whether the states are considered equal
 */
export const areCanvasStatesEqual = ({ state1, state2 }: CanvasStateComparisonProps): boolean => {
  if (!state1 || !state2) return false;
  
  try {
    const objects1 = state1.objects || [];
    const objects2 = state2.objects || [];
    
    // Different number of objects means they're not equal
    if (objects1.length !== objects2.length) return false;
    
    // No objects means equal (if both arrays exist and have length 0)
    if (objects1.length === 0 && objects2.length === 0) return true;

    // For a quick check, just compare the object counts by type
    const typeCount1: Record<string, number> = {};
    const typeCount2: Record<string, number> = {};
    
    objects1.forEach((obj: any) => {
      if (!obj) return;
      const type = obj.type || 'unknown';
      typeCount1[type] = (typeCount1[type] || 0) + 1;
    });
    
    objects2.forEach((obj: any) => {
      if (!obj) return;
      const type = obj.type || 'unknown';
      typeCount2[type] = (typeCount2[type] || 0) + 1;
    });
    
    // Check if the count of each type matches
    for (const type in typeCount1) {
      if (typeCount1[type] !== typeCount2[type]) return false;
    }
    
    // More detailed comparison for path objects (which cause most duplication issues)
    const pathObjects1 = objects1.filter((obj: any) => obj?.type === 'path');
    const pathObjects2 = objects2.filter((obj: any) => obj?.type === 'path');
    
    if (pathObjects1.length !== pathObjects2.length) return false;
    
    // Compare path IDs - if they're the same, it's likely the same update
    const pathIds1 = new Set(pathObjects1.map((obj: any) => obj.id).filter(Boolean));
    const pathIds2 = new Set(pathObjects2.map((obj: any) => obj.id).filter(Boolean));
    
    // If all path IDs match, consider it the same state
    if (pathIds1.size === pathIds2.size && 
        pathIds1.size > 0 && 
        [...pathIds1].every(id => pathIds2.has(id))) {
      return true;
    }
    
    // Create a map of object IDs for deeper comparison
    const objectMap = new Map<string, any>();
    objects1.forEach((obj: any) => {
      if (obj?.id) objectMap.set(obj.id, obj);
    });
    
    // Check if all objects in state2 match objects in state1
    for (const obj of objects2) {
      if (!obj?.id || !objectMap.has(obj.id)) return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error comparing canvas states:', e);
    // Default to not equal in case of error
    return false;
  }
};
