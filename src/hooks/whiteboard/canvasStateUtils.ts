
import { CanvasStateComparisonProps, IncrementalUpdateProps, ExtendedFabricObject } from './types';
import { FabricObject, util as fabricUtil, Canvas } from 'fabric';

// Helper function to compare two canvas states
export const areCanvasStatesEqual = ({ state1, state2 }: CanvasStateComparisonProps): boolean => {
  if (!state1 || !state2) return false;
  // Compare objects array length as a quick check
  if (state1.objects?.length !== state2.objects?.length) return false;
  
  // For deeper comparison, we use JSON stringify but this could be optimized further
  // by implementing a more efficient diff algorithm
  return JSON.stringify(state1) === JSON.stringify(state2);
};

// Helper function to apply incremental updates to a canvas
export const applyIncrementalUpdate = ({ canvas, newState }: IncrementalUpdateProps): void => {
  if (!newState || !newState.objects || !Array.isArray(newState.objects)) {
    console.error('Invalid canvas state data for incremental update');
    return;
  }

  try {
    // Only clear if there are objects to replace them with
    if (newState.objects.length > 0) {
      // Store current viewport transform
      const currentVPT = canvas.viewportTransform ? [...canvas.viewportTransform] : null;
      
      // We'll update objects incrementally without clearing the canvas
      const currentObjectsMap = new Map<string, ExtendedFabricObject>();
      
      // Index current objects by their IDs for quick lookup
      canvas.getObjects().forEach((obj) => {
        const extendedObj = obj as ExtendedFabricObject;
        if (extendedObj.id) {
          currentObjectsMap.set(extendedObj.id, extendedObj);
        }
      });
      
      // Process each object in the new state
      newState.objects.forEach((objData: any) => {
        // If we have an ID field, we can use it to match objects
        const objId = objData.id || null;
        
        if (objId && currentObjectsMap.has(objId)) {
          // Object exists, update its properties
          const existingObj = currentObjectsMap.get(objId);
          
          // Remove from map to track which ones were processed
          currentObjectsMap.delete(objId);
          
          if (existingObj) {
            // Update the object properties instead of replacing it
            // This prevents flickering by maintaining the object's presence
            Object.keys(objData).forEach(key => {
              if (key !== 'id') {
                existingObj.set(key, objData[key]);
              }
            });
            
            // Mark as modified
            existingObj.setCoords();
            canvas.fire('object:modified', { target: existingObj });
          }
        } else {
          // New object, need to add it
          // Use fabric's ability to create objects from serialized data
          // Fix for Fabric.js v6: Use callback parameter directly instead of onComplete property
          fabricUtil.enlivenObjects([objData], (enlivenedObjects: FabricObject[]) => {
            if (enlivenedObjects.length > 0) {
              const newObj = enlivenedObjects[0] as ExtendedFabricObject;
              if (!newObj.id && objId) {
                // Ensure the ID is preserved
                newObj.id = objId;
              }
              canvas.add(newObj);
            }
          });
        }
      });
      
      // Objects remaining in the map weren't in the new state, remove them
      // Only if the new state has a complete list of objects
      if (newState.hasOwnProperty('objects') && Array.isArray(newState.objects)) {
        currentObjectsMap.forEach(obj => {
          canvas.remove(obj);
        });
      }
      
      // Fix: Ensure the currentVPT array has exactly 6 elements before using it
      if (currentVPT && currentVPT.length === 6) {
        // TypeScript requires an explicit type assertion here
        canvas.setViewportTransform(currentVPT as [number, number, number, number, number, number]);
      }
      
      // Update background if it changed
      if (newState.background && canvas.backgroundColor !== newState.background) {
        canvas.backgroundColor = newState.background;
      }
      
      // Render the changes without a full reload
      canvas.renderAll();
    }
  } catch (err) {
    console.error('Error applying incremental update:', err);
  }
};
