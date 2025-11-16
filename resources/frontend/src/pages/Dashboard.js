import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, Award, CheckCircle, Star, Download, History, LayoutDashboard, BarChart3, FileText, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { eventService } from '../services/eventService';

function Dashboard() {
  const { user } = useAuth();
  const [userHistory, setUserHistory] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const isAuth = !!localStorage.getItem('auth_token');
      const [historyRes, certificatesRes, registrationsRes, eventsRes] = await Promise.all([
        // Only call authenticated endpoints when token exists
        (isAuth 
          ? userService.getEventHistory()
          : Promise.resolve({ data: [] })
        ).catch(err => {
          console.warn('History API error (handled):', err?.response?.status, err?.response?.data || err?.message);
          return { data: [] };
        }),
        (isAuth 
          ? userService.getCertificates()
          : Promise.resolve({ data: [] })
        ).catch(err => {
          console.warn('Certificates API error (handled):', err?.response?.status, err?.response?.data || err?.message);
          return { data: [] };
        }),
        (isAuth 
          ? eventService.getMyRegistrations()
          : Promise.resolve({ data: [] })
        ).catch(err => {
          console.warn('Registrations API error (handled):', err?.response?.status, err?.response?.data || err?.message);
          return { data: [] };
        }),
        eventService.getEvents().catch(err => {
          console.warn('Events API error (handled):', err?.response?.status, err?.response?.data || err?.message);
          return { data: [] };
        })
      ]);
      
      // Debug logging
      console.log('=== DASHBOARD API DEBUG ===');
      console.log('1. History Response:', historyRes);
      console.log('2. Certificates Response:', certificatesRes);
      console.log('3. Registrations Response:', registrationsRes);
      console.log('4. Events Response:', eventsRes);
      console.log('========================');
      
      // Backend /me/history returns attendance records - these are events actually attended
      const resolvedHistory = Array.isArray(historyRes?.data)
        ? historyRes.data
        : (historyRes?.data?.events || []);
      
      console.log('Raw history data (attended events):', resolvedHistory);
      
      // /me/history should return only attended events from Attendance table
      // If user hasn't attended any events, this should be empty
      setUserHistory(resolvedHistory);
      setCertificates(certificatesRes.data || []);
      
      // Fix registrations data handling - Backend returns array directly via axios response.data
      const resolvedRegistrations = Array.isArray(registrationsRes?.data)
        ? registrationsRes.data
        : (Array.isArray(registrationsRes) ? registrationsRes : []);
      
      // Dashboard statistics loaded successfully
      console.log('Dashboard loaded - Event Terdaftar:', resolvedRegistrations.length, 'Event Diikuti:', resolvedHistory.length);
      
      setRegistrations(resolvedRegistrations);
      
      setUpcomingEvents(eventsRes.data?.slice(0, 3) || [
        {
          id: 1,
          title: 'Programming Competition 2025',
          event_date: '2025-02-10',
          location: 'Lab Komputer',
          category: 'Teknologi'
        },
        {
          id: 2,
          title: 'Festival Seni dan Budaya',
          event_date: '2025-02-18',
          location: 'Aula SMKN 4 Bogor',
          category: 'Seni'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback data
      setUserHistory([]);
      setCertificates([]);
      setRegistrations([]);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-600">Memuat dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-semibold">
              {user?.name ? user.name.slice(0,1).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-gray-900 font-semibold leading-tight">{user?.name || 'Pengguna'}</p>
              <p className="text-gray-500 text-sm">SMKN 4 Bogor</p>
            </div>
          </div>
          <nav className="space-y-1">
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-800 bg-blue-50/60 border border-blue-100">
              <LayoutDashboard className="w-4 h-4 text-blue-600" /> Dashboard
            </Link>
            <Link to="/event-history" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Riwayat
            </Link>
            <Link to="/certificates" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              <FileText className="w-4 h-4 text-amber-600" /> Sertifikat
            </Link>
            <Link to="/events" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              <MessageSquare className="w-4 h-4 text-purple-600" /> Jelajahi Event
            </Link>
            <Link to="/logout" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50">
              <LogOut className="w-4 h-4" /> Logout
            </Link>
          </nav>
          {/* Channels */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
            <p className="font-semibold text-gray-800 mb-3">Aksi Cepat</p>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/events" className="p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition">
                <p className="text-xs text-gray-500">Event</p>
                <p className="font-semibold text-gray-900">Jelajahi</p>
              </Link>
              <Link to="/event-history" className="p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition">
                <p className="text-xs text-gray-500">Riwayat</p>
                <p className="font-semibold text-gray-900">Lihat</p>
              </Link>
              <Link to="/certificates" className="p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition">
                <p className="text-xs text-gray-500">Sertifikat</p>
                <p className="font-semibold text-gray-900">Unduh</p>
              </Link>
              <Link to="/events" className="p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition">
                <p className="text-xs text-gray-500">Event</p>
                <p className="font-semibold text-gray-900">Terbaru</p>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 text-sm">Ringkasan aktivitas Anda</p>
              </div>
              <div className="hidden md:flex gap-2">
                <Link to="/events"><Button className="bg-blue-600 hover:bg-blue-700 text-white">Cari Event</Button></Link>
                <Link to="/event-history"><Button variant="outline" className="border-gray-200">Riwayat</Button></Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Event Terdaftar</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{registrations.length || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Event Diikuti</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{userHistory.length || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Sertifikat</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{certificates.length || 0}</p>
            </div>
          </div>

          {/* Activity + Top Events */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-900">Aktivitas</p>
                <span className="text-xs text-gray-500">Data updates otomatis</span>
              </div>
              <svg viewBox="0 0 400 120" className="w-full">
                <defs>
                  <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="400" height="120" fill="url(#grad)" opacity="0.15" />
                <polyline fill="none" stroke="#2563eb" strokeWidth="3" points="0,80 60,70 120,85 180,60 240,75 300,65 360,80" />
              </svg>
            </div>

            {/* Top Events (based on your registrations) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-900">Top Events</p>
                <span className="text-xs text-gray-500">7 hari terakhir</span>
              </div>
              {(() => {
                const counts = new Map();
                registrations.forEach(r => {
                  const t = r?.event?.title || 'Event';
                  counts.set(t, (counts.get(t) || 0) + 1);
                });
                const items = Array.from(counts.entries())
                  .sort((a,b) => b[1]-a[1])
                  .slice(0,4);
                return items.length ? (
                  <div className="space-y-3">
                    {items.map(([title, total], i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900 truncate pr-3">{title}</p>
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5">{total}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Belum ada data populer.</p>
                );
              })()}
            </div>
          </div>

          {/* Upcoming + Certificates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-gray-900">Event Mendatang</p>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {upcomingEvents.map((ev, idx) => (
                    <div key={ev.id || idx} className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition bg-white">
                      <p className="font-medium text-gray-900 line-clamp-2">{ev.title}</p>
                      <div className="text-xs text-gray-600 flex items-center gap-2 mt-1"><Calendar className="w-4 h-4 text-blue-600" />{new Date(ev.event_date).toLocaleDateString('id-ID')}</div>
                      <div className="text-xs text-gray-600 flex items-center gap-2 mt-1"><MapPin className="w-4 h-4 text-blue-600" />{ev.location}</div>
                      <div className="pt-3"><Link to={`/events/${ev.id}`}><Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Detail</Button></Link></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Belum ada event mendatang.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-600" />
                <p className="font-semibold text-gray-900">Sertifikat Saya</p>
              </div>
              {localStorage.getItem('certificateEarned') ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="font-medium text-amber-800">Sertifikat Kehadiran</p>
                  <p className="text-amber-700 text-sm">Tersedia untuk diunduh</p>
                  <div className="pt-3"><Link to="/certificates"><Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white"><Download className="w-4 h-4 mr-2"/>Download</Button></Link></div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Belum ada sertifikat.</p>
              )}
            </div>
          </div>

          {/* Channels strip */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link to="/events" className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-800 text-center hover:shadow-sm">
                <p className="text-xs">Jelajahi Event</p>
              </Link>
              <Link to="/wishlist" className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-center hover:shadow-sm">
                <p className="text-xs">Wishlist</p>
              </Link>
              <Link to="/event-history" className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-center hover:shadow-sm">
                <p className="text-xs">Riwayat</p>
              </Link>
              <Link to="/certificates" className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-center hover:shadow-sm">
                <p className="text-xs">Sertifikat</p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
