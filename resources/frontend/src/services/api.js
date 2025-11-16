import axios from 'axios';

// Base URL untuk Laravel API - now using same domain (relative path)
// Since frontend is now served from Laravel, we can use relative paths
// This eliminates CORS issues
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Buat instance axios dengan konfigurasi default
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid, hapus token dan redirect ke login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  requestReset: (email) => api.post('/auth/request-reset', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Events API functions
export const eventsAPI = {
  getAll: () => api.get('/events?per_page=50'), // Get up to 50 events for home page
  getById: (id) => api.get(`/events/${id}`),
  register: (eventId) => api.post(`/events/${eventId}/register`),
  submitAttendance: (eventId, data) => api.post(`/events/${eventId}/attendance`, data),
  getAttendanceStatus: (eventId) => api.get(`/events/${eventId}/attendance/status`),
};

// User API functions
export const userAPI = {
  getHistory: () => api.get('/me/history'),
  getCertificates: () => api.get('/me/certificates'),
  generateCertificate: (registrationId) => api.post(`/registrations/${registrationId}/generate-certificate`),
  getCertificateStatus: (registrationId) => api.get(`/registrations/${registrationId}/certificate-status`),
};

// Admin API functions
export const adminAPI = {
  createEvent: (eventData) => api.post('/admin/events', eventData),
  updateEvent: (eventId, eventData) => api.put(`/admin/events/${eventId}`, eventData),
  publishEvent: (eventId) => api.post(`/admin/events/${eventId}/publish`),
  deleteEvent: (eventId) => api.delete(`/admin/events/${eventId}`),
  getMonthlyEvents: () => api.get('/admin/reports/monthly-events'),
  getMonthlyAttendees: () => api.get('/admin/reports/monthly-attendees'),
  getTop10Events: () => api.get('/admin/reports/top10-events'),
  exportParticipants: (eventId) => api.get(`/admin/events/${eventId}/export`),
  exportAllParticipants: () => api.get('/admin/reports/export-all-participants'),
};

// Certificates API functions
export const certificatesAPI = {
  search: (params) => api.get('/certificates/search', { params }),
  download: (certificateId) => api.get(`/certificates/${certificateId}/download`),
};

export default api;
