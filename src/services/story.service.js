import api from './api';

export const storyService = {
  createStory: async (storyData) => {
    return await api.post('/stories', storyData);
  },

  getStoryFeed: async () => {
    return await api.get('/stories/feed');
  },

  getUserStories: async (userId) => {
    return await api.get(`/users/${userId}/stories`);
  },

  markStoryViewed: async (storyId) => {
    return await api.post(`/stories/${storyId}/view`);
  },

  getStoryViewers: async (storyId) => {
    return await api.get(`/stories/${storyId}/viewers`);
  },

  deleteStory: async (storyId) => {
    return await api.delete(`/stories/${storyId}`);
  },
};

export default storyService;
