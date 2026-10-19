import api from './api';

export const sessionService = {
  /**
   * Retrieves active login sessions for the authenticated user.
   */
  getActiveSessions: async () => {
    const res = await api.get('/sessions');
    return res?.data || res;
  },

  /**
   * Revokes a specific session by its session ID.
   */
  revokeSession: async (sessionId) => {
    return await api.delete(`/sessions/${sessionId}`);
  },

  /**
   * Revokes all active sessions other than the current session.
   */
  revokeOtherSessions: async () => {
    return await api.delete('/sessions/other');
  },

  /**
   * Performs global logout terminating all active user sessions across all devices.
   */
  logoutAll: async () => {
    return await api.post('/auth/logout-all');
  },
};

export default sessionService;
