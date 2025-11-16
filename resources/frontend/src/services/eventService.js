import api from '../config/api';

export const eventService = {
  // Get all published events (public)
  getEvents: async (searchQuery = '', sort = 'soonest', category = 'all') => {
    const searchParams = new URLSearchParams();
    
    // Handle both old string format and new object format
    if (typeof searchQuery === 'object' && searchQuery !== null) {
      // New format: getEvents({q, sort, category, page, admin, per_page})
      const params = searchQuery;
      if (params.q) searchParams.append('q', params.q);
      if (params.sort) searchParams.append('sort', params.sort);
      if (params.category && params.category !== 'all') searchParams.append('category', params.category);
      if (params.page) searchParams.append('page', params.page);
      if (params.admin) searchParams.append('admin', 'true');
      // Ensure per_page is set to get more events (default 50)
      if (params.per_page) {
        searchParams.append('per_page', params.per_page);
      } else {
        searchParams.append('per_page', '50'); // Default to 50 events per page
      }
    } else {
      // Old format: getEvents(searchQuery, sort, category)
      if (searchQuery) searchParams.append('q', searchQuery);
      if (sort) searchParams.append('sort', sort);
      if (category && category !== 'all') searchParams.append('category', category);
      // Add per_page for old format too
      searchParams.append('per_page', '50'); // Default to 50 events per page
    }
    
    const response = await api.get(`/events?${searchParams.toString()}`);
    return response.data;
  },

  // Get all events for admin (including unpublished)
  getAdminEvents: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.category && params.category !== 'all') searchParams.append('category', params.category);
    if (params.page) searchParams.append('page', params.page);
    searchParams.append('admin', 'true'); // Flag to get all events including unpublished
    
    const response = await api.get(`/events?${searchParams.toString()}`);
    return response.data;
  },

  // Get single event detail (public)
  getEvent: async (eventId) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  // Register for event (authenticated)
  registerForEvent: async (eventId, formData = {}) => {
    const response = await api.post(`/events/${eventId}/register`, formData);
    return response.data;
  },

  // Cancel registration (authenticated)
  cancelRegistration: async (registrationId) => {
    const response = await api.delete(`/registrations/${registrationId}`);
    return response.data;
  },

  // Get my registrations (authenticated)
  getMyRegistrations: async () => {
    try {
      const response = await api.get('/me/registrations');
      return response.data;
    } catch (error) {
      // Graceful fallback to avoid noisy errors in UI
      console.warn('getMyRegistrations failed:', error?.response?.status, error?.response?.data || error?.message);
      return { data: [] };
    }
  },

  // Get my history (authenticated)
  getMyHistory: async () => {
    try {
      const response = await api.get('/me/history');
      return response.data;
    } catch (error) {
      console.warn('getMyHistory failed:', error?.response?.status, error?.response?.data || error?.message);
      return { data: [] };
    }
  },

  // Submit attendance (authenticated)
  submitAttendance: async (eventId, attendanceData) => {
    const response = await api.post(`/events/${eventId}/attendance`, attendanceData);
    return response.data;
  },

  // Mark attendance with token (authenticated)
  markAttendance: async (eventId, tokenData) => {
    const response = await api.post(`/events/${eventId}/attendance`, tokenData);
    return response.data;
  },

  // Get attendance status
  getAttendanceStatus: async (eventId) => {
    const response = await api.get(`/events/${eventId}/attendance/status`);
    return response.data;
  },

  // Generate certificate for a registration
  generateCertificate: async (registrationId, data) => {
    const response = await api.post(`/registrations/${registrationId}/generate-certificate`, data);
    return response.data;
  },

  // Check certificate status
  checkCertificateStatus: async (registrationId) => {
    const response = await api.get(`/registrations/${registrationId}/certificate-status`);
    return response.data;
  },

  // Create payment for a paid event (requires auth)
  createPayment: async (eventId) => {
    // Use authenticated axios via config/api (already includes token)
    const response = await api.post(`/events/${eventId}/payment`);
    return response.data; // { payment_id, snap_token, order_id, amount }
  },

  // Check payment status (requires auth)
  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  }
};
