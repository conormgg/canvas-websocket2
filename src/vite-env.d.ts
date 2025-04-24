
/// <reference types="vite/client" />

// Add global variables for whiteboard functionality
interface Window {
  __wbActiveBoard?: HTMLElement | null;
  __wbActiveBoardId?: string | null;
}
