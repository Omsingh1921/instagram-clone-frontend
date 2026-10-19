import api from './api';

export const adminService = {
  createReport: async (reportData) => {
    return await api.post('/reports', reportData);
  },

  getReports: async (status = null, targetType = null, page = 0, size = 20) => {
    const params = { page, size, sort: 'createdAt,desc' };
    if (status && status !== 'ALL') params.status = status;
    if (targetType && targetType !== 'ALL') params.targetType = targetType;
    return await api.get('/admin/reports', { params });
  },

  resolveReport: async (reportId, resolutionData) => {
    return await api.put(`/admin/reports/${reportId}`, resolutionData);
  },

  updateUserStatus: async (userId, statusData) => {
    return await api.put(`/admin/users/${userId}/status`, statusData);
  },

  getUsers: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },

  updateUserRole: async (userId, roleData) => {
    return await api.put(`/admin/users/${userId}/role`, roleData);
  },

  // Dynamic Email Configurations (Senders per category)
  getEmailConfigs: async () => {
    return await api.get('/admin/email-configs');
  },

  getEmailConfigByCategory: async (category) => {
    return await api.get(`/admin/email-configs/${category}`);
  },

  updateEmailConfig: async (configData) => {
    return await api.put('/admin/email-configs', configData);
  },

  sendTestEmail: async (testData) => {
    return await api.post('/admin/email-configs/test', testData);
  },

  // Dynamic Email Templates (Placeholders, HTML body, reset)
  getEmailTemplates: async () => {
    return await api.get('/admin/email-templates');
  },

  getEmailTemplateByType: async (emailType) => {
    return await api.get(`/admin/email-templates/${emailType}`);
  },

  updateEmailTemplate: async (templateData) => {
    return await api.put('/admin/email-templates', templateData);
  },

  previewEmailTemplate: async (previewData) => {
    return await api.post('/admin/email-templates/preview', previewData);
  },

  resetEmailTemplate: async (emailType) => {
    return await api.post(`/admin/email-templates/reset/${emailType}`);
  },

  getStats: async () => {
    return await api.get('/admin/stats');
  },
};

export default adminService;
