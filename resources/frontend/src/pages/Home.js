import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Search, Calendar, Users, Award, ChevronDown, BookOpen, Trophy, Presentation, UserPlus, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import FloatingElements from '../components/FloatingElements';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/media';
import Footer from '../components/Footer';
import PartnersCarousel from '../components/PartnersCarousel';
import PhoneMock from '../components/PhoneMock';

function Home() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const eventsPerPage = 4;
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const displayedEvents = events.slice(currentPage * eventsPerPage, (currentPage + 1) * eventsPerPage);
  
  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll();
      
      // Handle different response structures
      let eventsData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          eventsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          eventsData = response.data.data;
        }
      }
      
      // Take all published events (no limit) for carousel
      // Carousel will paginate with eventsPerPage = 4
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEvent = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Redirect ke halaman events dengan query parameter
      window.location.href = `/events?search=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  const handleCertificateSearch = () => {
    if (certificateNumber.trim()) {
      // Navigate to certificate verification page
      console.log('Searching for certificate:', certificateNumber);
    }
  };

  const handleDaftarHadir = (eventId) => {
    if (!user) {
      // Redirect to login page if user is not authenticated
      navigate('/login', { 
        state: { 
          from: `/events/${eventId}/register`,
          message: 'Silakan login terlebih dahulu untuk mendaftar event.' 
        }
      });
    } else {
      // Navigate to event registration if user is authenticated
      navigate(`/events/${eventId}/register`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] bg-gray-100 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #6b7280 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #9ca3af 2px, transparent 2px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px'
          }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center min-h-[56vh] sm:min-h-[64vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              {/* Left Content */}
              <div className="text-left">
                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-3 sm:mb-5 leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  Welcome
                  <br />
                  <motion.span 
                    className="text-blue-500"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  >
                    To EduFest
                  </motion.span>
                </motion.h1>
                
                <motion.p 
                  className="text-sm sm:text-base md:text-lg text-gray-600 mb-5 sm:mb-6 max-w-lg leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                >
                  Platform event EduFest: temukan, daftar, dan kelola berbagai kegiatan dan lomba terbaik untuk komunitas Anda.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-2.5 sm:gap-3.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full sm:w-auto"
                  >
                    <Button 
                      asChild
                      className="w-full sm:w-auto bg-gray-800 text-white hover:bg-gray-900 font-semibold px-5 sm:px-6 py-2.5 rounded-md shadow-md hover:shadow-lg transition-all duration-300 text-[14px]"
                    >
                      <Link to="/events">Lihat Event</Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="w-full sm:w-auto border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 px-5 sm:px-6 py-2.5 font-semibold rounded-md text-[14px]"
                    >
                      <Link to="/about">Tentang Kami</Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
              
              {/* Right Content - Image/Visual */}
              <div className="relative mt-8 lg:mt-0">
                <motion.div
                  className="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-sm sm:max-w-md mx-auto"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                  {/* Mock Phone/Device */}
                  <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-200">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">Event Terbaru</div>
                          <div className="text-sm text-gray-500">Lomba Programming</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">Prestasi</div>
                          <div className="text-sm text-gray-500">150+ Penghargaan</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">Peserta Aktif</div>
                          <div className="text-sm text-gray-500">2000+ Anggota Komunitas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <motion.div
                    className="absolute -top-4 -right-4 w-8 h-8 bg-blue-400 rounded-full"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400 rounded-full"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Scroll Indicator */}
        <motion.div 
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-gray-400"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* Features Section - Why Choose Us */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.p 
              className="text-sm sm:text-base tracking-[0.3em] text-red-500 font-medium mb-3 uppercase"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              WHY CHOOSE US
            </motion.p>
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Why Choose Us
            </motion.h2>
          </motion.div>

          {/* Features Grid with Interactive Scale Effect */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1: Mudah Diakses */}
            <motion.div
              className="relative h-full"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
              animate={{
                scale: hoveredCard === 1 ? 1.15 : hoveredCard !== null ? 0.9 : 1,
                y: hoveredCard === 1 ? -20 : 0,
              }}
              style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-500 relative h-full flex flex-col">
                {/* Number Badge */}
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base">01</span>
                </div>
                
                {/* Icon */}
                <motion.div 
                  className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mb-4 mt-3"
                  animate={{ rotate: hoveredCard === 1 ? [0, -10, 10, 0] : 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Search className="w-6 h-6 text-white" />
                </motion.div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">Mudah Diakses</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Platform intuitif yang memudahkan Anda menemukan dan mendaftar event favorit.
                </p>
              </div>
            </motion.div>

            {/* Feature 2: Sistem Terintegrasi */}
            <motion.div
              className="relative h-full"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
              animate={{
                scale: hoveredCard === 2 ? 1.15 : hoveredCard !== null ? 0.9 : 1,
                y: hoveredCard === 2 ? -20 : 0,
              }}
              style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-500 relative h-full flex flex-col">
                {/* Number Badge */}
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base">02</span>
                </div>
                
                {/* Icon */}
                <motion.div 
                  className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mt-3"
                  animate={{ rotate: hoveredCard === 2 ? [0, 15, -15, 0] : 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Award className="w-6 h-6 text-white" />
                </motion.div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">Sistem Terintegrasi</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Kelola semua kegiatan dari pendaftaran hingga sertifikat dalam satu platform.
                </p>
              </div>
            </motion.div>

            {/* Feature 3: Aman & Terpercaya */}
            <motion.div
              className="relative h-full"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              onMouseEnter={() => setHoveredCard(3)}
              onMouseLeave={() => setHoveredCard(null)}
              animate={{
                scale: hoveredCard === 3 ? 1.15 : hoveredCard !== null ? 0.9 : 1,
                y: hoveredCard === 3 ? -20 : 0,
              }}
              style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-500 relative h-full flex flex-col">
                {/* Number Badge */}
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base">03</span>
                </div>
                
                {/* Icon */}
                <motion.div 
                  className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 mt-3"
                  animate={{ rotate: hoveredCard === 3 ? [0, -5, 5, 0] : 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <UserPlus className="w-6 h-6 text-white" />
                </motion.div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aman & Terpercaya</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Data Anda terlindungi dengan sistem keamanan tingkat tinggi dan proses transparan.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Events - Recent Events Design */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D1B69] mb-4"></div>
              <p className="text-gray-600">Memuat event unggulan...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Side - Title, Description & Navigation */}
              <div className="lg:col-span-3 flex flex-col justify-between">
                <div>
                  <motion.h2 
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-[#2D1B69] leading-tight"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    Yang Lagi
                    <br />
                    <span className="text-blue-600">Hype</span> di
                    <br />
                    <span className="text-blue-600">EduFest</span>!
                  </motion.h2>
                  <motion.p 
                    className="text-gray-500 text-sm sm:text-base max-w-xs leading-relaxed mb-8"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    It is a long established fact that a reader will be distracted
                  </motion.p>
                </div>

                {/* Navigation Controls */}
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {/* Page Counter */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-800">{currentPage + 1}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-xl text-gray-400">{totalPages || 1}</span>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handlePrevPage}
                      disabled={events.length === 0}
                      className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#2D1B69] hover:bg-[#2D1B69] hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-white" />
                    </motion.button>
                    <motion.button
                      onClick={handleNextPage}
                      disabled={events.length === 0}
                      className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#2D1B69] hover:bg-[#2D1B69] hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Right Side - Events Grid */}
              <div className="lg:col-span-9">
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {(displayedEvents.length > 0 ? displayedEvents : [
                    {
                      id: "1",
                      title: "The second single to be taken from Coldplay's",
                      event_date: "2016-09-28",
                      location: "Studio EduFest",
                      category: "Teknologi",
                      flyer_path: null,
                      registrations_count: 21
                    },
                    {
                      id: "2",
                      title: "It is a long established fact that a reader will be distracted",
                      event_date: "2016-09-28",
                      location: "Auditorium EduFest",
                      category: "Seni",
                      flyer_path: null,
                      registrations_count: 21
                    },
                    {
                      id: "3",
                      title: "The second single to be taken from Coldplay's",
                      event_date: "2016-09-28",
                      location: "Hall Pameran EduFest",
                      category: "Pameran",
                      flyer_path: null,
                      registrations_count: 21
                    },
                    {
                      id: "4",
                      title: "Many desktop publishing packages and web page",
                      event_date: "2016-09-28",
                      location: "Venue EduFest",
                      category: "Akademik",
                      flyer_path: null,
                      registrations_count: 21
                    }
                  ]).map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="group cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -8 }}
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100">
                        {/* Event Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={
                              event.flyer_url || event.image_url || 
                              (event.image_path || event.flyer_path) && (event.image_path !== '0' && event.flyer_path !== '0')
                                ? resolveMediaUrl(event.image_path || event.flyer_path)
                                : `https://images.unsplash.com/photo-${1492684223066 + index}-043259c2d91e?q=80&w=800&auto=format&fit=crop`
                            }
                            alt={event.title || 'Event'}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        {/* Event Info */}
                        <div className="p-4">
                          {/* Date & Shares */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {event.event_date 
                                  ? new Date(event.event_date).toLocaleDateString('id-ID', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric' 
                                    })
                                  : '28. 9. 2016'
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Share2 className="w-3.5 h-3.5" />
                              <span>{event.registrations_count || 21} Share</span>
                            </div>
                          </div>

                          {/* Event Title */}
                          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#2D1B69] transition-colors duration-300">
                            {event.title || 'Event Title'}
                          </h3>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tutorial Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-white relative overflow-hidden">
        {/* Background Elements - Hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <motion.div
            className="absolute top-20 left-20 w-40 h-40 bg-blue-200/15 rounded-full blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-32 right-32 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Cara Menggunakan <span className="text-blue-600">EduFest</span>
            </motion.h2>
            <motion.p 
              className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Ikuti langkah mudah ini untuk memulai perjalanan edukatif Anda
            </motion.p>
          </div>

          {/* Tutorial Steps with Connecting Lines */}
          <div className="relative">
            {/* Connecting SVG Lines (hidden as requested) */}
            <svg className="hidden" style={{ zIndex: 1 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              
              {/* Animated connecting lines */}
              <motion.path
                d="M 280 120 Q 400 80 520 160"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8,4"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                viewport={{ once: true }}
              />
              <motion.path
                d="M 760 180 Q 880 140 1000 220"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8,4"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 1 }}
                viewport={{ once: true }}
              />
              <motion.path
                d="M 280 360 Q 400 320 520 400"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8,4"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 1.5 }}
                viewport={{ once: true }}
              />
              
              {/* Animated dots moving along paths */}
              <motion.circle
                r="4"
                fill="#3b82f6"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 2 }}
              >
                <animateMotion dur="3s" repeatCount="indefinite" begin="2s">
                  <mpath href="#path1" />
                </animateMotion>
              </motion.circle>
            </svg>

            {/* Tutorial Cards in 4-Column Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative" style={{ zIndex: 2 }}>
              {[
                {
                  step: "01",
                  title: "Daftar Akun",
                  description: "Buat akun baru dengan email dan data diri yang valid untuk memulai",
                  icon: UserPlus,
                  color: "from-blue-500 to-blue-600",
                  position: "lg:-rotate-1 lg:translate-y-2"
                },
                {
                  step: "02", 
                  title: "Pilih Event",
                  description: "Jelajahi berbagai kegiatan menarik dan temukan yang sesuai minat Anda",
                  icon: Search,
                  color: "from-emerald-500 to-emerald-600",
                  position: "lg:rotate-1 lg:-translate-y-1"
                },
                {
                  step: "03",
                  title: "Daftar Kegiatan", 
                  description: "Klik tombol daftar dan lengkapi formulir pendaftaran dengan benar",
                  icon: BookOpen,
                  color: "from-violet-500 to-violet-600",
                  position: "lg:-rotate-1 lg:translate-y-1"
                },
                {
                  step: "04",
                  title: "Dapatkan Sertifikat",
                  description: "Ikuti kegiatan hingga selesai dan dapatkan sertifikat digital resmi",
                  icon: Award,
                  color: "from-amber-500 to-amber-600",
                  position: "lg:rotate-1 lg:-translate-y-2"
                }
              ].map((tutorial, index) => {
                const IconComponent = tutorial.icon;
                return (
                  <motion.div
                    key={index}
                    className={`group ${tutorial.position} transform transition-all duration-500`}
                    initial={{ opacity: 0, y: 50, rotate: 0 }}
                    whileInView={{ 
                      opacity: 1, 
                      y: 0, 
                      rotate: tutorial.position.includes('rotate-1') ? 
                             (tutorial.position.includes('-rotate-1') ? -1 : 1) : 0
                    }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      y: -4,
                      scale: 1.02,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <Card className="h-full bg-white/90 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden relative group-hover:bg-white">
                      {/* Floating Step Number - adjusted to be inside corner */}
                      <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md z-20">
                        <span className="text-white font-bold text-xs">{tutorial.step}</span>
                      </div>
                      
                      {/* Subtle Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `radial-gradient(circle at 20% 20%, #3b82f6 1px, transparent 1px)`,
                          backgroundSize: '15px 15px'
                        }} />
                      </div>
                      
                      <CardContent className="p-5 relative z-10">
                        {/* Icon with Enhanced Animation */}
                        <motion.div 
                          className={`w-12 h-12 bg-gradient-to-br ${tutorial.color} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-shadow duration-300`}
                          whileHover={{ 
                            rotate: [0, -5, 5, 0],
                            scale: 1.1
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </motion.div>

                        {/* Content */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            {tutorial.title}
                          </h3>
                          <p className="text-gray-600 leading-relaxed text-sm">
                            {tutorial.description}
                          </p>
                        </div>

                        {/* Decorative Element */}
                        <motion.div 
                          className="absolute bottom-3 right-3 w-1.5 h-1.5 bg-blue-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            delay: index * 0.3 
                          }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Call to Action */}
          <motion.div 
            className="text-center mt-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {user ? (
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 text-white px-10 py-5 text-xl font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border-0"
                  onClick={() => navigate('/events')}
                >
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Jelajahi Event Sekarang
                  </motion.span>
                  <ChevronDown className="w-6 h-6 ml-3 rotate-[-90deg]" />
                </Button>
              ) : (
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 text-white px-10 py-5 text-xl font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border-0"
                  onClick={() => navigate('/register')}
                >
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Mulai Sekarang
                  </motion.span>
                  <ChevronDown className="w-6 h-6 ml-3 rotate-[-90deg]" />
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Platform Highlights Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, #3b82f6 1px, transparent 1px),
                             radial-gradient(circle at 80% 80%, #60a5fa 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px'
          }} />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <PartnersCarousel />
        </div>
      </section>

      {/* CTA Section removed for cleaner layout */}

      {/* Download App Hero (before footer) */}
      <section className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-xs uppercase tracking-widest text-gray-500">New apps</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">Even more power inside.</h2>

            {/* Phone + badges layout */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:gap-10">
              {/* Left badge */}
              <motion.div 
                className="flex justify-center order-2 md:order-1"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.a 
                  href="/events" 
                  className="inline-flex items-center gap-3 rounded-xl bg-black text-white px-4 py-3 shadow hover:opacity-90"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img src="https://cdn.simpleicons.org/apple/FFFFFF" alt="App Store" className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-[10px]/3 opacity-70">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </motion.a>
              </motion.div>

              {/* Phone mock center - fixed for mobile */}
              <motion.div 
                className="order-1 md:order-2 flex items-center justify-center"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px]"
                  animate={{ 
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Phone mock - full size, no cropping on mobile */}
                  <div className="w-full">
                    <PhoneMock className="w-full" />
                  </div>
                </motion.div>
              </motion.div>

              {/* Right badge */}
              <motion.div 
                className="flex justify-center order-3"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.a 
                  href="/events" 
                  className="inline-flex items-center gap-3 rounded-xl bg-black text-white px-4 py-3 shadow hover:opacity-90"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img src="https://cdn.simpleicons.org/googleplay/FFFFFF" alt="Google Play" className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-[10px]/3 opacity-70">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </motion.a>
              </motion.div>
            </div>

            {/* Description */}
            <p className="mt-8 max-w-2xl mx-auto text-gray-600 text-sm md:text-base">Apps on iOS and Android membantu kamu melakukan semua hal seputar event. Mereka membuat pengalaman harianmu lebih efisien.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;
