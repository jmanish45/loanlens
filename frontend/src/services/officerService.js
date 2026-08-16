import api from './api';

export const officerService = {
  getDashboardStats: () => api.get('/officer/dashboard'),
  
  getApplications: (params) => api.get('/officer/applications', { params }),
  
  getApplicationById: (id) => api.get(`/officer/applications/${id}`),

  updateApplicationStatus: (id, status) => api.patch(`/officer/applications/${id}/status`, { status }),

  downloadDocument: (docId) => api.get(`/officer/documents/${docId}/download`, { responseType: 'blob' }),

  reviewDocument: (docId, status, reviewComment) => api.patch(`/officer/documents/${docId}/review`, { status, reviewComment }),

  addNote: (id, content) => api.post(`/officer/applications/${id}/notes`, { content }),

  getNotes: (id) => api.get(`/officer/applications/${id}/notes`),

  getActivity: (id) => api.get(`/officer/applications/${id}/activity`),

  // AI Document Intelligence
  getDocumentAnalysis: (docId) => api.get(`/officer/documents/${docId}/analysis`),

  reprocessDocument: (docId) => api.post(`/officer/documents/${docId}/reprocess`),
};
