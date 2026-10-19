import api from './api';

export const chatService = {
  getConversations: async (page = 0, size = 20) => {
    return await api.get('/conversations', {
      params: { page, size, sort: 'updatedAt,desc' },
    });
  },

  getOrCreateDirectConversation: async (recipientId) => {
    return await api.post('/conversations', { recipientId });
  },

  getConversationById: async (conversationId) => {
    return await api.get(`/conversations/${conversationId}`);
  },

  getMessages: async (conversationId, page = 0, size = 30) => {
    return await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, size, sort: 'createdAt,asc' },
    });
  },

  sendMessage: async (conversationId, messageData) => {
    return await api.post(`/conversations/${conversationId}/messages`, messageData);
  },

  markAsRead: async (conversationId) => {
    return await api.post(`/conversations/${conversationId}/read`);
  },
};

export default chatService;
