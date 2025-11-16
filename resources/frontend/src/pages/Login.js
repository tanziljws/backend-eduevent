import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Eye, EyeOff, User, Calendar, Palette, Cpu, Users, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Redirect based on user role
        if (result.isAdmin) {
          // Admin login - redirect to admin dashboard
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Regular user login - redirect to events
          navigate('/events', { replace: true });
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
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
              Event Management
            </motion.h1>
            <p className="text-white/90 mb-8">
              Bergabunglah dengan berbagai event menarik dan kembangkan potensi diri Anda.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Cpu className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Workshop & Seminar</div>
                  <div className="text-white/80 text-sm">Belajar interaktif dan praktik langsung</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Users className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Networking Events</div>
                  <div className="text-white/80 text-sm">Bangun koneksi profesional</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Palette className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Competition</div>
                  <div className="text-white/80 text-sm">Kompetisi dan lomba menarik</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <Calendar className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Tech Meetup</div>
                  <div className="text-white/80 text-sm">Diskusi teknologi terkini</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right panel (form) */}
        <div className="flex items-center justify-center p-6">
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .5 }}
            className="w-full max-w-md">
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 space-y-6 border border-white/40">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-gray-800">Masuk</div>
                <p className="text-gray-600 text-sm">Akses akun Anda untuk mengelola event</p>
              </div>

              {location.state?.message && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                  {location.state.message}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="••••••••"
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
                      {showPassword ? (<EyeOff className="w-4 h-4" />) : (<Eye className="w-4 h-4" />)}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500">Belum punya akun? <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">Daftar</Link></div>
                  <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">Lupa password?</Link>
                </div>

                <Button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  {loading ? 'MASUK...' : 'MASUK'}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Login;
