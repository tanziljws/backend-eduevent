import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import BarChart from '../../components/admin/BarChart';
import { 
  Download, 
  Calendar, 
  Users, 
  TrendingUp,
  FileText,
  BarChart3,
  PieChart,
  Menu
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminReports = () => {
  const [monthlyEvents, setMonthlyEvents] = useState([]);
  const [monthlyAttendees, setMonthlyAttendees] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchReportsData();
  }, [selectedYear]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [eventsData, attendeesData, topEventsData] = await Promise.all([
        adminService.getMonthlyEvents(selectedYear),
        adminService.getMonthlyAttendees(selectedYear),
        adminService.getTopEvents()
      ]);

      setMonthlyEvents(eventsData);
      setMonthlyAttendees(attendeesData);

      // Normalize top events data to the shape expected by UI
      const normalizedTop = (topEventsData || []).map((row) => {
        // Cases:
        // 1) { id, title, event_date, participants_count }
        // 2) { event: { id, title, event_date }, participants }
        const id = row.id ?? row.event_id ?? row?.event?.id ?? Math.random();
        const title = row.title ?? row?.event?.title ?? 'Untitled';
        const event_date = row.event_date ?? row?.event?.event_date ?? null;
        const participants_count = row.participants_count ?? row.participants ?? row?.participants_count ?? 0;
        return { id, title, event_date, participants_count };
      });
      setTopEvents(normalizedTop);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format = 'csv') => {
    try {
      const res = await adminService.exportData(type, format);
      if (res && res.fallback) return; // already opened in new tab
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const totalEvents = monthlyEvents.reduce((sum, month) => sum + month.count, 0);
  const totalAttendees = monthlyAttendees.reduce((sum, month) => sum + month.count, 0);
  const averageAttendance = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Static sidebar on desktop */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <motion.div className="relative h-full" initial={{ x: -280 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <AdminSidebar className="h-full" onNavigate={() => setMobileOpen(false)} />
          </motion.div>
        </motion.div>
      )}

      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Reports & Analytics</h1>
                <p className="text-gray-600 text-sm sm:text-base">Laporan dan analisis kegiatan SMKN 4 Bogor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Events {selectedYear}</p>
                  <p className="text-3xl font-bold text-blue-600">{totalEvents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attendees {selectedYear}</p>
                  <p className="text-3xl font-bold text-green-600">{totalAttendees}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Attendance</p>
                  <p className="text-3xl font-bold text-purple-600">{averageAttendance}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BarChart
              data={monthlyEvents}
              title={`Events per Bulan ${selectedYear}`}
              color="blue"
              height={240}
              isLoading={loading}
            />
            
            <BarChart
              data={monthlyAttendees}
              title={`Kehadiran per Bulan ${selectedYear}`}
              color="green"
              height={240}
              minYMax={25}
              isLoading={loading}
            />
          </div>

          {/* Top Events and Export Options */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Events */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Top Events by Participants</h3>
                
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                        <div className="w-16 h-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topEvents.slice(0, 10).map((event, index) => (
                      <motion.div
                        key={`${event?.id ?? 'event'}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{event.title}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(event.event_date).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">{event.participants_count}</div>
                          <div className="text-sm text-gray-600">peserta</div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {topEvents.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Belum ada data event
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Reports</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleExport('events')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Events Report</span>
                  </button>
                  
                  <button
                    onClick={() => handleExport('registrations')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Registrations Report</span>
                  </button>
                  
                  <button
                    onClick={() => handleExport('attendances')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-medium">Attendance Report</span>
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bulan Terpopuler</span>
                    <span className="font-medium text-gray-800">
                      {monthlyEvents.length > 0 
                        ? monthlyEvents.reduce((max, month) => month.count > max.count ? month : max).month_name
                        : '-'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Event Terbesar</span>
                    <span className="font-medium text-gray-800">
                      {topEvents.length > 0 ? `${topEvents[0]?.participants_count || 0} peserta` : '-'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Events</span>
                    <span className="font-medium text-gray-800">{topEvents.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
