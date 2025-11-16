import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Award, Mail, Phone, Share, Download, CheckCircle, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { eventService } from '../services/eventService';
import { wishlistService } from '../services/wishlistService';
import { resolveMediaUrl } from '../utils/media';
import Footer from '../components/Footer';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isAttendanceActive, setIsAttendanceActive] = useState(false);
  const [error, setError] = useState('');
  
  const getPlaceholderByCategory = (category) => {
    // Return empty string to let image error handler show placeholder
    return '';
  };
  
  const heroUrl = React.useMemo(() => {
    if (!event) return '';
    // Use flyer_url or image_url directly (already full URL from backend)
    if (event.flyer_url) return event.flyer_url;
    if (event.image_url) return event.image_url;
    
    // Only use resolveMediaUrl for path fields if they exist and not '0'
    const flyerPath = event.flyer_path || event.image_path || '';
    if (flyerPath && flyerPath !== '0') {
      const url = resolveMediaUrl(flyerPath);
      if (url) return url;
    }
    
    // Fallback to placeholder based on category
    return getPlaceholderByCategory(event.category);
  }, [event]);
  const [success, setSuccess] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEventExpired, setIsEventExpired] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    checkAttendanceAvailability();
  }, [event]);

  const checkAttendanceAvailability = () => {
    if (!event || !event.event_date || !event.start_time) {
      setIsAttendanceActive(false);
      return;
    }

    const now = new Date();
    const eventDate = new Date(event.event_date);
    const eventDateTime = new Date(`${event.event_date}T${event.start_time}`);
    
    // Check if event date has passed (event is expired)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    setIsEventExpired(eventDate < today);
    
    // Tombol aktif jika sudah melewati waktu kegiatan
    setIsAttendanceActive(now >= eventDateTime);
  };

  // Load Midtrans Snap JS when needed (only once)
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

  const getFlyerTitle = () => {
    if (!event) return '';
    // Base name: take title part before dash ( - – — )
    const rawTitle = event.title || '';
    const baseName = rawTitle.split(/\s[-–—]\s/)[0] || rawTitle;
    // Year: prefer from event_date, else try to find 4-digit year in title
    let year = '';
    if (event.event_date) {
      const d = new Date(event.event_date);
      if (!isNaN(d.getTime())) year = String(d.getFullYear());
    }
    if (!year) {
      const m = rawTitle.match(/(20\d{2}|19\d{2})/);
      if (m) year = m[1];
    }
    return year ? `${baseName} ${year}` : baseName;
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvent(id);
      setEvent(response);
      
      // Check wishlist status if user is logged in
      if (user) {
        checkWishlistStatus();
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Event tidak ditemukan');
      // Fallback data based on ID
      const eventData = {
        1: {
          id: 1,
          title: 'Kegiatan Sekolah',
          description: 'Kegiatan resmi SMKN 4 Bogor. Detail acara, waktu, dan informasi pendaftaran disajikan secara ringkas dan profesional.',
          event_date: '2025-09-09',
          start_time: '08:00:00',
          end_time: '16:00:00',
          location: 'Lab Computer SMKN 4 Bogor',
          price: 0,
          is_free: true,
          is_published: true
        }
      };
      setEvent(eventData[id] || eventData[1]);
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const response = await wishlistService.checkWishlist(id);
      setIsWishlisted(response.is_wishlisted);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(id);
        setIsWishlisted(false);
      } else {
        await wishlistService.addToWishlist(id);
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setRegistering(true);
      setError('');
      setSuccess('Berhasil mendaftar! Silakan cek email untuk konfirmasi.');
    } catch (error) {
      setError('Gagal mendaftar event');
    } finally {
      setRegistering(false);
    }
  };

  // START: Paid event checkout handler (Midtrans Snap)
  const handlePay = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!event || event.is_free) return;
    
    try {
      setIsPaying(true);
      setError('');
      
      // If Midtrans is not configured, redirect to registration page
      const clientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY;
      if (!clientKey || !window.snap) {
        // No payment gateway configured - redirect to registration
        navigate(`/events/${id}/register`);
        return;
      }
      
      const res = await eventService.createPayment(event.id);
      const token = res?.snap_token;
      
      if (token && window.snap) {
        window.snap.pay(token, {
          onSuccess: function () {
            setSuccess('Pembayaran berhasil. Status registrasi akan diperbarui.');
            // Refresh page after a delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          },
          onPending: function () {
            setSuccess('Pembayaran tertunda. Silakan selesaikan pembayaran Anda.');
            // Refresh page after a delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          },
          onError: function () {
            setError('Terjadi kesalahan saat memproses pembayaran.');
          },
          onClose: function () {
            // Ditutup tanpa menyelesaikan pembayaran
          }
        });
      } else {
        // No token or snap not available - redirect to registration
        navigate(`/events/${id}/register`);
      }
    } catch (e) {
      console.error('Payment error:', e);
      // On error, redirect to registration page
      if (e?.response?.status === 404 || e?.response?.status === 400) {
        // User not registered yet - redirect to registration
        navigate(`/events/${id}/register`);
      } else {
        setError(e?.response?.data?.message || 'Gagal memulai pembayaran. Silakan daftar terlebih dahulu.');
      }
    } finally {
      setIsPaying(false);
    }
  };
  // END: Paid event checkout handler

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-600">Memuat detail event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <Link 
          to="/events" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Kembali ke Event</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm relative">
              {heroUrl ? (
                <img 
                  src={heroUrl} 
                  alt={event?.title}
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '420px' }}
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center">
                  <h2 className="text-white text-2xl font-bold">{event?.title}</h2>
                </div>
              )}
              
              {/* Wishlist Heart Icon */}
              {user && (
                <button
                  onClick={handleWishlistToggle}
                  className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
                >
                  <Heart 
                    className={`w-6 h-6 transition-transform duration-200 ${
                      isWishlisted 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Deskripsi</h2>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                {event?.description || 'Event khusus untuk siswa SMKN 4 Bogor. Detail acara, waktu, dan informasi pendaftaran disajikan secara ringkas dan profesional.'}
              </p>
            </div>
          </div>
          
          {/* Right Sidebar - Event Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
              {/* Event Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">
                {event?.title || 'Kegiatan Sekolah'}
              </h1>

              {/* Event Details */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                  <p className="text-[15px] text-gray-900">
                    {event?.event_date ? 
                      new Date(event.event_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'TBA'}
                  </p>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                  <p className="text-[15px] text-gray-900">
                    {event?.start_time ? event.start_time.substring(0, 5) : '13:00'} WIB
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[15px] text-gray-900 mb-1">{event?.location || 'Belum ditentukan'}</p>
                    <a 
                      href="https://www.google.com/maps/search/?api=1&query=Jl.+Raya+Tajur,+Kp.+Buntar+RT.02/RW.08,+Kel.+Muara+sari,+Kec.+Bogor+Selatan,+RT.03/RW.08,+Muarasari,+Kec.+Bogor+Sel.,+Kota+Bogor,+Jawa+Barat+16137"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] text-blue-600 hover:underline font-medium"
                    >
                      Petunjuk Arah
                    </a>
                  </div>
                </div>
              </div>

              {/* Organizer */}
              {event?.organizer && (
                <div className="mb-6">
                  <p className="text-[14px] text-gray-500 mb-1">Dibuat Oleh</p>
                  <p className="text-[16px] font-bold text-gray-900">{event.organizer}</p>
                </div>
              )}
              </div>

              {/* Price & Action Button Card - Single white box */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] text-gray-900">Mulai Dari</span>
                <span className="text-2xl font-bold text-gray-900">
                  {event?.is_free ? 'Free' : `Rp ${event?.price?.toLocaleString('id-ID')}`}
                </span>
              </div>

              {/* Expired Event Warning */}
              {isEventExpired && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-red-800">Event Sudah Kadaluarsa</p>
                      <p className="text-xs text-red-700 mt-1">Event ini sudah terlewat tanggalnya dan tidak dapat didaftarkan lagi.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {event?.is_free ? (
                <Button 
                  asChild={!isEventExpired}
                  disabled={isEventExpired}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] h-12 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEventExpired ? (
                    <span>Event Sudah Berakhir</span>
                  ) : (
                    <Link to={`/events/${id}/register`}>
                      Beli Sekarang
                    </Link>
                  )}
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handlePay}
                    disabled={isPaying || isEventExpired}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] h-12 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isEventExpired ? 'Event sudah kadaluarsa' : ''}
                  >
                    {isEventExpired ? 'Event Sudah Berakhir' : isPaying ? 'Memproses...' : !snapLoaded ? 'Memuat...' : 'Beli Sekarang'}
                  </Button>
                  {!snapLoaded && !isEventExpired && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Memuat payment gateway...
                    </p>
                  )}
                </>
              )}
              </div>

              {/* Attendance Button (if active) - Separate card */}
              {isAttendanceActive && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                <Button 
                  asChild
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-[16px] h-12 rounded-lg"
                >
                  <Link to={`/events/${id}/attendance`}>
                    Isi Daftar Hadir
                  </Link>
                </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default EventDetail;
