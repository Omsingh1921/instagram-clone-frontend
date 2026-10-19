import api from './api';
import mediaService from './media.service';

export const userService = {
  getCurrentUser: async () => {
    return await api.get('/users/me');
  },

  getUserById: async (userId) => {
    return await api.get(`/users/${userId}`);
  },

  getUserByUsername: async (username) => {
    return await api.get(`/users/username/${username}`);
  },

  updateProfile: async (profileData) => {
    return await api.put('/users/me/profile', profileData);
  },

  updateAvatar: async (avatarUrl) => {
    return await api.patch('/users/me/avatar', { avatarUrl });
  },

  uploadAvatar: async (file) => {
    const uploadRes = await mediaService.uploadMedia(file, 'avatar');
    const url = uploadRes?.secureUrl || uploadRes?.data?.secureUrl || uploadRes?.url || uploadRes?.data?.url;
    const updateRes = await api.patch('/users/me/avatar', { avatarUrl: url });
    return {
      ...updateRes,
      mediaUrl: url,
      secureUrl: url,
    };
  },

  searchUsers: async (query = '', page = 0, size = 10) => {
    return await api.get('/users/search', {
      params: { q: query, page, size },
    });
  },

  deactivateCurrentUser: async () => {
    return await api.post('/users/me/deactivate');
  },

  deleteCurrentUser: async () => {
    return await api.delete('/users/me');
  },
};

export default userService;
