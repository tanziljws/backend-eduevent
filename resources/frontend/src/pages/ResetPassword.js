import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Eye, EyeOff, Lock, Key, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [formData, setFormData] = useState({
    userId: (location.state && location.state.userId) || searchParams.get('user_id') || '',
    code: searchParams.get('code') || '',
    password: '',
    passwordConfirmation: ''
  });
  const [email, setEmail] = useState('');
  const [userIdFixed, setUserIdFixed] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendInfo, setResendInfo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const isEmail = (v) => /.+@.+\..+/.test(String(v || ''));

  // Izinkan akses tanpa param; user bisa isi manual kode/userId
  useEffect(() => {
    if (location.state && location.state.userId) {
      setFormData(prev => ({ ...prev, userId: String(location.state.userId) }));
      setUserIdFixed(String(location.state.userId));
    }
    // Prefill email if provided or derived from userId
    const emailFromState = (location.state && location.state.email) || '';
    const emailFromUserId = isEmail(formData.userId) ? String(formData.userId) : '';
    setEmail(emailFromState || emailFromUserId || '');
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&#]/.test(password);
    
    return {
      isValid: minLength && hasLowerCase && hasUpperCase && hasNumbers && hasSpecialChar,
      errors: {
        minLength,
        hasLowerCase,
        hasUpperCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasi kode OTP 6 digit
    const isValidOtp = /^\d{6}$/.test(String(formData.code || ''));
    if (!isValidOtp) {
      setError('Kode OTP tidak valid. Masukkan 6 digit angka dari email.');
      setLoading(false);
      return;
    }

    // Validasi password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      const { errors } = passwordValidation;
      let errorMessage = 'Password harus mengandung:';
      if (!errors.minLength) errorMessage += '\n• Minimal 8 karakter';
      if (!errors.hasLowerCase) errorMessage += '\n• Huruf kecil (a-z)';
      if (!errors.hasUpperCase) errorMessage += '\n• Huruf besar (A-Z)';
      if (!errors.hasNumbers) errorMessage += '\n• Angka (0-9)';
      if (!errors.hasSpecialChar) errorMessage += '\n• Karakter spesial (@$!%*?&#)';
      errorMessage += '\n\nContoh: Password123#';
      
      setError(errorMessage);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError('Konfirmasi password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      const userIdVal = userIdFixed || (isEmail(email) ? undefined : formData.userId);
      const payload = {
        userId: userIdVal,
        email: isEmail(email) ? email : undefined,
        code: formData.code,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation
      };
      const result = await authService.resetPasswordFlexible(payload);
      
      if (result.message && result.message.toLowerCase().includes('success')) {
        setSuccess(true);
      } else {
        setError(result.message || 'Terjadi kesalahan saat reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const backendMsg = err?.response?.data?.message || '';
      if (backendMsg) {
        // Map beberapa pesan umum ke bahasa Indonesia yang jelas
        if (/selected user id is invalid/i.test(backendMsg) || /user id.*required/i.test(backendMsg)) {
          setError('User tidak ditemukan/ID tidak tersedia. Mohon kembali ke halaman "Lupa Password", masukkan email Anda, lalu gunakan tombol "Buka Form Reset" agar ID pengguna ikut terkirim.');
        } else if (/otp|code/i.test(backendMsg) && /expired|invalid/i.test(backendMsg)) {
          setError('Kode OTP tidak valid atau sudah kedaluwarsa. Kirim ulang kode lalu coba lagi.');
        } else {
          setError(backendMsg);
        }
      } else {
        setError('Kode tidak valid atau sudah expired');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleResend = async () => {
    // Accept only email format to resend
    const emailCandidate = email || ((location.state && location.state.email) || '');
    if (!isEmail(emailCandidate)) {
      setResendInfo('Masukkan email yang valid pada kolom Email/User ID untuk kirim ulang OTP.');
      return;
    }
    try {
      setResendLoading(true);
      setResendInfo('');
      await authService.requestReset(String(emailCandidate));
      setResendInfo('Kode OTP baru telah dikirim ke email Anda. Berlaku 10 menit.');
      setCooldown(60); // 60s cooldown
    } catch (e) {
      setResendInfo(e?.response?.data?.message || 'Gagal mengirim ulang OTP. Coba lagi.');
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-200/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-slate-300/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Success Card */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/95 border border-gray-200 rounded-2xl shadow-2xl p-8 space-y-6 text-center backdrop-blur">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Password Berhasil Direset</h2>
              <p className="text-gray-600 text-sm">Anda dapat masuk menggunakan password baru sekarang.</p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleBackToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Login Sekarang
              </Button>
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
              Reset Password
            </motion.h1>
            <p className="text-white/90 mb-8">Masukkan kode OTP yang kami kirim ke email dan buat password baru yang kuat.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Key className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Kode Verifikasi</div>
                  <div className="text-white/80 text-sm">Berlaku 10 menit, bisa kirim ulang</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Lock className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Password Kuat</div>
                  <div className="text-white/80 text-sm">Huruf besar, kecil, angka, dan simbol</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right panel (form) */}
        <div className="flex items-center justify-center p-6">
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .5 }}
            className="w-full max-w-md">
            <div className="bg-white/90 border border-blue-200 rounded-2xl shadow-2xl p-8 space-y-6 backdrop-blur">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-gray-800">Reset Password</div>
                <p className="text-gray-600 text-sm">Masukkan kode verifikasi dan password baru Anda</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email - always visible */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="nama@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Verification Code */}
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium text-gray-700">Kode OTP (6 digit)</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="text"
                      id="code"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Masukkan 6 digit kode dari email"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="w-full h-11 pl-10 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {String(formData.code || '').length > 0 && !/^\d{6}$/.test(String(formData.code)) && (
                    <p className="text-xs text-amber-600">Kode harus berupa 6 digit angka.</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-500">Kode berlaku 10 menit.</p>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading || cooldown > 0}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    >
                      {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : (resendLoading ? 'Mengirim...' : 'Kirim ulang kode')}
                    </button>
                  </div>
                  {resendInfo && (
                    <p className="text-xs mt-1 text-green-600">{resendInfo}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="Contoh: Password123#"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full h-11 pl-10 pr-10 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Password harus mengandung:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                        Minimal 8 karakter
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        Huruf kecil (a-z)
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        Huruf besar (A-Z)
                      </li>
                      <li className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        Angka (0-9)
                      </li>
                      <li className={/[@$!%*?&#]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        Karakter spesial (@$!%*?&#)
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="passwordConfirmation" className="text-sm font-medium text-gray-700">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      id="passwordConfirmation"
                      name="passwordConfirmation"
                      placeholder="Ulangi password baru"
                      value={formData.passwordConfirmation}
                      onChange={handleChange}
                      required
                      className="w-full h-11 pl-10 pr-10 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPasswordConfirmation ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    {loading ? 'Mereset Password...' : 'Reset Password'}
                  </Button>
                </div>
              </form>

              {/* Back to Login Link */}
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Kembali ke login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
