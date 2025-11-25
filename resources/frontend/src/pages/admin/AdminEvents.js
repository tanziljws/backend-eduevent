  import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  MapPin,
  Users,
  Download,
  MoreVertical,
  Menu
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { adminService } from '../../services/adminService';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success'|'info'|'error', message: string }
  const [exportingEventId, setExportingEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    category: 'teknologi',
    is_published: true,
    is_free: true,
    price: 0,
    max_participants: null,
    organizer: '',
    flyer_path: null,
    certificate_template_path: null,
  });
  const [flyerFile, setFlyerFile] = useState(null);
  const [flyerPreview, setFlyerPreview] = useState(null);
  const [certificateTemplateFile, setCertificateTemplateFile] = useState(null);
  const [certificateTemplatePreview, setCertificateTemplatePreview] = useState(null);
  const [isCapacityLimited, setIsCapacityLimited] = useState(false);

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.06 } },
  };
  const headerVariants = {
    hidden: { y: -12, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.35 } },
  };
  const sectionVariants = {
    hidden: { y: 8, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.35 } },
  };
  const modalBackdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };
  const modalPanel = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 240, damping: 22 } },
    exit: { y: 12, opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
  };

  const categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'teknologi', label: 'Teknologi' },
    { value: 'seni_budaya', label: 'Seni & Budaya' },
    { value: 'olahraga', label: 'Olahraga' },
    { value: 'akademik', label: 'Akademik' },
    { value: 'sosial', label: 'Sosial' }
  ];

  // Helper: format rupiah untuk tampilan harga
  const formatRupiah = (n) => {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Number(n || 0));
    } catch {
      return `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm, selectedCategory]);

  // Auto-hide notice
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Reset form when create modal opens
  useEffect(() => {
    if (showCreate) {
      setFormData({
        title: '',
        description: '',
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
        category: 'teknologi',
        is_published: true,
        is_free: true,
        price: 0,
        flyer_path: null,
        certificate_template_path: null,
      });
      setFlyerFile(null);
      setFlyerPreview(null);
      setCertificateTemplateFile(null);
      setCertificateTemplatePreview(null);
      setFormErrors({});
    }
  }, [showCreate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        q: searchTerm,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        admin: true // Get all events including unpublished for admin
      };
      console.log('Fetching admin events with params:', params);
      const response = await eventService.getEvents(params);
      console.log('Admin events response:', response);
      setEvents(response.data || []);
      setTotalPages(response.last_page || 1);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Form handlers (must be at component scope, not inside fetchEvents)
  const validateForm = (isEdit = false) => {
    const errs = {};
    if (!formData.title?.trim()) errs.title = 'Judul wajib diisi';
    if (!formData.event_date) {
      errs.event_date = 'Tanggal event wajib diisi';
    } else if (!isEdit) {
      // Validasi H-3: Hanya berlaku untuk CREATE event, tidak untuk EDIT
      // Saat edit, admin bisa mengubah detail lain tanpa harus mengubah tanggal
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(formData.event_date + 'T00:00:00');
      const diffTime = eventDate - today;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // H-3 berarti minimal 3 hari dari hari ini
      // Hari ini: 06/11, H-3: 09/11 (diffDays = 3) → VALID
      // Hari ini: 06/11, H-2: 08/11 (diffDays = 2) → INVALID
      if (diffDays < 3) {
        const minDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        errs.event_date = `Event harus dibuat minimal H-3 (3 hari dari hari ini). Minimal tanggal: ${minDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      }
    }
    if (!formData.start_time) errs.start_time = 'Waktu mulai wajib diisi';
    if (!formData.location?.trim()) errs.location = 'Lokasi wajib diisi';
    if (!formData.category) errs.category = 'Kategori wajib dipilih';
    if (formData.is_free === false) {
      const p = Number(formData.price);
      if (!p || p < 1000) errs.price = 'Harga wajib diisi minimal Rp1.000 untuk event berbayar';
    }
    if (!formData.organizer?.trim()) errs.organizer = 'Penyelenggara event wajib diisi';
    if (isCapacityLimited && (!formData.max_participants || formData.max_participants < 1)) {
      errs.max_participants = 'Kapasitas peserta wajib diisi minimal 1 orang';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files?.[0] || null }));
  };

  const handleFlyerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFlyerFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFlyerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFlyerPreview = () => {
    setFlyerFile(null);
    setFlyerPreview(null);
  };

  const handleCertificateTemplateChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertificateTemplateFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertificateTemplatePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCertificateTemplatePreview = () => {
    setCertificateTemplateFile(null);
    setCertificateTemplatePreview(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return; // false = create event, validasi H-3 berlaku
    try {
      setSubmitting(true);
      
      // Prepare data with files
      const submitData = { ...formData };
      if (flyerFile) {
        submitData.flyer_path = flyerFile;
      }
      if (certificateTemplateFile) {
        submitData.certificate_template_path = certificateTemplateFile;
      }
      
      await adminService.createEvent(submitData);
      setShowCreate(false);
      // reset form minimal
      setFormData(prev => ({
        ...prev,
        title: '', description: '', event_date: '', start_time: '', end_time: '', location: '', flyer_path: null, certificate_template_path: null,
      }));
      setFlyerFile(null);
      setFlyerPreview(null);
      setCertificateTemplateFile(null);
      setCertificateTemplatePreview(null);
      await fetchEvents();
    } catch (error) {
      console.error('Create event error:', error);
      const msg = error?.response?.data?.message || 'Gagal membuat event. Pastikan memenuhi aturan H-3 dan field wajib.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    // Reset form data
    setFormData({
      title: '',
      description: '',
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      category: 'teknologi',
      is_published: true,
      is_free: true,
      price: 0,
      max_participants: null,
      organizer: '',
      flyer_path: null,
      certificate_template_path: null,
    });
    setIsCapacityLimited(false);
    setFlyerFile(null);
    setFlyerPreview(null);
    setCertificateTemplateFile(null);
    setCertificateTemplatePreview(null);
    setFormErrors({});
    setShowCreate(true);
  };

  const openEditModal = (ev) => {
    setEditingEventId(ev.id);
    setFormData({
      title: ev.title || '',
      description: ev.description || '',
      event_date: ev.event_date ? ev.event_date.slice(0, 10) : '',
      start_time: ev.start_time || '',
      end_time: ev.end_time || '',
      location: ev.location || '',
      category: ev.category || 'teknologi',
      is_published: !!ev.is_published,
      is_free: ev.is_free !== undefined ? !!ev.is_free : true,
      price: ev.price ?? 0,
      max_participants: ev.max_participants || null,
      organizer: ev.organizer || '',
      flyer_path: ev.flyer_path || null,
      certificate_template_path: null,
    });
    
    // Set capacity limited state
    setIsCapacityLimited(!!ev.max_participants);
    
    // Set existing flyer preview if exists
    if (ev.flyer_url) {
      setFlyerPreview(ev.flyer_url);
    } else {
      setFlyerPreview(null);
    }
    setFlyerFile(null);
    
    // Set existing certificate template preview if exists
    if (ev.certificate_template_url) {
      setCertificateTemplatePreview(ev.certificate_template_url);
    } else {
      setCertificateTemplatePreview(null);
    }
    setCertificateTemplateFile(null);
    
    setFormErrors({});
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔵 handleEditSubmit called', { editingEventId, formData });
    
    // Validate form
    const isValid = validateForm(true); // true = edit event, validasi H-3 tidak berlaku
    console.log('🔵 Form validation result:', isValid, 'Errors:', formErrors);
    
    if (!isValid) {
      console.log('❌ Form validation failed:', formErrors);
      setNotice({ 
        type: 'error', 
        message: 'Mohon lengkapi semua field yang wajib diisi.' 
      });
      return;
    }
    
    try {
      setSubmitting(true);
      setFormErrors({});
      
      // Always use the object format, adminService will handle FormData conversion
      const submitData = { ...formData };
      
      // Handle max_participants: if not limited, set to null
      if (!isCapacityLimited) {
        submitData.max_participants = null;
      } else if (submitData.max_participants === '' || submitData.max_participants === undefined) {
        submitData.max_participants = null;
      }
      
      // Add flyer file if exists
      if (flyerFile) {
        submitData.flyer_path = flyerFile;
      } else {
        // Don't send flyer_path if no new file (keep existing)
        delete submitData.flyer_path;
      }
      
      // Add certificate template file if exists
      if (certificateTemplateFile) {
        submitData.certificate_template_path = certificateTemplateFile;
      } else {
        // Don't send certificate_template_path if no new file (keep existing)
        delete submitData.certificate_template_path;
      }
      
      console.log('Updating event:', editingEventId, submitData);
      const response = await adminService.updateEvent(editingEventId, submitData);
      console.log('Update event response:', response);
      
      // Show success message
      setNotice({ 
        type: 'success', 
        message: response?.message || 'Event berhasil diperbarui.' 
      });
      
      // Close modal and reset
      setShowEdit(false);
      setEditingEventId(null);
      setFlyerFile(null);
      setFlyerPreview(null);
      setCertificateTemplateFile(null);
      setCertificateTemplatePreview(null);
      setFormErrors({});
      
      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error('Update event error:', error);
      console.error('Error response:', error?.response);
      
      // Handle validation errors
      if (error?.response?.status === 422 && error?.response?.data?.errors) {
        const validationErrors = {};
        Object.keys(error.response.data.errors).forEach(key => {
          validationErrors[key] = error.response.data.errors[key][0];
        });
        setFormErrors(validationErrors);
        setNotice({ 
          type: 'error', 
          message: error?.response?.data?.message || 'Data tidak valid. Silakan periksa form.' 
        });
      } else {
        // Handle other errors
        const msg = error?.response?.data?.message || error?.message || 'Gagal memperbarui event.';
        setNotice({ type: 'error', message: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    const ok = window.confirm('Yakin ingin menghapus event ini?');
    if (!ok) return;
    try {
      const response = await adminService.deleteEvent(eventId);
      await fetchEvents();
      
      // Check if it was soft delete or hard delete
      if (response.soft_delete) {
        setNotice({ 
          type: 'info', 
          message: response.message || 'Event tidak dapat dihapus karena sudah ada peserta terdaftar. Event telah disembunyikan dari publik.' 
        });
      } else {
        setNotice({ 
          type: 'success', 
          message: response.message || 'Event berhasil dihapus permanen.' 
        });
      }
    } catch (error) {
      console.error('Delete event error:', error);
      const errorMsg = error?.response?.data?.message || 'Gagal menghapus event.';
      setNotice({ type: 'error', message: errorMsg });
    }
  };

  const handleView = (eventId) => {
    // Buka halaman detail publik
    const url = `/events/${eventId}`;
    try {
      window.open(url, '_blank');
    } catch {
      // fallback navigate same tab
      window.location.href = url;
    }
  };

  const handleExportParticipants = async (eventId) => {
    try {
      setExportingEventId(eventId);
      await adminService.exportEventParticipants(eventId, 'csv');
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error.message || 'Gagal mengekspor data peserta. Silakan coba lagi.';
      alert(errorMessage);
      
      // If authentication error, redirect to login
      if (error.message && (error.message.includes('login') || error.message.includes('sesi'))) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setExportingEventId(null);
    }
  };

  const handlePublishToggle = async (eventId, currentStatus) => {
    try {
      await adminService.publishEvent(eventId, !currentStatus);
      fetchEvents(); // Refresh data
    } catch (error) {
      console.error('Publish toggle error:', error);
      alert('Gagal mengubah status publikasi event.');
    }
  };

  // Remove client-side filtering since we're already filtering on server
  const filteredEvents = events;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Static sidebar on desktop */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className="fixed inset-0 z-50 md:hidden"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <motion.div
              className="relative h-full"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <AdminSidebar className="h-full" onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="flex-1 overflow-hidden" variants={pageVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4" variants={headerVariants}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Event Management</h1>
                <p className="text-gray-600 text-sm sm:text-base">Kelola semua kegiatan SMKN 4 Bogor</p>
              </div>
            </div>
            
            <motion.button whileHover={{ y: -1, boxShadow: '0 6px 20px rgba(37, 99, 235, 0.25)' }} whileTap={{ scale: 0.98 }} onClick={openCreateModal} className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Tambah Event
            </motion.button>
          </div>
        </motion.div>

        {/* Notice Banner */}
        <AnimatePresence>
          {notice && (
            <motion.div
              className={`${notice.type==='success' ? 'bg-green-50 border-green-200 text-green-800' : notice.type==='info' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-800'} border rounded-lg mx-4 sm:mx-6 mt-3 px-4 py-3 flex items-start justify-between gap-3`}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
            >
              <span className="text-sm">{notice.message}</span>
              <button onClick={() => setNotice(null)} className="text-sm opacity-60 hover:opacity-100">Tutup</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4" variants={sectionVariants}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            {/* Add button on mobile */}
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={openCreateModal} className="sm:hidden inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Tambah
            </motion.button>
          </div>
        </motion.div>

        {/* Events Table */}
        <div className="p-6">
          {/* Create Modal */}
          <AnimatePresence>
            {showCreate && (
              <motion.div className="fixed inset-0 z-50 flex items-center justify-center" variants={modalBackdrop} initial="hidden" animate="visible" exit="exit">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
                <motion.div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl" variants={modalPanel}>
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Tambah Event</h3>
                    <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>
                  <form onSubmit={handleCreateSubmit} className="flex flex-col max-h-[75vh]">
                  <div className="px-6 py-4 space-y-6 overflow-auto">
                  {/* Section: Informasi Dasar */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Informasi Dasar</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Judul <span className="text-red-500">*</span></label>
                        <input name="title" placeholder="Contoh: Workshop Desain Grafis" value={formData.title} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                        {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                        <textarea name="description" placeholder="Ringkasan singkat mengenai kegiatan..." value={formData.description} onChange={handleInputChange} rows={4} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Waktu & Lokasi */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Waktu & Lokasi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal <span className="text-red-500">*</span></label>
                        <input 
                          type="date" 
                          name="event_date" 
                          value={formData.event_date} 
                          onChange={handleInputChange} 
                          min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                        />
                        {formErrors.event_date && <p className="text-xs text-red-600 mt-1">{formErrors.event_date}</p>}
                        <p className="text-[11px] text-gray-500 mt-1">Aturan H-3 (minimal 3 hari dari hari ini) hanya berlaku untuk event baru.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mulai <span className="text-red-500">*</span></label>
                        <input type="time" name="start_time" value={formData.start_time} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                        {formErrors.start_time && <p className="text-xs text-red-600 mt-1">{formErrors.start_time}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Selesai (opsional)</label>
                        <input type="time" name="end_time" value={formData.end_time} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Lokasi <span className="text-red-500">*</span></label>
                        <input name="location" placeholder="Lokasi kegiatan" value={formData.location} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                        {formErrors.location && <p className="text-xs text-red-600 mt-1">{formErrors.location}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kategori <span className="text-red-500">*</span></label>
                        <select name="category" value={formData.category} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                          {categories.filter(c=>c.value!=='all').map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Section: Harga */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <label className="inline-flex items-center gap-3 md:col-span-1">
                        <input type="checkbox" name="is_free" checked={formData.is_free} onChange={handleInputChange} className="h-4 w-4" />
                        <span className="text-sm text-gray-700">Gratis</span>
                      </label>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Harga {formData.is_free ? '(nonaktif saat Gratis)' : <span className="text-red-500">*</span>}</label>
                        <input type="number" min={0} step={1000} name="price" value={formData.price} onChange={handleInputChange} disabled={formData.is_free} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                        {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
                        <p className="text-[11px] text-gray-500 mt-1">Gunakan format angka. Contoh: 25000 untuk Rp25.000</p>
                      </div>
                    </div>

                    {/* Section: Kapasitas Peserta */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kapasitas Peserta</label>
                      <div className="space-y-2">
                        <label className="inline-flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="capacity_type" 
                            checked={!isCapacityLimited} 
                            onChange={() => {
                              setIsCapacityLimited(false);
                              setFormData({...formData, max_participants: null});
                            }} 
                            className="h-4 w-4" 
                          />
                          <span className="text-sm text-gray-700">Tidak terbatas</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="capacity_type" 
                            checked={isCapacityLimited} 
                            onChange={() => setIsCapacityLimited(true)} 
                            className="h-4 w-4" 
                          />
                          <span className="text-sm text-gray-700">Terbatas</span>
                        </label>
                      </div>
                      {isCapacityLimited && (
                        <div className="mt-2">
                          <input 
                            type="number" 
                            min={1} 
                            name="max_participants" 
                            value={formData.max_participants || ''} 
                            onChange={handleInputChange} 
                            placeholder="Masukkan jumlah maksimal peserta"
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                          />
                          {formErrors.max_participants && <p className="text-xs text-red-600 mt-1">{formErrors.max_participants}</p>}
                          <p className="text-[11px] text-gray-500 mt-1">Contoh: 50 untuk maksimal 50 peserta</p>
                        </div>
                      )}
                    </div>

                    {/* Section: Penyelenggara Event */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Penyelenggara Event <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="organizer" 
                        value={formData.organizer} 
                        onChange={handleInputChange} 
                        placeholder="Nama organisasi atau instansi penyelenggara"
                        className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                      />
                      {formErrors.organizer && <p className="text-xs text-red-600 mt-1">{formErrors.organizer}</p>}
                      <p className="text-[11px] text-gray-500 mt-1">Contoh: PRABASWARA, OSIS SMKN 4 Bogor, dll.</p>
                    </div>
                  </div>

                  {/* Section: Lampiran */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Lampiran</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Flyer (opsional)</label>
                        <input type="file" name="flyer_path" accept="image/*" onChange={handleFlyerChange} className="mt-1 w-full" />
                        <p className="text-[11px] text-gray-500 mt-1">Format: JPG/PNG. Maks 2MB (disarankan).</p>
                        {flyerPreview && (
                          <div className="mt-2 relative inline-block">
                            <img src={flyerPreview} alt="Flyer Preview" className="w-32 h-32 object-cover rounded border" />
                            <button type="button" onClick={removeFlyerPreview} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Template Sertifikat (opsional)</label>
                        <input type="file" name="certificate_template" accept="image/*" onChange={handleCertificateTemplateChange} className="mt-1 w-full" />
                        <p className="text-[11px] text-gray-500 mt-1">Format: JPG/PNG. Maks 2MB.</p>
                        {certificateTemplatePreview && (
                          <div className="mt-2 relative inline-block">
                            <img src={certificateTemplatePreview} alt="Template Preview" className="w-32 h-32 object-cover rounded border" />
                            <button type="button" onClick={removeCertificateTemplatePreview} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  </div>
                  <div className="px-6 py-3 border-t bg-white flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-3">
                      <input id="is_published" type="checkbox" name="is_published" checked={formData.is_published} onChange={handleInputChange} className="h-4 w-4" />
                      <span className="text-sm text-gray-700">Publikasikan segera</span>
                    </label>
                    <div className="flex gap-3">
                      <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border">Batal</motion.button>
                      <motion.button type="submit" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                        {submitting ? 'Menyimpan...' : 'Simpan Event'}
                      </motion.button>
                    </div>
                  </div>
                  <p className="px-6 pb-4 text-xs text-gray-500">Catatan: Aturan H-3 (minimal 3 hari dari hari ini) hanya berlaku untuk event baru. Saat edit, Anda bisa mengubah detail event tanpa harus mengubah tanggal.</p>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Edit Modal */}
          <AnimatePresence>
            {showEdit && (
              <motion.div className="fixed inset-0 z-50 flex items-center justify-center" variants={modalBackdrop} initial="hidden" animate="visible" exit="exit">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowEdit(false)} />
                <motion.div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl" variants={modalPanel}>
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Edit Event</h3>
                    <button onClick={() => setShowEdit(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>
                  <form 
                    onSubmit={(e) => {
                      console.log('🔵 Form onSubmit triggered');
                      handleEditSubmit(e);
                    }} 
                    className="flex flex-col max-h-[75vh]"
                    noValidate
                  >
                  <div className="px-6 py-4 space-y-6 overflow-auto">
                  {/* Section: Informasi Dasar */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Informasi Dasar</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Judul <span className="text-red-500">*</span></label>
                        <input name="title" value={formData.title} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                        {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Waktu & Lokasi */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Waktu & Lokasi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal <span className="text-red-500">*</span></label>
                        <input type="date" name="event_date" value={formData.event_date} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                        {formErrors.event_date && <p className="text-xs text-red-600 mt-1">{formErrors.event_date}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mulai <span className="text-red-500">*</span></label>
                        <input type="time" name="start_time" value={formData.start_time} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                        {formErrors.start_time && <p className="text-xs text-red-600 mt-1">{formErrors.start_time}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Selesai (opsional)</label>
                        <input type="time" name="end_time" value={formData.end_time} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Lokasi <span className="text-red-500">*</span></label>
                        <input name="location" value={formData.location} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                        {formErrors.location && <p className="text-xs text-red-600 mt-1">{formErrors.location}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kategori <span className="text-red-500">*</span></label>
                        <select name="category" value={formData.category} onChange={handleInputChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                          {categories.filter(c=>c.value!=='all').map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Section: Harga (Edit) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <label className="inline-flex items-center gap-3 md:col-span-1">
                        <input type="checkbox" name="is_free" checked={formData.is_free} onChange={handleInputChange} className="h-4 w-4" />
                        <span className="text-sm text-gray-700">Gratis</span>
                      </label>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Harga {formData.is_free ? '(nonaktif saat Gratis)' : <span className="text-red-500">*</span>}</label>
                        <input type="number" min={0} step={1000} name="price" value={formData.price} onChange={handleInputChange} disabled={formData.is_free} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                        {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
                        <p className="text-[11px] text-gray-500 mt-1">Contoh: 25000 untuk {formatRupiah(25000)}</p>
                      </div>
                    </div>
 
                    {/* Section: Kapasitas Peserta (Edit) */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kapasitas Peserta</label>
                      <div className="space-y-2">
                        <label className="inline-flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="capacity_type" 
                            checked={!isCapacityLimited} 
                            onChange={() => {
                              setIsCapacityLimited(false);
                              setFormData({...formData, max_participants: null});
                            }} 
                            className="h-4 w-4" 
                          />
                          <span className="text-sm text-gray-700">Tidak terbatas</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="capacity_type" 
                            checked={isCapacityLimited} 
                            onChange={() => setIsCapacityLimited(true)} 
                            className="h-4 w-4" 
                          />
                          <span className="text-sm text-gray-700">Terbatas</span>
                        </label>
                      </div>
                      {isCapacityLimited && (
                        <div className="mt-2">
                          <input 
                            type="number" 
                            min={1} 
                            name="max_participants" 
                            value={formData.max_participants || ''} 
                            onChange={handleInputChange} 
                            placeholder="Masukkan jumlah maksimal peserta"
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                          />
                          {formErrors.max_participants && <p className="text-xs text-red-600 mt-1">{formErrors.max_participants}</p>}
                          <p className="text-[11px] text-gray-500 mt-1">Contoh: 50 untuk maksimal 50 peserta</p>
                        </div>
                      )}
                    </div>

                    {/* Section: Penyelenggara Event (Edit) */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Penyelenggara Event <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="organizer" 
                        value={formData.organizer} 
                        onChange={handleInputChange} 
                        placeholder="Nama organisasi atau instansi penyelenggara"
                        className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                      />
                      {formErrors.organizer && <p className="text-xs text-red-600 mt-1">{formErrors.organizer}</p>}
                      <p className="text-[11px] text-gray-500 mt-1">Contoh: PRABASWARA, OSIS SMKN 4 Bogor, dll.</p>
                    </div>
                  </div>

                  {/* Section: Foto Flyer & Template Sertifikat */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Foto Flyer */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Foto Flyer</h4>
                      <div className="space-y-3">
                        {flyerPreview && (
                          <div className="relative inline-block">
                            <img src={flyerPreview} alt="Flyer Preview" className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200" />
                            <button
                              type="button"
                              onClick={removeFlyerPreview}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {flyerPreview ? 'Ganti Foto Flyer' : 'Upload Foto Flyer'}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFlyerChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, GIF (Max 2MB)</p>
                        </div>
                      </div>
                    </div>

                    {/* Template Sertifikat */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Template Sertifikat</h4>
                      <div className="space-y-3">
                        {certificateTemplatePreview && (
                          <div className="relative inline-block">
                            <img src={certificateTemplatePreview} alt="Template Preview" className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200" />
                            <button
                              type="button"
                              onClick={removeCertificateTemplatePreview}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {certificateTemplatePreview ? 'Ganti Template Sertifikat' : 'Upload Template Sertifikat'}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCertificateTemplateChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG (Max 2MB)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  </div>
                  <div className="px-6 py-3 border-t bg-white flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-3">
                      <input id="is_published_edit" type="checkbox" name="is_published" checked={formData.is_published} onChange={handleInputChange} className="h-4 w-4" />
                      <span className="text-sm text-gray-700">Published</span>
                    </label>
                    <div className="flex gap-3">
                      <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-lg border">Batal</motion.button>
                      <motion.button 
                        type="submit" 
                        whileHover={{ y: -1 }} 
                        whileTap={{ scale: 0.98 }} 
                        disabled={submitting} 
                        onClick={(e) => {
                          console.log('🔵 Submit button clicked');
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </motion.button>
                    </div>
                  </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div className="bg-white rounded-xl border border-gray-200 overflow-hidden" variants={sectionVariants}>
            {loading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-24 h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-800">Event</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-800">Tanggal & Waktu</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-800">Lokasi</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-800">Kategori</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-800">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-800">Peserta</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-800">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEvents.map((event, index) => (
                      <motion.tr
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{event.title}</h3>
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {event.description || 'Tidak ada deskripsi'}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">
                              {new Date(event.event_date).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-gray-600">
                              {event.start_time} - {event.end_time || 'Selesai'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {categories.find(c => c.value === event.category)?.label || event.category}
                            </span>
                            {event.is_free ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Gratis</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                {formatRupiah(event.price)}
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePublishToggle(event.id, event.is_published)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              event.is_published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.is_published ? 'Published' : 'Draft'}
                          </motion.button>
                        </td>
                        
                        <td className="px-6 py-4">
                          <motion.div
                            className="flex items-center gap-2 text-sm text-gray-600"
                            whileHover={{ x: 2 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                          >
                            <Users className="w-4 h-4" />
                            <AnimatePresence mode="popLayout">
                              <motion.span
                                key={event.participants_count}
                                initial={{ y: 6, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -6, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="tabular-nums"
                              >
                                {event.participants_count || 0}
                              </motion.span>
                            </AnimatePresence>
                          </motion.div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => handleView(event.id)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => openEditModal(event)} className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleExportParticipants(event.id)}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors relative"
                              disabled={exportingEventId === event.id}
                            >
                              <motion.span
                                animate={exportingEventId === event.id ? { rotate: 360 } : { rotate: 0 }}
                                transition={exportingEventId === event.id ? { repeat: Infinity, ease: 'linear', duration: 1 } : { duration: 0 }}
                                className="inline-flex"
                              >
                                <Download className="w-4 h-4" />
                              </motion.span>
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => handleDelete(event.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredEvents.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Tidak ada event ditemukan</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div className="flex items-center justify-center gap-2 mt-6" variants={sectionVariants}>
              <motion.button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                whileHover={{ scale: currentPage === 1 ? 1 : 1.02 }}
                whileTap={{ scale: currentPage === 1 ? 1 : 0.98 }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </motion.button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <motion.button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                whileHover={{ scale: currentPage === totalPages ? 1 : 1.02 }}
                whileTap={{ scale: currentPage === totalPages ? 1 : 0.98 }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminEvents;
