import api from './api';
import mediaService from './media.service';

export const postService = {
  createPost: async (postData) => {
    return await api.post('/posts', postData);
  },

  getPostById: async (postId) => {
    return await api.get(`/posts/${postId}`);
  },

  getUserPosts: async (userId, page = 0, size = 12) => {
    return await api.get(`/users/${userId}/posts`, {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  getSavedPosts: async (page = 0, size = 12) => {
    return await api.get('/posts/saved', {
      params: { page, size, sort: 'createdAt,desc' },
    });
  },

  updatePost: async (postId, updateData) => {
    return await api.put(`/posts/${postId}`, updateData);
  },

  deletePost: async (postId) => {
    return await api.delete(`/posts/${postId}`);
  },

  uploadMedia: async (file, category = 'posts') => {
    return await mediaService.uploadMedia(file, category);
  },
};

export default postService;
