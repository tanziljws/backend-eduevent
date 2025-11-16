import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Eye, EyeOff, Cpu, Users, Palette, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    education: '',
    password: '',
    password_confirmation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const educationLevels = [
    { value: 'SD', label: 'Sekolah Dasar (SD)' },
    { value: 'SMP', label: 'Sekolah Menengah Pertama (SMP)' },
    { value: 'SMA', label: 'Sekolah Menengah Atas (SMA)' },
    { value: 'SMK', label: 'Sekolah Menengah Kejuruan (SMK)' },
    { value: 'D3', label: 'Diploma 3 (D3)' },
    { value: 'S1', label: 'Sarjana (S1)' },
    { value: 'S2', label: 'Magister (S2)' },
    { value: 'S3', label: 'Doktor (S3)' }
  ];

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
    
    console.log('Password validation debug:', {
      password,
      minLength,
      hasLowerCase,
      hasUpperCase,
      hasNumbers,
      hasSpecialChar
    });
    
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
    setSuccess('');

    // Validasi password
    if (formData.password !== formData.password_confirmation) {
      setError('Password dan konfirmasi password tidak sama');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      const { errors } = passwordValidation;
      let errorMessage = 'Password harus mengandung:';
      if (!errors.minLength) errorMessage += '\n• Minimal 8 karakter';
      if (!errors.hasLowerCase) errorMessage += '\n• Huruf kecil (a-z)';
      if (!errors.hasUpperCase) errorMessage += '\n• Huruf besar (A-Z)';
      if (!errors.hasNumbers) errorMessage += '\n• Angka (0-9)';
      if (!errors.hasSpecialChar) errorMessage += '\n• Karakter spesial (@$!%*?&)';
      errorMessage += '\n\nContoh: Password123#';
      
      setError(errorMessage);
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          navigate('/verify-email', { state: { userId: result.user_id } });
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={handleBackToHome}
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
              Mulai Petualanganmu
            </motion.h1>
            <p className="text-white/90 mb-8">Daftar untuk mengikuti event, raih sertifikat, dan bangun portofolio.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Cpu className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Kelas Teknologi</div>
                  <div className="text-white/80 text-sm">Upgrade skill dengan mentor berpengalaman</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Users className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Komunitas Aktif</div>
                  <div className="text-white/80 text-sm">Bertukar wawasan dan peluang</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Palette className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Event Kreatif</div>
                  <div className="text-white/80 text-sm">Eksplorasi minat seni dan budaya</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Calendar className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Jadwal Padat Manfaat</div>
                  <div className="text-white/80 text-sm">Kegiatan rutin setiap bulan</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right panel (form) */}
        <div className="flex items-center justify-center p-6">
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .5 }}
            className="w-full max-w-lg">
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 space-y-6 border border-white/40 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-gray-800">Daftar Akun Baru</div>
                <p className="text-gray-600 text-sm">Bergabung untuk mengikuti kegiatan SMKN 4 Bogor</p>
              </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="meitantifadilah71@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                No. Handphone
              </label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                placeholder="08xxxxxxxxxx"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">
                Alamat Tempat Tinggal
              </label>
              <textarea
                id="address"
                name="address"
                placeholder="Masukkan alamat lengkap"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                required
                className="flex w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="education" className="text-sm font-medium text-gray-700">
                Pendidikan Terakhir
              </label>
              <select
                id="education"
                name="education"
                value={formData.education}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Pilih pendidikan terakhir</option>
                {educationLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Contoh: Password123#"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

            <div className="space-y-2">
              <label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="password_confirmation"
                  name="password_confirmation"
                  placeholder="Ulangi password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  className="w-full pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Mendaftar...' : 'Daftar Akun'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Masuk di sini
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  </div>
</div>
  );
}

export default Register;
