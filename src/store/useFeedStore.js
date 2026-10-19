/**
 * useFeedStore — Zustand store for the home feed state.
 *
 * Responsibilities:
 *   - Caches the fetched feed posts between navigations (avoids re-fetches on back).
 *   - Tracks the current pagination cursor / page number.
 *   - Provides optimistic like/save toggles that update feed cards instantly
 *     without waiting for the server round-trip.
 *
 * This store is intentionally narrow in scope — it does NOT own auth state.
 */
import { create } from 'zustand';

const useFeedStore = create((set, get) => ({
  /** Ordered array of post objects for the feed. */
  posts: [],

  /** Whether the first page of posts is loading. */
  isLoading: false,

  /** Whether there are more pages to load (infinite scroll). */
  hasMore: true,

  /** Current page index (0-based) for pagination. */
  page: 0,

  // ----------------------------------------------------------------
  // Actions
  // ----------------------------------------------------------------

  /** Replace the entire feed (first load or pull-to-refresh). */
  setPosts: (posts, hasMore = true) => set({ posts, hasMore, page: 0 }),

  /** Append next page posts (infinite scroll). */
  appendPosts: (newPosts, hasMore = true) =>
    set((state) => ({
      posts: [...state.posts, ...newPosts],
      hasMore,
      page: state.page + 1,
    })),

  /**
   * Optimistically toggle the like state on a post.
   * The caller is responsible for calling the API and reverting on error.
   */
  toggleLike: (postId, liked, likeCount) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, liked, likeCount } : p
      ),
    })),

  /**
   * Optimistically toggle the saved state on a post.
   */
  toggleSave: (postId, saved) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, saved } : p
      ),
    })),

  /** Update the comment count on a post after a new comment is submitted. */
  updateCommentCount: (postId, commentCount) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, commentCount } : p
      ),
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  /** Reset feed on logout or profile switch. */
  reset: () => set({ posts: [], isLoading: false, hasMore: true, page: 0 }),
}));

export default useFeedStore;
