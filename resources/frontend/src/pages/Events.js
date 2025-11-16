import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { wishlistService } from '../services/wishlistService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ArrowLeft, Search, Calendar, MapPin, Users, Filter, ChevronLeft, ChevronRight, Image as ImageIcon, ChevronDown, Cpu, Palette, Dumbbell, BookOpen, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/media';
import Footer from '../components/Footer';
import api from '../services/api';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const { user } = useAuth();
  const [showCategories, setShowCategories] = useState(false);
  const navigate = useNavigate();
  const [wishlistedEvents, setWishlistedEvents] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Track window size for responsive banner width
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check for search parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, []);

  // Fetch wishlist when user changes (login/logout)
  useEffect(() => {
    if (user) {
      fetchWishlistStatus();
    } else {
      setWishlistedEvents(new Set());
    }
  }, [user]);

  // Fetch events when search term, filter, or sort order changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when filters change
      fetchEvents(1, true); // true = reset events
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterCategory, sortOrder]);

  const fetchEvents = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await eventService.getEvents({
        q: searchTerm,
        sort: sortOrder,
        category: filterCategory,
        page: page
      });
      
      console.log('ðŸ“‹ Events fetched:', response.data);
      console.log('ðŸ“„ Pagination:', { current: response.current_page, total: response.last_page });
      
      // Handle response structure: { success: true, data: [...], current_page: 1, ... }
      // eventService.getEvents() returns response.data which is { success, data, current_page, ... }
      const eventsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      const paginationInfo = {
        current_page: response.current_page || response.data?.current_page || 1,
        last_page: response.last_page || response.data?.last_page || 1,
        total: response.total || response.data?.total || eventsData.length,
        per_page: response.per_page || response.data?.per_page || eventsData.length,
      };
      
      console.log('📋 Events fetched:', eventsData);
      console.log('📄 Pagination:', paginationInfo);
      console.log('📊 Total events:', eventsData.length);
      
      if (reset) {
        setEvents(eventsData || []);
      } else {
        setEvents(prev => [...prev, ...(eventsData || [])]);
      }
      
      setCurrentPage(paginationInfo.current_page);
      setTotalPages(paginationInfo.last_page);
      
      // Fetch wishlist status if user is logged in
      if (user) {
        fetchWishlistStatus();
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      // Sample events with categories for testing
      setEvents([
        {
          id: 1,
          title: 'Workshop Testing Absensi',
          description: 'Event khusus untuk testing fitur absensi dan sertifikat. Event ini berlangsung hari ini dan bisa langsung absen.',
          event_date: '2025-09-12',
          start_time: '01:10:15',
          end_time: '04:10:15',
          location: 'Lab Testing SMKN 4 Bogor',
          category: 'teknologi',
          price: 0,
          is_free: true,
          is_published: true
        },
        {
          id: 2,
          title: 'Seminar Teknologi AI - Certificate Test',
          description: 'Seminar tentang perkembangan AI dan machine learning. Cocok untuk testing sistem email OTP dan verifikasi kehadiran. Dapatkan sertifikat...',
          event_date: '2025-09-13',
          start_time: '13:00:00',
          end_time: '17:00:00',
          location: 'Auditorium SMKN 4 Bogor',
          category: 'teknologi',
          price: 0,
          is_free: true,
          is_published: true
        },
        {
          id: 3,
          title: 'Pelatihan Web Development - Full Stack',
          description: 'Pelatihan intensif web development dari frontend hingga backend. Cocok untuk testing complete flow OTP dan sertifikat. Materi HTML...',
          event_date: '2025-09-15',
          start_time: '08:30:00',
          end_time: '17:30:00',
          location: 'Lab Multimedia SMKN 4 Bogor',
          category: 'teknologi',
          price: 0,
          is_free: true,
          is_published: true
        },
        {
          id: 4,
          title: 'Festival Seni dan Budaya',
          description: 'Pameran karya seni siswa dan pertunjukan budaya tradisional. Menampilkan kreativitas siswa dalam berbagai bidang seni.',
          event_date: '2025-12-18',
          start_time: '09:00:00',
          end_time: '17:00:00',
          location: 'Aula SMKN 4 Bogor',
          category: 'seni',
          price: 25000,
          is_free: false,
          is_published: true
        },
        {
          id: 5,
          title: 'Seminar Akademik Penelitian',
          description: 'Seminar tentang metodologi penelitian dan penulisan karya ilmiah untuk siswa.',
          event_date: '2025-12-20',
          start_time: '08:30:00',
          end_time: '16:30:00',
          location: 'Gedung Pameran SMKN 4 Bogor',
          category: 'akademik',
          price: 15000,
          is_free: false,
          is_published: true
        }
      ]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchEvents(currentPage + 1, false);
    }
  };

  const categoryLabel = (val) => {
    const v = normalizeCategory(val);
    const found = categories.find(c => c.value === v);
    return found ? found.label : v || 'Tanpa Kategori';
  };

  const fetchWishlistStatus = async () => {
    try {
      const response = await wishlistService.getWishlist();
      console.log('Wishlist response:', response);
      if (response && response.data) {
        const wishlistedIds = new Set(response.data.map(item => item.event.id));
        console.log('Wishlisted IDs:', Array.from(wishlistedIds));
        setWishlistedEvents(wishlistedIds);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const handleWishlistToggle = async (e, eventId) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user) {
      navigate('/login');
      return;
    }

    console.log('Klik icon love untuk event:', eventId);
    console.log('Status sekarang:', wishlistedEvents.has(eventId) ? 'MERAH (di wishlist)' : 'ABU-ABU (belum di wishlist)');

    try {
      if (wishlistedEvents.has(eventId)) {
        console.log('Menghapus dari wishlist...');
        await wishlistService.removeFromWishlist(eventId);
        setWishlistedEvents(prev => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          console.log('Berhasil dihapus! Wishlist baru:', Array.from(newSet));
          return newSet;
        });
      } else {
        console.log('Menambahkan ke wishlist...');
        const response = await wishlistService.addToWishlist(eventId);
        console.log('Response dari backend:', response);
        setWishlistedEvents(prev => {
          const newSet = new Set(prev).add(eventId);
          console.log('Berhasil ditambah! Wishlist baru:', Array.from(newSet));
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      console.error('Detail error:', error.response?.data);
    }
  };

  // Build Date from event_date + optional start_time
  function getEventDateTime(e) {
    if (!e?.event_date) return new Date(8640000000000000); // max date
    try {
      const base = new Date(e.event_date);
      if (e.start_time && e.start_time !== '00:00:00') {
        const [hh, mm, ss] = String(e.start_time).split(':').map(Number);
        base.setHours(hh || 0, mm || 0, ss || 0, 0);
      }
      return base;
    } catch (_) {
      return new Date(e.event_date);
    }
  }

  // Backend already handles sorting and filtering, so just use events directly
  // No need for client-side sorting to avoid double-sorting issues
  const filteredEvents = events;

  const categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'teknologi', label: 'Teknologi' },
    { value: 'seni_budaya', label: 'Seni & Budaya' },
    { value: 'olahraga', label: 'Olahraga' },
    { value: 'akademik', label: 'Akademik' },
    { value: 'sosial', label: 'Sosial' }
  ];

  // Normalize possible legacy/alias categories from backend
  function normalizeCategory(val) {
    if (!val) return '';
    const v = String(val).toLowerCase();
    if (v === 'seni') return 'seni_budaya';
    return v;
  }

  const categoryIcon = (val) => {
    switch (val) {
      case 'teknologi': return <Cpu className="w-4 h-4 text-blue-600" />;
      case 'seni_budaya': return <Palette className="w-4 h-4 text-pink-600" />;
      case 'olahraga': return <Dumbbell className="w-4 h-4 text-emerald-600" />;
      case 'akademik': return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'sosial': return <Heart className="w-4 h-4 text-rose-600" />;
      default: return <Filter className="w-4 h-4 text-gray-600" />;
    }
  };

  // Fetch banners from API
  useEffect(() => {
    async function fetchBanners() {
      try {
        setBannersLoading(true);
        console.log('=== FETCHING BANNERS ===');
        console.log('API Base URL:', api.defaults.baseURL);
        console.log('Request URL:', api.defaults.baseURL + '/banners');
        
        const response = await api.get('/banners');
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Banners API response:', response.data);
        
        if (response.data.success) {
          const bannersData = response.data.data || [];
          console.log('Banners data:', bannersData);
          console.log('Number of banners:', bannersData.length);
          
          // Sort banners by order field (ascending) to ensure correct display order
          // Backend should already sort them, but this ensures correct order on frontend
          const sortedBanners = [...bannersData].sort((a, b) => {
            const orderA = a.order !== null && a.order !== undefined ? parseInt(a.order) : 999;
            const orderB = b.order !== null && b.order !== undefined ? parseInt(b.order) : 999;
            return orderA - orderB;
          });
          
          // Log each banner details
          sortedBanners.forEach((banner, idx) => {
            console.log(`Banner ${idx}:`, {
              id: banner.id,
              title: banner.title,
              image_path: banner.image_path,
              image_url: banner.image_url,
              is_active: banner.is_active,
              order: banner.order
            });
          });
          
          if (sortedBanners.length > 0) {
            console.log('✅ Setting banners:', sortedBanners);
            setBanners(sortedBanners);
            setBannerIndex(0); // Reset to first banner
          } else {
            console.log('âš ï¸ No banners found in response');
            setBanners([]);
          }
        } else {
          console.log('âŒ API response success=false');
          setBanners([]);
        }
      } catch (error) {
        console.error('âŒ Error fetching banners:', error);
        console.error('Error message:', error.message);
        console.error('Error response:', error.response);
        console.error('Error config:', error.config);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          console.error('Response headers:', error.response.headers);
        } else if (error.request) {
          console.error('No response received:', error.request);
        }
        setBanners([]);
      } finally {
        setBannersLoading(false);
      }
    }
    fetchBanners();
  }, []);

  // Reset banner index if it exceeds array length
  useEffect(() => {
    console.log('Banners state updated:', banners.length, 'banners');
    if (banners.length > 0 && bannerIndex >= banners.length) {
      console.log('Resetting banner index from', bannerIndex, 'to 0');
      setBannerIndex(0);
    }
  }, [banners, bannerIndex]);


  const handleRegisterClick = (eventId) => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(`/events/${eventId}/register`);
    }
  };

  const getEventImageUrl = (event) => {
    // Prioritize flyer_url or image_url if available
    if (event.flyer_url) return event.flyer_url;
    if (event.image_url) return event.image_url;
    
    // Check if flyer_path or image_path exists and is not '0' or empty
    const flyerPath = event.flyer_path || event.image_path || '';
    if (flyerPath && flyerPath !== '0') {
      const url = resolveMediaUrl(flyerPath);
      if (url) return url;
    }
    
    // Fallback to category-based placeholder
    return placeholderByCategory(event.category);
  };

  const placeholderByCategory = (category) => {
    // Return empty string to let image error handler show placeholder
    // or use a simple data URI placeholder if needed
    return '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
  <div className="min-h-screen bg-gray-50">
    {/* Header Section */}
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Controls bar under navbar (no background container) */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari kegiatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-500 h-9 rounded-lg text-[13px]"
            />
          </div>
          {/* Categories dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategories((v) => !v)}
              className="px-3 sm:px-3.5 h-9 inline-flex items-center gap-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-[13px] hover:bg-gray-50"
            >
              {categoryIcon(filterCategory)}
              <span>{categories.find(c=>c.value===filterCategory)?.label || 'Kategori'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {showCategories && (
              <div className="absolute z-20 mt-2 w-60 rounded-lg border border-gray-200 bg-white shadow-lg p-2">
                <div className="px-2 py-1 text-[11px] font-semibold text-gray-500">Pilih Kategori</div>
                <ul className="max-h-64 overflow-auto">
                  {categories.map((c)=> (
                    <li key={c.value}>
                      <button
                        type="button"
                        onClick={() => { setFilterCategory(c.value); setShowCategories(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] hover:bg-gray-50 ${filterCategory===c.value? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                      >
                        {categoryIcon(c.value)}
                        <span>{c.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 sm:px-3.5 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-[13px] focus:outline-none focus:bg-white focus:border-blue-500 h-9"
          >
            <option value="newest">Terbaru Dibuat</option>
            <option value="soonest">Terdekat</option>
            <option value="latest">Terjauh</option>
          </select>
        </div>

          {/* Banner Section - Horizontal Scroll */}
        <div className="relative w-full overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab active:cursor-grabbing" style={{ height: '280px' }}
          onMouseDown={(e) => {
            setIsDragging(true);
            setStartX(e.pageX - e.currentTarget.offsetLeft);
            setScrollLeft(e.currentTarget.scrollLeft);
          }}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - e.currentTarget.offsetLeft;
            const walk = (x - startX) * 2;
            e.currentTarget.scrollLeft = scrollLeft - walk;
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            setStartX(e.touches[0].pageX - e.currentTarget.offsetLeft);
            setScrollLeft(e.currentTarget.scrollLeft);
          }}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={(e) => {
            if (!isDragging) return;
            const x = e.touches[0].pageX - e.currentTarget.offsetLeft;
            const walk = (x - startX) * 2;
            e.currentTarget.scrollLeft = scrollLeft - walk;
          }}
        >
          {bannersLoading ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                <p className="text-lg font-semibold">Memuat banner...</p>
              </div>
            </div>
          ) : banners.length > 0 ? (
            <div className="flex gap-3 h-full md:gap-4 md:px-6 px-3" style={{ width: 'max-content' }}>
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="relative overflow-hidden shadow-lg rounded-lg flex-shrink-0"
                  style={{ 
                    // Mobile: full width (1 banner per view) - calc(100vw - 24px) untuk padding 12px kiri + 12px kanan
                    // Desktop: 2 banners per view - calc(50vw - 30px) untuk padding dan gap
                    width: isMobile ? 'calc(100vw - 24px)' : 'calc(50vw - 30px)',
                    minWidth: isMobile ? 'calc(100vw - 24px)' : 'calc(50vw - 30px)',
                    maxWidth: isMobile ? 'calc(100vw - 24px)' : '600px',
                    height: '100%'
                  }}
                  onClick={(e) => {
                    if (!isDragging && banner.button_link) {
                      window.open(banner.button_link, '_blank');
                    }
                  }}
                >
                  <img
                    src={banner.image_url || resolveMediaUrl(banner.image_path)}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable="false"
                    onError={(e) => {
                      console.error('❌ Banner image failed to load!');
                      console.error('Attempted URL:', e.target.src);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                  {((banner.title && banner.title !== 'null' && banner.title.trim() !== '') || 
                    (banner.description && banner.description !== 'null' && banner.description.trim() !== '')) && (
                    <div className="absolute left-6 bottom-6 text-white drop-shadow-lg pointer-events-none">
                      {banner.title && banner.title !== 'null' && banner.title.trim() !== '' ? (
                        <>
                          <div className="text-xs uppercase tracking-wide opacity-90 mb-1">Featured Event</div>
                          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2">{banner.title}</h2>
                        </>
                      ) : null}
                      {banner.description && banner.description !== 'null' && banner.description.trim() !== '' && (
                        <p className="text-sm md:text-base opacity-90 line-clamp-2 max-w-lg">{banner.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Belum ada banner</p>
                <p className="text-sm opacity-75">Admin dapat menambahkan banner di dashboard</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Content Section */}
    <div className="max-w-[1080px] mx-auto px-6 py-10">
        {/* Section Title */}
        <div className="mb-6 -ml-1">
          <h1 className="text-2xl font-bold text-gray-900">Event</h1>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Memuat kegiatan...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Tidak ada kegiatan ditemukan</h3>
            <p className="text-gray-600">Coba ubah kata kunci pencarian atau filter kategori</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 1 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id || index}
                variants={{ 
                  hidden: { opacity: 0, y: 30, scale: 0.9 }, 
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      duration: 0.6
                    }
                  } 
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/events/${event.id}`)}
                className="cursor-pointer w-full"
              >
              <Card className="group bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col" style={{ borderRadius: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                {/* Event Image/Flyer - Height 180px */}
                <div className="relative w-full overflow-hidden" style={{ height: '180px', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                  <img 
                    src={getEventImageUrl(event)} 
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      console.error('Image failed to load:', e.target.src);
                      e.target.src = placeholderByCategory(event.category);
                    }}
                  />
                  
                  {/* Wishlist Heart Icon */}
                  <button
                    onClick={(e) => handleWishlistToggle(e, event.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 z-10 hover:scale-110"
                  >
                    <Heart 
                      className={`w-5 h-5 transition-transform duration-200 ${
                        wishlistedEvents.has(event.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                </div>
                
                <CardContent className="p-4 flex-1 flex flex-col min-h-[160px]">
                  {/* Title */}
                  <h3 className="font-bold text-gray-900 mb-2 text-[15px] leading-snug line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {event.title}
                  </h3>
                  
                  {/* Date */}
                  <p className="text-[13px] text-gray-600 mb-1 font-normal leading-tight">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'}
                  </p>
                  
                  {/* Location */}
                  <p className="text-[13px] text-gray-500 mb-auto line-clamp-1 leading-tight">
                    {event.location}
                  </p>
                  
                  {/* Price Section */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                    <span className="text-[13px] text-gray-600 font-normal">Mulai Dari</span>
                    <span className="text-[15px] font-bold text-gray-900">
                      {event.is_free ? 'Free' : `Rp ${event.price?.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Load More Button */}
        {!loading && events.length > 0 && currentPage < totalPages && (
          <div className="mt-8 flex justify-center">
            <motion.button
              onClick={loadMore}
              disabled={loadingMore}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Memuat...
                </span>
              ) : (
                `Muat Lebih Banyak (${currentPage} dari ${totalPages})`
              )}
            </motion.button>
          </div>
        )}
        
        {/* Info pagination */}
        {!loading && events.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Menampilkan {events.length} event tersedia
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Events;

