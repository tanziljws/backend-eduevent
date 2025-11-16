import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('auth_token');
    const userData = authService.getCurrentUser();
    if (token && userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Try user login first (most common case)
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      return { success: true, isAdmin: false };
    } catch (userError) {
      // If user login fails, try admin login as fallback
      // This handles cases where user might be an admin in users table with role='admin'
      try {
        const adminResponse = await authService.loginAdmin(email, password);
        setUser(adminResponse.user);
        return { success: true, isAdmin: true };
      } catch (adminError) {
        // Both failed, return user error (more user-friendly)
        return { 
          success: false, 
          error: userError.response?.data?.message || adminError.response?.data?.message || 'Email atau password tidak valid' 
        };
      }
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const response = await authService.loginAdmin(email, password);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Admin login gagal' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return { 
        success: true, 
        message: response.message,
        user_id: response.user_id || response.user?.id // Fallback ke user.id jika user_id tidak ada
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registrasi gagal' 
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const verifyEmail = async (userId, code) => {
    try {
      const response = await authService.verifyEmail(userId, code);
      return { success: true, message: response.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Verifikasi gagal' 
      };
    }
  };

  const value = {
    user,
    login,
    loginAdmin,
    register,
    logout,
    verifyEmail,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
