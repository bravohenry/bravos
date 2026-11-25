/**
 * Polyfill for use-sync-external-store shim compatibility with React 19
 * React 19 has useSyncExternalStore built-in, so we re-export it directly
 * 
 * [INPUT]: Uses React's built-in useSyncExternalStore hook
 * [OUTPUT]: Exports useSyncExternalStore for compatibility with packages expecting the shim
 * [POS]: Compatibility layer for React 19 + swr/@ai-sdk/react
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useSyncExternalStore } from "react";

// Re-export React's built-in useSyncExternalStore
// This allows packages like swr that expect use-sync-external-store/shim to work with React 19
export { useSyncExternalStore };

// Default export for compatibility
export default useSyncExternalStore;
