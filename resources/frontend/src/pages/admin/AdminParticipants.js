import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { 
  Search, 
  Filter, 
  Download,
  Users,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Menu
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminParticipants = () => {
  const [participants, setParticipants] = useState([]);
  const [statistics, setStatistics] = useState({
    total_participants: 0,
    confirmed: 0,
    pending: 0,
    attended: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      
      // Fetch participants data
      const participantsResponse = await fetch('http://localhost:8000/api/admin/participants');
      const participantsData = await participantsResponse.json();
      
      // Fetch statistics
      const statsResponse = await fetch('http://localhost:8000/api/admin/participants/statistics');
      const statsData = await statsResponse.json();
      
      console.log('Participants data:', participantsData);
      console.log('Statistics data:', statsData);
      
      setParticipants(participantsData.data || []);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportParticipants = async () => {
    try {
      await adminService.exportData('registrations', 'csv');
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengekspor data peserta. Silakan coba lagi.');
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'confirmed', label: 'Dikonfirmasi' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'attended', label: 'Hadir' },
    { value: 'cancelled', label: 'Dibatalkan' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Participants Management</h1>
                <p className="text-gray-600 text-sm sm:text-base">Kelola peserta kegiatan SMKN 4 Bogor</p>
              </div>
            </div>
            
            <button 
              onClick={handleExportParticipants}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari peserta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Export button on mobile */}
            <button 
              onClick={handleExportParticipants}
              className="sm:hidden inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Peserta</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.total_participants}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dikonfirmasi</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.confirmed}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Menunggu</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hadir</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.attended}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Participants Mobile Cards (sm only) */}
          <div className="sm:hidden space-y-3">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="animate-pulse space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : participants.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <div className="text-gray-700 font-medium">Belum Ada Data Peserta</div>
                <div className="text-gray-500 text-sm">Data akan muncul setelah ada pendaftaran</div>
              </div>
            ) : (
              participants.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">{p.user_name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{p.user_email}</div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                      {getStatusIcon(p.status)}
                      <span className="ml-1 capitalize">{p.status}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-600">
                      <div className="font-medium text-gray-800 line-clamp-1">{p.event_title}</div>
                      <div>{new Date(p.event_date).toLocaleDateString('id-ID')}</div>
                    </div>
                    <div>
                      {p.attendance_status ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${p.attendance_status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {p.attendance_status === 'present' ? 'Hadir' : 'Tidak Hadir'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Participants Table (desktop and tablet) */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-24 h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Data Peserta</h3>
                <p className="text-gray-600 mb-6">
                  Data peserta akan muncul setelah ada pendaftaran event
                </p>
                <div className="text-sm text-gray-500">
                  <p>Untuk melihat data peserta:</p>
                  <p>1. Pastikan ada event yang sudah dipublish</p>
                  <p>2. Tunggu peserta mendaftar ke event</p>
                  <p>3. Data akan muncul di halaman ini</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peserta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{participant.user_name}</div>
                            <div className="text-sm text-gray-500">{participant.user_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{participant.event_title}</div>
                          <div className="text-sm text-gray-500">{new Date(participant.event_date).toLocaleDateString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(participant.registration_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(participant.status)}`}>
                            {getStatusIcon(participant.status)}
                            <span className="ml-1 capitalize">{participant.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {participant.attendance_status ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              participant.attendance_status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {participant.attendance_status === 'present' ? 'Hadir' : 'Tidak Hadir'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminParticipants;
