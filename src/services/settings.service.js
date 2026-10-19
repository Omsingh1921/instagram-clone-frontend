import api from './api';

export const settingsService = {
  getSettings: async () => {
    return await api.get('/users/me/settings');
  },

  updateSettings: async (settingsData) => {
    return await api.put('/users/me/settings', settingsData);
  },

  changePassword: async (passwordData) => {
    return await api.put('/users/me/password', passwordData);
  },

  blockUser: async (userId) => {
    return await api.post(`/users/${userId}/block`);
  },

  unblockUser: async (userId) => {
    return await api.delete(`/users/${userId}/block`);
  },

  getBlockedUsers: async (page = 0, size = 20) => {
    return await api.get('/users/me/blocks', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  initiateEmailChange: async (newEmail) => {
    return await api.post('/users/me/email', { newEmail });
  },

  cancelPendingEmailChange: async () => {
    return await api.delete('/users/me/email');
  },

  getEmailPreferences: async () => {
    return await api.get('/users/me/email-preferences');
  },

  updateEmailPreferences: async (preferences) => {
    return await api.put('/users/me/email-preferences', preferences);
  },
};

export default settingsService;
