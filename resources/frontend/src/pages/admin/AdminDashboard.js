import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import StatCard from '../../components/admin/StatCard';
import BarChart from '../../components/admin/BarChart';
import { 
  Calendar, 
  Users, 
  Award, 
  TrendingUp, 
  Download,
  Clock,
  CheckCircle,
  Menu,
  DollarSign
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exportingType, setExportingType] = useState(null);

  // Format currency dengan titik pemisah ribuan yang jelas
  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data for year:', selectedYear);
      const data = await adminService.getDashboardData(selectedYear);
      console.log('Dashboard data received:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format = 'csv') => {
    try {
      setExportingType(type);
      const res = await adminService.exportData(type, format);
      if (res && res.fallback) return;
    } catch (error) {
      console.error('Export error:', error);
      const directUrl = `/api/admin/export?type=${type}&format=${format}`;
      try {
        window.open(directUrl, '_blank');
        return;
      } catch (_) {
        alert('Gagal mengekspor data. Silakan coba lagi.');
      }
    } finally {
      setExportingType(null);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Static sidebar on desktop */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div 
          className="fixed inset-0 z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div 
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <motion.div
            className="relative h-full"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <AdminSidebar 
              className="h-full"
              onNavigate={() => setMobileOpen(false)}
            />
          </motion.div>
        </motion.div>
      )}

      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome back, Admin!</h1>
                <p className="text-gray-600 text-sm sm:text-base">Kelola dan pantau kegiatan SMKN 4 Bogor dengan mudah.</p>
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

        {/* Main Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Events"
              value={dashboardData?.statistics?.total_events || 0}
              icon={Calendar}
              color="blue"
              isLoading={loading}
            />
            
            <StatCard
              title="Total Registrations"
              value={dashboardData?.statistics?.total_registrations || 0}
              icon={Users}
              color="green"
              isLoading={loading}
            />
            
            <StatCard
              title="Total Attendees"
              value={dashboardData?.statistics?.total_attendees || 0}
              icon={CheckCircle}
              color="yellow"
              isLoading={loading}
            />
            
            <StatCard
              title="Attendance Rate"
              value={`${dashboardData?.statistics?.attendance_rate || 0}%`}
              icon={TrendingUp}
              color="purple"
              isLoading={loading}
            />
          </div>

          {/* Revenue Cards - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <StatCard
              title="Total Pendapatan"
              value={formatCurrency(dashboardData?.statistics?.total_revenue)}
              icon={DollarSign}
              color="emerald"
              isLoading={loading}
              compact={true}
            />
            
            <StatCard
              title="Pendapatan Admin"
              value={formatCurrency(dashboardData?.statistics?.admin_revenue)}
              icon={DollarSign}
              color="blue"
              isLoading={loading}
              compact={true}
            />
            
            <StatCard
              title="Pendapatan Panitia"
              value={formatCurrency(dashboardData?.statistics?.panitia_revenue)}
              icon={DollarSign}
              color="orange"
              isLoading={loading}
              compact={true}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Events Chart */}
            <BarChart
              data={dashboardData?.monthly_events || []}
              title={`Kegiatan per Bulan ${selectedYear}`}
              color="blue"
              height={220}
              isLoading={loading}
            />
            
            {/* Monthly Attendees Chart */}
            <BarChart
              data={dashboardData?.monthly_attendees || []}
              title={`Peserta Hadir per Bulan ${selectedYear}`}
              color="green"
              height={220}
              minYMax={25}
              isLoading={loading}
              useMultipleOf50={true}
            />
          </div>

          {/* Top Events and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 10 Events */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Top 10 Events dengan Peserta Terbanyak</h3>
                
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
                    {dashboardData?.top_events?.slice(0, 10).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.08 }}
                        whileHover={{ y: -2 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.25, delay: 0.1 + index * 0.04 }}
                            className="font-bold text-gray-800"
                          >
                            {event.participants_count}
                          </motion.div>
                          <div className="text-sm text-gray-600">peserta</div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {(!dashboardData?.top_events || dashboardData.top_events.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        Belum ada data event
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              {/* Weekly Plan */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Weekly Plan</h3>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="text-2xl font-bold text-green-600">60%</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Review events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Process registrations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Generate reports</span>
                  </div>
                </div>
              </div>

              {/* Export Reports */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Reports</h3>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport('events')}
                    disabled={exportingType === 'events'}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-60"
                  >
                    <motion.span
                      animate={exportingType === 'events' ? { rotate: 360 } : { rotate: 0 }}
                      transition={exportingType === 'events' ? { repeat: Infinity, ease: 'linear', duration: 1 } : { duration: 0 }}
                      className="inline-flex"
                    >
                      <Download className="w-4 h-4" />
                    </motion.span>
                    <span className="font-medium">Export Events</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport('registrations')}
                    disabled={exportingType === 'registrations'}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-60"
                  >
                    <motion.span
                      animate={exportingType === 'registrations' ? { rotate: 360 } : { rotate: 0 }}
                      transition={exportingType === 'registrations' ? { repeat: Infinity, ease: 'linear', duration: 1 } : { duration: 0 }}
                      className="inline-flex"
                    >
                      <Download className="w-4 h-4" />
                    </motion.span>
                    <span className="font-medium">Export Registrations</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport('attendances')}
                    disabled={exportingType === 'attendances'}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-60"
                  >
                    <motion.span
                      animate={exportingType === 'attendances' ? { rotate: 360 } : { rotate: 0 }}
                      transition={exportingType === 'attendances' ? { repeat: Infinity, ease: 'linear', duration: 1 } : { duration: 0 }}
                      className="inline-flex"
                    >
                      <Download className="w-4 h-4" />
                    </motion.span>
                    <span className="font-medium">Export Attendances</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
