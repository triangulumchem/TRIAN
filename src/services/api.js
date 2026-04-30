import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard APIs
export const getDashboardStats = (params = {}) => 
  api.get('/dashboard/stats', { params });

export const getFilterOptions = () => 
  api.get('/dashboard/filters');

// Inquiry APIs
export const getInquiries = (params = {}) => 
  api.get('/inquiries', { params });

export const getInquiry = (id) => 
  api.get(`/inquiries/${id}`);

export const updateInquiry = (id, data) => 
  api.put(`/inquiries/${id}`, data);

export const deleteInquiry = (id) => 
  api.delete(`/inquiries/${id}`);

export const exportInquiries = (params = {}) => 
  api.get('/inquiries/export/csv', { 
    params,
    responseType: 'blob'
  });

// Upload APIs
export const uploadCSV = (formData) => 
  api.post('/upload/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const bulkUpload = (formData) => 
  api.post('/upload/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export default api;
