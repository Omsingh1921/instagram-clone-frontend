import api from './api';

export const healthService = {
  getHealthStatus: async () => {
    return await api.get('/health');
  },
};

export default healthService;
