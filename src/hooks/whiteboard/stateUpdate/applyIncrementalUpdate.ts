
import { IncrementalUpdateProps, ExtendedFabricObject } from '../types';
import { FabricObject, util as fabricUtil } from 'fabric';

/**
 * Helper function to apply incremental updates to a canvas safely
 * @param param0 Object containing canvas and newState to apply
 */
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
      
      // Track if we've made any changes to avoid unnecessary renders
      let madeChanges = false;
      
      // Process each object in the new state
      const promises: Promise<void>[] = [];
      
      for (const objData of newState.objects) {
        // If we have an ID field, we can use it to match objects
        const objId = objData.id || null;
        
        if (objId && currentObjectsMap.has(objId)) {
          // Object exists, update its properties
          const existingObj = currentObjectsMap.get(objId);
          
          // Remove from map to track which ones were processed
          currentObjectsMap.delete(objId);
          
          if (existingObj) {
            // Update the object properties instead of replacing it
            let hasChanges = false;
            Object.keys(objData).forEach(key => {
              if (key !== 'id') {
                // Only update if the value is actually different
                if (JSON.stringify(existingObj.get(key)) !== JSON.stringify(objData[key])) {
                  existingObj.set(key, objData[key]);
                  hasChanges = true;
                }
              }
            });
            
            // Mark as modified only if changes were made
            if (hasChanges) {
              existingObj.setCoords();
              madeChanges = true;
            }
          }
        } else if (objId) {
          // New object, need to add it
          // Use Fabric.js v6 Promise API for enliven
          const promise = fabricUtil.enlivenObjects([objData])
            .then((enlivenedObjects: FabricObject[]) => {
              if (enlivenedObjects.length > 0) {
                const newObj = enlivenedObjects[0] as ExtendedFabricObject;
                if (!newObj.id && objId) {
                  // Ensure the ID is preserved
                  newObj.id = objId;
                }
                canvas.add(newObj);
                madeChanges = true;
              }
            })
            .catch(err => {
              console.error('Error enliving object:', err);
            });
          
          promises.push(promise);
        }
      }
      
      // Wait for all new objects to be added
      Promise.all(promises).then(() => {
        // Objects remaining in the map weren't in the new state, remove them
        let removedObjects = false;
        currentObjectsMap.forEach(obj => {
          canvas.remove(obj);
          removedObjects = true;
        });
        
        if (removedObjects) {
          madeChanges = true;
        }
        
        // Fix: Ensure the currentVPT array has exactly 6 elements before using it
        if (currentVPT && currentVPT.length === 6) {
          canvas.setViewportTransform(currentVPT as [number, number, number, number, number, number]);
        }
        
        // Update background if it changed
        if (newState.background && canvas.backgroundColor !== newState.background) {
          canvas.backgroundColor = newState.background;
          madeChanges = true;
        }
        
        // Render the changes without a full reload, but only if we made actual changes
        if (madeChanges) {
          canvas.renderAll();
        }
      });
    }
  } catch (err) {
    console.error('Error applying incremental update:', err);
  }
};
