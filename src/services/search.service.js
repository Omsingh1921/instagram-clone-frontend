import api from './api';

export const searchService = {
  searchUsers: async (query = '', page = 0, size = 20) => {
    return await api.get('/search/users', {
      params: { q: query, page, size },
    });
  },

  searchPosts: async (query = '', page = 0, size = 20) => {
    return await api.get('/search/posts', {
      params: { q: query, page, size, sort: 'createdAt,desc' },
    });
  },
};

export default searchService;
