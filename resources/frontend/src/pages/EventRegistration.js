import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ArrowLeft, Calendar, MapPin, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { eventService } from '../services/eventService';
import { motion } from 'framer-motion';

function EventRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    motivation: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    // Pre-fill form with user data if available
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Load Midtrans Snap for paid events
  useEffect(() => {
    if (!event || event.is_free) {
      setSnapLoaded(true); // Free events don't need payment gateway
      return;
    }
    
    // Check if snap is already loaded
    if (window.snap) {
      setSnapLoaded(true);
      return;
    }
    
    const clientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      // No client key - allow direct registration without payment gateway
      console.warn('Midtrans client key not configured. Payment gateway will be skipped.');
      setSnapLoaded(true); // Set to true so button is enabled
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    
    // Set timeout for script loading (10 seconds)
    const timeout = setTimeout(() => {
      if (!window.snap) {
        console.warn('Midtrans Snap script failed to load within timeout.');
        setSnapLoaded(true); // Allow button to be clicked anyway
      }
    }, 10000);
    
    script.onload = () => {
      clearTimeout(timeout);
      if (window.snap) {
        setSnapLoaded(true);
      } else {
        setSnapLoaded(true); // Allow button even if snap object not available
      }
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      console.error('Failed to load Midtrans Snap script.');
      setSnapLoaded(true); // Allow button to be clicked anyway
    };
    
    document.body.appendChild(script);
    
    return () => {
      clearTimeout(timeout);
      // keep script for reuse; do not remove
    };
  }, [event]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvent(id);
      setEvent(response);
    } catch (error) {
      console.error('Error fetching event:', error);
      // Don't set error for fallback data
      // Fallback data
      setEvent({
        id: id,
        title: 'Kegiatan Sekolah',
        description: 'Kegiatan resmi SMKN 4 Bogor.',
        event_date: '2025-09-09',
        start_time: '08:00:00',
        end_time: '16:00:00',
        location: 'Lab Computer SMKN 4 Bogor',
        price: 0,
        is_free: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Paid event: Midtrans checkout
  const handlePay = async () => {
    if (!user) { 
      navigate('/login'); 
      return; 
    }
    if (!event || event.is_free) return;
    
    try {
      setIsPaying(true);
      setError(null);
      
      // If Midtrans is not configured, still create payment but show message
      const clientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY;
      if (!clientKey || !window.snap) {
        // No payment gateway configured - create registration anyway
        const res = await eventService.createPayment(event.id);
        setSuccess('Registrasi berhasil dibuat. Pembayaran akan diproses secara manual oleh admin.');
        // Redirect to event detail or registration success page after delay
        setTimeout(() => {
          navigate(`/events/${id}`);
        }, 2000);
        return;
      }
      
      const res = await eventService.createPayment(event.id);
      const token = res?.snap_token;
      
      if (token && window.snap) {
        window.snap.pay(token, {
          onSuccess: function() {
            setSuccess('Pembayaran berhasil. Status registrasi akan diperbarui.');
            // Refresh page after a delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          },
          onPending: function() {
            setSuccess('Pembayaran tertunda. Silakan selesaikan pembayaran Anda.');
            // Refresh page after a delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          },
          onError: function() {
            setError('Terjadi kesalahan saat memproses pembayaran.');
          },
          onClose: function() {
            // Ditutup tanpa menyelesaikan pembayaran
          }
        });
      } else {
        // No token or snap not available - still allow registration
        setSuccess('Registrasi berhasil dibuat. Silakan hubungi admin untuk pembayaran.');
        setTimeout(() => {
          navigate(`/events/${id}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      // On error, show error message
      if (err?.response?.status === 404 || err?.response?.status === 400) {
        setError(err?.response?.data?.message || 'Gagal memulai pembayaran. Silakan coba lagi.');
      } else {
        setError(err?.response?.data?.message || 'Gagal memulai pembayaran. Silakan coba lagi.');
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // If paid event, bypass form submit and go to payment
    if (event && !event.is_free) {
      handlePay();
      return;
    }

    // Validasi form
    if (!formData.name.trim()) {
      setError('Nama lengkap harus diisi');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email harus diisi');
      return;
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid');
      return;
    }
    
    if (!formData.phone.trim()) {
      setError('No. Handphone harus diisi');
      return;
    }
    
    if (!agreed) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Call actual backend API for registration
      const response = await eventService.registerForEvent(id, formData);
      // eventService already returns response.data, so response is a plain object
      if (response && (response.registration_id || response.message)) {
        // Registration successful - backend will send email with OTP
        localStorage.setItem('eventRegistered', 'true');
        localStorage.removeItem('eventOTP'); // Remove any old OTP

        setSuccess(
          response.message ||
            'Pendaftaran berhasil! Token OTP telah dikirim ke alamat email Anda. Silakan cek email untuk mendapatkan kode token yang akan digunakan saat mengisi daftar hadir.'
        );

        // Hide form after success
        setFormData({ name: '', email: '', phone: '', motivation: '' });

        // Redirect to attendance page after 2 seconds
        setTimeout(() => {
          navigate(`/events/${id}/attendance`);
        }, 2000);
      } else {
        // Backend responded without the expected shape
        setError(response?.message || 'Gagal mendaftar event. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response && error.response.data && error.response.data.message) {
        const errorMsg = error.response.data.message;
        const errorData = error.response.data;
        
        if (errorMsg.includes('Unauthenticated')) {
          setError('Sesi Anda telah berakhir. Silakan login kembali.');
          setTimeout(() => navigate('/login'), 2000);
        } else if (errorData.event_expired || errorMsg.includes('kadaluarsa')) {
          // Event expired - redirect to event detail after showing error
          setError(errorMsg);
          setTimeout(() => navigate(`/events/${id}`), 3000);
        } else if (errorData.registration_closed || errorMsg.includes('ditutup')) {
          // Registration closed
          setError(errorMsg);
          setTimeout(() => navigate(`/events/${id}`), 3000);
        } else {
          setError(errorMsg);
        }
      } else {
        setError('Gagal mendaftar event. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gray-600"
        >
          Memuat formulir pendaftaran...
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4">
          <div className="max-w-7xl mx-auto px-6">
            <Link to={`/events/${id}`} className="inline-flex items-center text-gray-800 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto px-6 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h1>
            <p className="text-gray-700 mb-6">{success}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3">
                <Link to="/events">📅 Lihat Event Lainnya</Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link to={`/events/${id}/attendance`}>🎯 Masukkan Token Kehadiran</Link>
              </Button>
              <Button asChild variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300">
                <Link to="/dashboard">Ke Dashboard</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Link to={`/events/${id}`} className="inline-flex items-center text-gray-800 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Formulir Pendaftaran</CardTitle>
                <p className="text-gray-600 text-sm">Lengkapi data berikut untuk mendaftar kegiatan</p>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      <div>
                        <span>{success}</span>
                        <div className="mt-2 text-sm text-green-200">
                          Anda akan diarahkan ke halaman input token dalam 2 detik...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!success && event?.is_free && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Token kehadiran akan dikirim ke email ini</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      No. Handphone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="08xxxxxxxxxx"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-2">
                      Motivasi Mengikuti Kegiatan
                    </label>
                    <textarea
                      id="motivation"
                      name="motivation"
                      rows={4}
                      placeholder="Ceritakan motivasi Anda mengikuti kegiatan ini..."
                      value={formData.motivation}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <input
                      type="checkbox"
                      id="agreement"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="agreement" className="text-sm text-gray-700">
                      Saya menyetujui syarat dan ketentuan kegiatan serta bersedia mengikuti 
                      seluruh rangkaian acara sesuai jadwal yang telah ditentukan.
                    </label>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      type="submit"
                      disabled={submitting || !agreed}
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-base font-semibold"
                    >
                      {submitting ? 'Mendaftar...' : 'Daftar Sekarang'}
                    </Button>
                  </motion.div>
                </form>
                )}
                {!success && !event?.is_free && (
                  <div className="space-y-6">
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                      Event ini berbayar. Lengkapi informasi kontak lalu lanjut ke pembayaran.
                    </div>
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                        <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nama Anda" className="bg-gray-50 border-gray-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="nama@email.com" className="bg-gray-50 border-gray-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">No. Handphone</label>
                        <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" className="bg-gray-50 border-gray-300" />
                      </div>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" id="agreePaid" checked={agreed} onChange={(e)=>setAgreed(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="agreePaid" className="text-sm text-gray-700">Dengan ini saya menyetujui syarat dan ketentuan serta melanjutkan ke pembayaran.</label>
                      </div>
                    </div>
                    {/* Order summary minimal */}
                    <div className="rounded-lg border border-gray-200 p-4 bg-white">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Event</span>
                        <span className="font-medium text-gray-900">{event?.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">Harga</span>
                        <span className="font-semibold text-gray-900">{(event?.price||0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).replace('IDR', 'Rp')}</span>
                      </div>
                    </div>
                    <Button
                      onClick={handlePay}
                      disabled={isPaying || !agreed}
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-base font-semibold disabled:opacity-60"
                    >
                      {isPaying ? 'Memulai Pembayaran...' : 'Lanjut Pembayaran'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Event Summary Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Ringkasan Kegiatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {event?.title || 'Kegiatan Sekolah'}
                  </h3>
                </motion.div>

                <div className="space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span>
                      {event?.event_date ? 
                        new Date(event.event_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 
                        'Minggu, 15 Desember 2025'
                      }
                    </span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span>{event?.start_time || '09:00'} - {event?.end_time || '17:00'} WIB</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span>{event?.location || 'Lab Komputer SMKN 4 Bogor'}</span>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="border-t border-gray-200 pt-4"
                >
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">Batas Pendaftaran:</span>
                  </div>
                  <div className="text-gray-700">Jumat, 13 Desember 2025</div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Yang Akan Anda Dapatkan:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <motion.li 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Sertifikat keikutsertaan
                    </motion.li>
                    <motion.li 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Token kehadiran via email
                    </motion.li>
                    <motion.li 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Akses ke materi kegiatan
                    </motion.li>
                    <motion.li 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Networking dengan peserta lain
                    </motion.li>
                  </ul>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default EventRegistration;
