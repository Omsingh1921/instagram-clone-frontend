import api from './api';

/**
 * Dedicated Media Service adhering to Section 30 (Frontend Upload Flow).
 * Communicates with backend Cloudinary Media API (/api/v1/media).
 */
export const mediaService = {
  uploadMedia: async (file, category = 'posts') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const res = await api.post('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = res?.data || res;
    const url = data?.secureUrl || data?.url || data?.mediaUrl;

    return {
      ...res,
      data: {
        ...data,
        url,
        secureUrl: url,
        mediaUrl: url,
      },
      url,
      secureUrl: url,
      mediaUrl: url,
    };
  },

  getMedia: async (mediaId) => {
    return await api.get(`/media/${mediaId}`);
  },

  deleteMedia: async (mediaId) => {
    return await api.delete(`/media/${mediaId}`);
  },
};

export default mediaService;
