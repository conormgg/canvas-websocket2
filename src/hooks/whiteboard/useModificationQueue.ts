
import { useCallback, useRef } from 'react';

export interface ModificationQueueOptions {
  processDelay?: number;
}

export const useModificationQueue = (options: ModificationQueueOptions = {}) => {
  const { processDelay = 10 } = options;
  const isProcessingModification = useRef<boolean>(false);
  const modificationQueue = useRef<Array<() => void>>([]);
  
  // Process the next modification in queue
  const processNextModification = useCallback(() => {
    if (modificationQueue.current.length === 0) {
      isProcessingModification.current = false;
      return;
    }
    
    const nextModification = modificationQueue.current.shift();
    if (nextModification) {
      try {
        nextModification();
      } finally {
        // Schedule next processing with a small delay to prevent UI freeze
        setTimeout(processNextModification, processDelay);
      }
    } else {
      isProcessingModification.current = false;
    }
  }, [processDelay]);

  // Queue a modification and process if not already processing
  const queueModification = useCallback((modification: () => void) => {
    modificationQueue.current.push(modification);
    
    if (!isProcessingModification.current) {
      isProcessingModification.current = true;
      processNextModification();
    }
  }, [processNextModification]);

  return {
    queueModification,
    isProcessing: () => isProcessingModification.current
  };
};
