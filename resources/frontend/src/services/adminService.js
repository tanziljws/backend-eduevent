import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance with auth token
// Use request interceptor to dynamically add Authorization header
// This ensures the header is preserved even when sending FormData
const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Accept': 'application/json'
    }
  });

  // Request interceptor to add Authorization header dynamically
  instance.interceptors.request.use(
    (config) => {
      // AuthContext stores 'auth_token'. Keep backward compatibility with 'token' if present.
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Don't set Content-Type for FormData - axios will set it automatically with boundary
      // Only set Content-Type if it's not FormData
      if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

export const adminService = {
  // Dashboard data
  getDashboardData: async (year = new Date().getFullYear()) => {
    try {
      const api = createAxiosInstance();
      const response = await api.get(`/admin/dashboard?year=${year}`);
      console.log('Admin dashboard API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Admin dashboard API error:', error);
      throw error;
    }
  },

  // Export data
  exportData: async (type = 'events', format = 'csv') => {
    try {
      const api = createAxiosInstance();
      
      // Check if token exists
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Anda harus login sebagai admin untuk mengekspor data.');
      }
      
      const response = await api.get(`/admin/export?type=${type}&format=${format}`, {
        responseType: 'blob'
      });

      // Check if response is actually an error (blob might contain JSON error)
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          if (!errorData.success) {
            throw new Error(errorData.message || 'Gagal mengekspor data.');
          }
        } catch (e) {
          // If not JSON, continue with download
        }
      }

      // Try to extract filename from headers
      const disposition = response.headers && (response.headers['content-disposition'] || response.headers['Content-Disposition']);
      let filename = `${type}_${new Date().toISOString().split('T')[0]}.${format}`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        const extracted = decodeURIComponent(match?.[1] || match?.[2] || '').trim();
        if (extracted) filename = extracted;
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response;
    } catch (error) {
      // Log detailed error info
      const status = error?.response?.status;
      let errorMessage = error.message || 'Gagal mengekspor data.';
      
      // Try to extract error message from blob response
      if (error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If can't parse, use default message
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      console.error('Export error:', { status, message: errorMessage, error });
      
      // Check if it's authentication error
      if (status === 401 || status === 403) {
        throw new Error('Sesi Anda telah berakhir. Silakan login ulang sebagai admin.');
      }
      
      throw new Error(errorMessage);
    }
  },

  // Event management
  createEvent: async (eventData) => {
    const api = createAxiosInstance();
    const formData = new FormData();
    
    Object.keys(eventData).forEach(key => {
      const val = eventData[key];
      if (val === null || val === undefined) return;
      
      // Handle file uploads - don't normalize File objects
      if (key === 'flyer_path' && val instanceof File) {
        formData.append('flyer', val);
        return;
      }
      if (key === 'certificate_template_path' && val instanceof File) {
        formData.append('certificate_template', val);
        return;
      }
      
      // Map boolean to '1'/'0' for Laravel boolean validation
      const normalized = typeof val === 'boolean' ? (val ? '1' : '0') : val;
      formData.append(key, normalized);
    });
    
    // Don't manually set Content-Type - axios will set it automatically with boundary for FormData
    // This ensures Authorization header is preserved
    const response = await api.post('/admin/events', formData);
    return response.data;
  },

  updateEvent: async (eventId, eventData) => {
    const api = createAxiosInstance();
    
    // If eventData is already FormData, use it directly
    let formData;
    if (eventData instanceof FormData) {
      formData = eventData;
    } else {
      // Otherwise, create FormData from object
      formData = new FormData();
      Object.keys(eventData).forEach(key => {
        const val = eventData[key];
        if (val === null || val === undefined) return;

        // Handle file uploads - don't normalize File objects
        if (key === 'flyer_path' && val instanceof File) {
          formData.append('flyer', val);
          return;
        }
        if (key === 'certificate_template_path' && val instanceof File) {
          formData.append('certificate_template', val);
          return;
        }

        // Normalize booleans to '1'/'0' so Laravel boolean validation works reliably
        const normalized = typeof val === 'boolean' ? (val ? '1' : '0') : val;
        formData.append(key, normalized);
      });
    }
    
    // Use PUT method directly for API routes
    // Don't manually set Content-Type - axios will set it automatically with boundary for FormData
    // This ensures Authorization header is preserved
    // Use POST + method override to avoid strict CORS preflight issues on PUT with Bearer tokens
    formData.append('_method', 'PUT');
    const response = await api.post(`/admin/events/${eventId}`, formData);
    return response.data;
  },

  publishEvent: async (eventId, isPublished) => {
    const api = createAxiosInstance();
    const payload = { is_published: isPublished ? 1 : 0 };
    const response = await api.post(`/admin/events/${eventId}/publish`, payload);
    return response.data; // { is_published: boolean }
  },

  deleteEvent: async (eventId) => {
    const api = createAxiosInstance();
    const response = await api.delete(`/admin/events/${eventId}`);
    return response.data;
  },

  // Reports
  getMonthlyEvents: async (year = new Date().getFullYear()) => {
    const api = createAxiosInstance();
    const response = await api.get(`/admin/reports/monthly-events?year=${year}`);
    return response.data;
  },

  getMonthlyAttendees: async (year = new Date().getFullYear()) => {
    const api = createAxiosInstance();
    const response = await api.get(`/admin/reports/monthly-attendees?year=${year}`);
    return response.data;
  },

  getTopEvents: async () => {
    const api = createAxiosInstance();
    const response = await api.get('/admin/reports/top10-events');
    return response.data;
  },

  exportEventParticipants: async (eventId, format = 'csv') => {
    try {
      const api = createAxiosInstance();
      
      // Check if token exists
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Anda harus login sebagai admin untuk mengekspor data.');
      }
      
      const response = await api.get(`/admin/events/${eventId}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      // Check if response is actually an error (blob might contain JSON error)
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          if (!errorData.success) {
            throw new Error(errorData.message || 'Gagal mengekspor data peserta.');
          }
        } catch (e) {
          // If not JSON, continue with download
        }
      }
      
      // Try to extract filename from headers
      const disposition = response.headers && (response.headers['content-disposition'] || response.headers['Content-Disposition']);
      let filename = `event_${eventId}_participants_${new Date().toISOString().split('T')[0]}.${format}`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        const extracted = decodeURIComponent(match?.[1] || match?.[2] || '').trim();
        if (extracted) filename = extracted;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      const status = error?.response?.status;
      let errorMessage = error.message || 'Gagal mengekspor data peserta.';
      
      // Try to extract error message from blob response
      if (error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If can't parse, use default message
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      console.error('Export participants error:', { status, message: errorMessage, error });
      
      // Check if it's authentication error
      if (status === 401 || status === 403) {
        throw new Error('Sesi Anda telah berakhir. Silakan login ulang sebagai admin.');
      }
      
      throw new Error(errorMessage);
    }
  },

  // Admin profile/settings
  getAdminProfile: async () => {
    const api = createAxiosInstance();
    const res = await api.get('/admin/profile');
    return res.data;
  },
  updateAdminProfile: async (payload) => {
    const api = createAxiosInstance();
    const res = await api.put('/admin/profile', payload);
    return res.data;
  },
  changeAdminPassword: async (payload) => {
    const api = createAxiosInstance();
    const res = await api.put('/admin/profile/password', payload);
    return res.data;
  },
  getAppSettings: async () => {
    const api = createAxiosInstance();
    const res = await api.get('/admin/settings');
    return res.data;
  },
  updateAppSettings: async (payload) => {
    const api = createAxiosInstance();
    const res = await api.put('/admin/settings', payload);
    return res.data;
  },

  // Banner Management
  getBanners: async () => {
    const api = createAxiosInstance();
    const response = await api.get('/admin/banners');
    return response.data;
  },
  createBanner: async (formData) => {
    const api = createAxiosInstance();
    // Don't manually set Content-Type - axios will set it automatically with boundary for FormData
    const response = await api.post('/admin/banners', formData);
    return response.data;
  },
  updateBanner: async (id, formData) => {
    const api = createAxiosInstance();
    // Don't manually set Content-Type - axios will set it automatically with boundary for FormData
    const response = await api.post(`/admin/banners/${id}`, formData);
    return response.data;
  },
  deleteBanner: async (id) => {
    const api = createAxiosInstance();
    const response = await api.delete(`/admin/banners/${id}`);
    return response.data;
  },
  toggleBanner: async (id) => {
    const api = createAxiosInstance();
    const response = await api.post(`/admin/banners/${id}/toggle`);
    return response.data;
  }
};
