import api from '../config/api';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const userService = {
  // Get user event history
  getEventHistory: async () => {
    try {
      const response = await api.get('/user/event-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching event history:', error);
      throw error;
    }
  },

  // Get user transactions (fallback to event history structure)
  getTransactions: async () => {
    try {
      // Prefer dedicated endpoint if exists
      try {
        const tx = await api.get('/user/transactions');
        return tx.data;
      } catch (_) {
        // Fallback: use event history as transaction list
        const response = await api.get('/user/event-history');
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Get detailed event information
  getEventDetail: async (registrationId) => {
    try {
      const response = await api.get(`/user/event-details/${registrationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event detail:', error);
      throw error;
    }
  },

  // Get user certificates
  getCertificates: async () => {
    try {
      const response = await api.get('/me/certificates');
      // Backend returns array directly, not wrapped in {data: []}
      return response.data;
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  },

  // Download certificate
  downloadCertificate: async (certificateId) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const downloadUrl = `${API_BASE_URL}/certificates/${certificateId}/download`;
      
      console.log('=== DOWNLOAD CERTIFICATE START ===');
      console.log('Certificate ID:', certificateId);
      console.log('Download URL:', downloadUrl);
      console.log('Token exists:', !!token);
      console.log('API_BASE_URL:', API_BASE_URL);
      
      // METHOD 1: Try blob download using api instance (includes Authorization header)
      try {
        console.log('\nTrying METHOD 1: Blob download...');
        
        const response = await api.get(`/certificates/${certificateId}/download`, {
          headers: {
            'Accept': 'application/pdf,application/octet-stream'
          },
          responseType: 'blob'
        });
        
        console.log('✅ Response received:', response.status);
        console.log('Response data size:', response.data.size);
        
        // Extract filename
        const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
        let filename = `Sertifikat_${certificateId}.pdf`;
        
        if (disposition) {
          const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
          if (filenameMatch) {
            const extracted = decodeURIComponent(filenameMatch[1] || filenameMatch[2] || '').trim();
            if (extracted) filename = extracted;
          }
        }
        
        console.log('Filename:', filename);
        
        // Create blob and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        console.log('Clicking download link...');
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log('✅ METHOD 1: Download triggered successfully!');
        }, 100);
        
        return { success: true, filename, method: 'blob' };
        
      } catch (blobError) {
        console.error('❌ METHOD 1 failed:', blobError.message);
        console.error('Status:', blobError.response?.status);
        
        // METHOD 2: Try direct window.open as fallback
        console.log('\nTrying METHOD 2: Direct window.open...');
        
        // Create URL with token as query parameter for direct download
        const directUrl = `${downloadUrl}?token=${encodeURIComponent(token)}`;
        console.log('Opening URL:', directUrl);
        
        // Open in new window
        const newWindow = window.open(directUrl, '_blank');
        
        if (newWindow) {
          console.log('✅ METHOD 2: Window opened successfully!');
          return { success: true, method: 'window.open' };
        } else {
          console.error('❌ METHOD 2 failed: Popup blocked');
          throw new Error('Download failed. Please allow popups and try again.');
        }
      }
      
    } catch (error) {
      console.error('❌ ALL METHODS FAILED');
      console.error('Error:', error);
      console.error('Error status:', error.response?.status);
      
      // Try to read error message from blob
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          console.error('Error response body:', text);
        } catch (e) {
          // ignore
        }
      }
      
      throw error;
    }
  },

  // Change password
  changePassword: async ({ current_password, new_password, new_password_confirmation }) => {
    try {
      const response = await api.post('/user/change-password', {
        current_password,
        new_password,
        new_password_confirmation,
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};
