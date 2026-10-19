/**
 * Store barrel — import all Zustand stores from a single entry point.
 *
 * Usage:
 *   import { useFeedStore, useNotificationStore, useUIStore } from '../store';
 *
 * Architecture note:
 *   - AuthContext  ← still owns auth tokens, user identity, and follow graph.
 *   - ToastContext ← still owns toast notification display.
 *   - Zustand stores ← own all other shared UI and server-cache state.
 *
 * When to add a new store:
 *   1. State is read by 2+ unrelated components.
 *   2. OR state needs to survive across component remounts (feed scroll position).
 *   3. Do NOT add per-component local state here — keep it in useState.
 */
export { default as useFeedStore } from './useFeedStore';
export { default as useNotificationStore } from './useNotificationStore';
export { default as useUIStore } from './useUIStore';
