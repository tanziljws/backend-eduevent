import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { userService } from '../services/userService';
import { Search, Filter, Calendar, AlertCircle } from 'lucide-react';
import EventHistoryCard from './EventHistoryCard';

// Compact version of EventHistory to be embedded inside Profile page
export default function EmbeddedEventHistory() {
  const [events, setEvents] = useState([]);
  // const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchEvents = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await userService.getEventHistory();
      if (res?.success) {
        setEvents(res.data?.events || []);
        // setStatistics(res.data?.statistics || {});
      } else {
        setError(res?.message || 'Gagal mengambil riwayat event');
      }
    } catch (e) {
      setError('Terjadi kesalahan saat mengambil data riwayat event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const title = (event?.event?.title || '').toLowerCase();
      const description = (event?.event?.description || '').toLowerCase();
      const locationStr = (event?.event?.location || '').toLowerCase();
      const q = (searchTerm || '').toLowerCase();
      const matchesSearch = q === '' || title.includes(q) || description.includes(q) || locationStr.includes(q);
      
      // Custom filter logic
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
    { value: 'completed', label: 'Selesai', count: events.filter(e => e.certificate?.available === true).length },
    { value: 'attended', label: 'Hadir', count: events.filter(e => e.attendance?.is_present === true).length },
    { value: 'upcoming', label: 'Akan Datang', count: events.filter(e => e.overall_status === 'upcoming').length },
    { value: 'missed', label: 'Terlewat', count: events.filter(e => e.overall_status === 'missed').length }
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="bg-white/90 border-gray-200 shadow-sm rounded-lg">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Cari event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-[13px] bg-gray-50 border-gray-300"
              />
              {searchTerm && (
                <button aria-label="Clear" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">×</button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((option) => (
                <Button key={option.value} size="sm" onClick={() => setFilterStatus(option.value)} className={`${filterStatus===option.value?'bg-blue-600 text-white hover:bg-blue-700':'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  <Filter className="w-3 h-3 mr-1" /> {option.label} ({option.count})
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">Memuat riwayat...</div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((eventData) => (
            <EventHistoryCard 
              key={eventData.registration_id || eventData.event?.id} 
              eventData={eventData}
              onRefresh={fetchEvents}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-gray-700">Tidak ada event yang sesuai filter</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
