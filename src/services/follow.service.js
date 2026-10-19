import api from './api';

export const followService = {
  followUser: async (userId) => {
    return await api.post(`/users/${userId}/follow`);
  },

  unfollowUser: async (userId) => {
    return await api.delete(`/users/${userId}/follow`);
  },

  cancelFollowRequest: async (userId) => {
    return await api.delete(`/follows/users/${userId}/request`);
  },

  getPendingFollowRequests: async (page = 0, size = 20) => {
    return await api.get('/follows/requests', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  acceptFollowRequest: async (requestId) => {
    return await api.post(`/follows/requests/${requestId}/accept`);
  },

  rejectFollowRequest: async (requestId) => {
    return await api.post(`/follows/requests/${requestId}/reject`);
  },

  removeFollower: async (followerUserId) => {
    return await api.delete(`/follows/followers/${followerUserId}`);
  },

  getFollowers: async (userId, page = 0, size = 20) => {
    return await api.get(`/users/${userId}/followers`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getFollowing: async (userId, page = 0, size = 20) => {
    return await api.get(`/users/${userId}/following`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },
};

export default followService;
