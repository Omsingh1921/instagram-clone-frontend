/**
 * useNotificationStore — Zustand store for notification state.
 *
 * Responsibilities:
 *   - Tracks the unread notification count badge shown in the sidebar.
 *   - Stores the notification list for the NotificationsPage.
 *   - Provides actions to mark individual or all notifications as read.
 *
 * AuthContext is NOT replaced — authentication is still owned by AuthContext.
 * This store manages orthogonal UI state that is frequently shared across
 * multiple components (sidebar badge, notifications page, real-time WS events).
 */
import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  /** Total count of unread notifications (drives the sidebar badge). */
  unreadCount: 0,

  /** Full list of notifications as fetched from the API. */
  notifications: [],

  /** Whether the initial notifications fetch is in progress. */
  isLoading: false,

  // ----------------------------------------------------------------
  // Actions
  // ----------------------------------------------------------------

  /** Set the full notifications list and recalculate unread count. */
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },

  /** Increment unread count when a new real-time notification arrives. */
  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  /** Mark a single notification as read (optimistic update). */
  markAsRead: (notificationId) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: Math.max(0, notifications.filter((n) => !n.read).length),
      };
    }),

  /** Mark every notification as read. */
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  /** Prepend a newly received real-time notification to the list. */
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),

  /** Reset the store on logout. */
  reset: () => set({ unreadCount: 0, notifications: [], isLoading: false }),

  setIsLoading: (isLoading) => set({ isLoading }),
}));

export default useNotificationStore;
