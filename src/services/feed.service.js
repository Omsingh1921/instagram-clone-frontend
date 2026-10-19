import api from './api';

export const feedService = {
  getHomeFeed: async (page = 0, size = 10) => {
    return await api.get('/feed', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getExploreFeed: async (page = 0, size = 20) => {
    return await api.get('/feed/explore', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },
};

export default feedService;
