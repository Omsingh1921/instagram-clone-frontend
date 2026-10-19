import api from './api';

export const engagementService = {
  toggleLike: async (postId) => {
    return await api.post(`/posts/${postId}/like`);
  },

  toggleSave: async (postId) => {
    return await api.post(`/posts/${postId}/save`);
  },

  addComment: async (postId, commentData) => {
    return await api.post(`/posts/${postId}/comments`, commentData);
  },

  getComments: async (postId, page = 0, size = 20) => {
    return await api.get(`/posts/${postId}/comments`, {
      params: { page, size, sort: 'createdAt,asc' },
    });
  },

  getCommentReplies: async (commentId, page = 0, size = 20) => {
    return await api.get(`/comments/${commentId}/replies`, {
      params: { page, size, sort: 'createdAt,asc' },
    });
  },

  deleteComment: async (commentId) => {
    return await api.delete(`/comments/${commentId}`);
  },
};

export default engagementService;
