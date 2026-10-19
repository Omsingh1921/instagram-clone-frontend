/**
 * useUIStore — Zustand store for shared UI state.
 *
 * Responsibilities:
 *   - Controls global modals (create post, post detail viewer).
 *   - Tracks whether the sidebar is collapsed (mobile/responsive).
 *   - Provides a centralised place for any cross-cutting UI toggles
 *     that would otherwise require prop-drilling through 3+ components.
 *
 * Keep this store lean — only add state here when it is genuinely
 * consumed by 2 or more unrelated components.
 */
import { create } from 'zustand';

const useUIStore = create((set) => ({
  // ---- Modals --------------------------------------------------------
  /** True when the Create Post modal is open. */
  isCreatePostOpen: false,

  /** Post ID of the post currently shown in the detail/lightbox modal. */
  activePostId: null,

  /** Whether the Stories viewer is open. */
  isStoryViewerOpen: false,

  /** User ID whose stories are being viewed. */
  activeStoryUserId: null,

  // ---- Sidebar -------------------------------------------------------
  /** Sidebar collapsed state for responsive layouts. */
  isSidebarCollapsed: false,

  // ----------------------------------------------------------------
  // Actions
  // ----------------------------------------------------------------

  openCreatePost: () => set({ isCreatePostOpen: true }),
  closeCreatePost: () => set({ isCreatePostOpen: false }),

  openPostDetail: (postId) => set({ activePostId: postId }),
  closePostDetail: () => set({ activePostId: null }),

  openStoryViewer: (userId) =>
    set({ isStoryViewerOpen: true, activeStoryUserId: userId }),
  closeStoryViewer: () =>
    set({ isStoryViewerOpen: false, activeStoryUserId: null }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}));

export default useUIStore;
