import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Mail, CheckCircle, Key, Cpu, Users, Palette, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userIdFromApi, setUserIdFromApi] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.requestReset(email);
      if (result && result.message) {
        if (result.user_id) {
          setUserIdFromApi(String(result.user_id));
        }
        setSuccess(true);
      } else {
        setError(result.message || 'Terjadi kesalahan saat mengirim email reset');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan saat mengirim email reset');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToReset = () => {
    navigate('/reset-password', { state: { userId: userIdFromApi, email } });
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-300/40 blur-3xl" />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <div className="bg-white/95 border border-gray-200 rounded-2xl shadow-2xl p-8 space-y-6 text-center backdrop-blur">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Email Terkirim!</h2>
                <p className="text-gray-700 text-sm">Kami telah mengirimkan kode reset password ke email <strong className="text-gray-900">{email}</strong></p>
                <p className="text-gray-500 text-xs">Silakan cek email Anda dan ikuti instruksi untuk reset password</p>
              </div>
              <div className="pt-4 space-y-2">
                <Button onClick={handleGoToReset} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Buka Form Reset</Button>
                <div className="text-xs text-gray-500">Silakan masukkan kode yang dikirim ke email pada form berikutnya.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={handleBackToLogin}
        className="absolute top-6 left-6 text-white hover:text-white/80 transition-colors z-20"
        aria-label="Kembali"
      >
        <ArrowLeft className="w-7 h-7" />
      </button>

      {/* Decorative orbs */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 0.4, scale: 1 }} transition={{ duration: 1.2 }}
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-sky-300/40 blur-3xl" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 0.35, scale: 1 }} transition={{ duration: 1.2, delay: .2 }}
        className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-300/40 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left panel */}
        <motion.div
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: .6 }}
          className="hidden lg:flex flex-col justify-center p-12 xl:p-16 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white"
        >
          <div className="max-w-md">
            <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-bold mb-3">
              Lupa Password
            </motion.h1>
            <p className="text-white/90 mb-8">Masukkan email Anda. Kami akan mengirimkan kode OTP untuk reset password.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Mail className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Kirim OTP ke Email</div>
                  <div className="text-white/80 text-sm">Proses cepat dan aman</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Key className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Valid 10 Menit</div>
                  <div className="text-white/80 text-sm">Dapat dikirim ulang bila perlu</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right panel (form) */}
        <div className="flex items-center justify-center p-6">
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .5 }}
            className="w-full max-w-md">
            <div className="bg-white/90 border border-gray-200 rounded-2xl shadow-2xl p-8 space-y-6 backdrop-blur">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-gray-800">Reset Password</div>
                <p className="text-gray-600 text-sm">Masukkan email Anda dan kami akan mengirimkan kode untuk reset password</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-11 pl-10 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60">
                  {loading ? 'Mengirim...' : 'Kirim Kode Reset'}
                </Button>
              </form>

              <div className="text-center">
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Ingat password? Kembali ke login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
