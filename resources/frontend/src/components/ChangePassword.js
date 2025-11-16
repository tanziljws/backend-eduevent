import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../config/api';

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear message when user types
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const validateForm = () => {
    if (!formData.current_password) {
      setMessage({ type: 'error', text: 'Password lama harus diisi' });
      return false;
    }
    if (!formData.new_password) {
      setMessage({ type: 'error', text: 'Password baru harus diisi' });
      return false;
    }
    if (formData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password baru minimal 8 karakter' });
      return false;
    }
    if (formData.new_password !== formData.new_password_confirmation) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return false;
    }
    if (formData.current_password === formData.new_password) {
      setMessage({ type: 'error', text: 'Password baru harus berbeda dari password lama' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation
      });

      setMessage({ 
        type: 'success', 
        text: response.data.message || 'Password berhasil diubah!' 
      });
      
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });

    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || 'Gagal mengubah password. Silakan coba lagi.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      current_password: '',
      new_password: '',
      new_password_confirmation: ''
    });
    setMessage({ type: '', text: '' });
  };

  return (
    <Card className="bg-white/90 border-gray-200 shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Ubah Kata Sandi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Alert Message */}
          {message.text && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Lama <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                placeholder="Masukkan password lama"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Minimal 8 karakter"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Password harus minimal 8 karakter
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="new_password_confirmation"
                value={formData.new_password_confirmation}
                onChange={handleChange}
                placeholder="Ketik ulang password baru"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Persyaratan Password:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <span className={formData.new_password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                  {formData.new_password.length >= 8 ? '✓' : '○'}
                </span>
                Minimal 8 karakter
              </li>
              <li className="flex items-center gap-2">
                <span className={formData.new_password === formData.new_password_confirmation && formData.new_password ? 'text-green-600' : 'text-gray-400'}>
                  {formData.new_password === formData.new_password_confirmation && formData.new_password ? '✓' : '○'}
                </span>
                Password dan konfirmasi cocok
              </li>
              <li className="flex items-center gap-2">
                <span className={formData.current_password && formData.new_password && formData.current_password !== formData.new_password ? 'text-green-600' : 'text-gray-400'}>
                  {formData.current_password && formData.new_password && formData.current_password !== formData.new_password ? '✓' : '○'}
                </span>
                Berbeda dari password lama
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Menyimpan...
                </>
              ) : (
                'Simpan Password'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
