import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import EventHistoryCard from '../components/EventHistoryCard';
import EventStatistics from '../components/EventStatistics';
import { 
  Search, 
  Filter, 
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

function EventHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  
  const [events, setEvents] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEventHistory();
  }, [user, navigate]);

  // Initialize state from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const q = params.get('q');
    if (status && ['all','completed','attended','upcoming','missed'].includes(status)) setFilterStatus(status);
    if (q) setSearchTerm(q);
  }, [location.search]);

  // Sync state to URL for shareable/persistent filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (searchTerm) params.set('q', searchTerm);
    navigate({ pathname: '/event-history', search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  }, [filterStatus, searchTerm, navigate]);

  const fetchEventHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userService.getEventHistory();
      
      if (response.success) {
        setEvents(response.data.events || []);
        setStatistics(response.data.statistics || {});
      } else {
        setError(response.message || 'Gagal mengambil riwayat event');
      }
    } catch (error) {
      console.error('Error fetching event history:', error);
      setError('Terjadi kesalahan saat mengambil data riwayat event');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEventHistory();
    setRefreshing(false);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Safeguard against missing fields and broaden search coverage
      const title = (event?.event?.title || '').toLowerCase();
      const description = (event?.event?.description || '').toLowerCase();
      const locationStr = (event?.event?.location || '').toLowerCase();
      const q = (searchTerm || '').toLowerCase();

      const matchesSearch = q === '' || title.includes(q) || description.includes(q) || locationStr.includes(q);
      
      // Custom filter logic for each status
      let matchesFilter = false;
      if (filterStatus === 'all') {
        matchesFilter = true;
      } else if (filterStatus === 'completed') {
        matchesFilter = event.certificate?.available === true;
      } else if (filterStatus === 'attended') {
        matchesFilter = event.attendance?.is_present === true;
      } else {
        matchesFilter = event.overall_status === filterStatus;
      }

      return matchesSearch && matchesFilter;
    });
  }, [events, searchTerm, filterStatus]);

  const filterOptions = [
    { value: 'all', label: 'Semua Status', count: events.length },
    { 
      value: 'completed', 
      label: 'Selesai', 
      count: events.filter(e => e.certificate?.available === true).length 
    },
    { 
      value: 'attended', 
      label: 'Hadir', 
      count: events.filter(e => e.attendance?.is_present === true).length 
    },
    { value: 'upcoming', label: 'Akan Datang', count: events.filter(e => e.overall_status === 'upcoming').length },
    { value: 'missed', label: 'Terlewat', count: events.filter(e => e.overall_status === 'missed').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat riwayat event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-4">

        {/* Tabs + Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
            <CardContent className="p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Cari event berdasarkan nama atau deskripsi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setSearchTerm(''); }}
                      className="pl-10 h-9 rounded-lg bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {searchTerm && (
                      <button
                        aria-label="Clear search"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                {/* Filter */}
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      onClick={() => setFilterStatus(option.value)}
                      className={`bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-full h-9 px-3 ${filterStatus===option.value ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                      aria-pressed={filterStatus===option.value}
                    >
                      <span className="flex items-center">
                        <Filter className="w-3.5 h-3.5 mr-1" />
                        <span>{option.label}</span>
                      </span>
                      <span className={`ml-1 inline-flex items-center justify-center min-w-[22px] h-[18px] text-[11px] rounded-full ${filterStatus===option.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'} px-1.5`}>{option.count}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5"
          >
            {filteredEvents.map((eventData, index) => (
              <motion.div
                key={eventData.registration_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <EventHistoryCard eventData={eventData} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white border border-gray-100 rounded-xl">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Tidak ada event yang sesuai filter' 
                    : 'Belum ada riwayat event'
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Coba ubah kata kunci pencarian atau filter status'
                    : 'Mulai daftar event untuk melihat riwayat di sini'
                  }
                </p>
                <Button
                  onClick={() => navigate('/events')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Jelajahi Event
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default EventHistory;
