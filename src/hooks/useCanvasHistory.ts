
import { useRef, useEffect } from 'react';
import { Canvas, ActiveSelection } from 'fabric';

export const useCanvasHistory = (fabricRef: React.MutableRefObject<Canvas | null>) => {
  const historyRef = useRef<string[]>([]);
  const currentStateIndexRef = useRef(-1);
  const isUndoRedoOperationRef = useRef(false);
  
  // Initialize the history with the current state
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Save initial state
    const initialState = canvas.toJSON();
    historyRef.current = [JSON.stringify(initialState)];
    currentStateIndexRef.current = 0;
    
    // Listen for canvas modifications to save history
    const saveHistory = () => {
      if (isUndoRedoOperationRef.current) {
        isUndoRedoOperationRef.current = false;
        return;
      }
      
      try {
        // Save current state
        const currentState = canvas.toJSON();
        const json = JSON.stringify(currentState);
        
        // If we've undone some changes and then do something new,
        // we need to remove all states after current index
        if (currentStateIndexRef.current < historyRef.current.length - 1) {
          historyRef.current = historyRef.current.slice(0, currentStateIndexRef.current + 1);
        }
        
        historyRef.current.push(json);
        currentStateIndexRef.current = historyRef.current.length - 1;
        
        // Limit history to prevent memory issues (keep last 30 states)
        if (historyRef.current.length > 30) {
          historyRef.current.shift();
          currentStateIndexRef.current--;
        }
      } catch (err) {
        console.error('Error saving canvas history:', err);
      }
    };
    
    // Register events that should trigger history save
    canvas.on('object:modified', saveHistory);
    canvas.on('object:added', saveHistory);
    canvas.on('object:removed', saveHistory);
    
    return () => {
      canvas.off('object:modified', saveHistory);
      canvas.off('object:added', saveHistory);
      canvas.off('object:removed', saveHistory);
    };
  }, [fabricRef]);
  
  const undo = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    if (currentStateIndexRef.current > 0) {
      isUndoRedoOperationRef.current = true;
      currentStateIndexRef.current--;
      const previousState = historyRef.current[currentStateIndexRef.current];
      canvas.loadFromJSON(JSON.parse(previousState), () => {
        canvas.renderAll();
        console.log('Undo complete');
      });
      return true;
    }
    return false;
  };
  
  const redo = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    if (currentStateIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoOperationRef.current = true;
      currentStateIndexRef.current++;
      const nextState = historyRef.current[currentStateIndexRef.current];
      canvas.loadFromJSON(JSON.parse(nextState), () => {
        canvas.renderAll();
        console.log('Redo complete');
      });
      return true;
    }
    return false;
  };

  const selectAll = () => {
    const canvas = fabricRef.current;
    if (!canvas) return false;

    // Select all objects in the canvas
    const objects = canvas.getObjects();
    if (objects.length > 0) {
      canvas.discardActiveObject();
      const selection = new ActiveSelection(objects, { canvas });
      canvas.setActiveObject(selection);
      canvas.requestRenderAll();
      return true;
    }
    return false;
  };
  
  return { undo, redo, selectAll };
};
