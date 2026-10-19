import api from './api';

export const reelService = {
  createReel: async (reelData) => {
    return await api.post('/reels', reelData);
  },

  getReels: async (page = 0, size = 10) => {
    return await api.get('/reels', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getReelById: async (reelId) => {
    return await api.get(`/reels/${reelId}`);
  },

  getUserReels: async (userId, page = 0, size = 12) => {
    return await api.get(`/users/${userId}/reels`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  deleteReel: async (reelId) => {
    return await api.delete(`/reels/${reelId}`);
  },
};

export default reelService;
