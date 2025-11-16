import api from '../config/api';

export const authService = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Verify email with OTP
  verifyEmail: async (userId, code) => {
    const response = await api.post('/auth/verify-email', {
      user_id: userId,
      code: code
    });
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Login admin
  loginAdmin: async (email, password) => {
    const response = await api.post('/auth/admin/login', {
      email,
      password
    });
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  // Request password reset
  requestReset: async (email) => {
    const response = await api.post('/auth/request-reset', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (userId, code, password, passwordConfirmation) => {
    const response = await api.post('/auth/reset-password', {
      user_id: userId,
      code,
      password,
      password_confirmation: passwordConfirmation
    });
    return response.data;
  },

  // Flexible reset password: accept email or userId
  resetPasswordFlexible: async ({ userId, email, code, password, passwordConfirmation }) => {
    const payload = {
      code,
      password,
      password_confirmation: passwordConfirmation,
    };
    if (email) payload.email = email;
    if (userId) payload.user_id = userId;
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  }
};
