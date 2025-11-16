import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  X,
  Upload,
  Save,
  Menu
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    button_text: '',
    button_link: '',
    order: 0,
    is_active: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBanners();
      if (response.success) {
        // Sort banners by order field (ascending) as a safety measure
        // Backend should already sort them, but this ensures correct order on frontend
        const sortedBanners = [...(response.data || [])].sort((a, b) => {
          const orderA = a.order !== null && a.order !== undefined ? parseInt(a.order) : 999;
          const orderB = b.order !== null && b.order !== undefined ? parseInt(b.order) : 999;
          return orderA - orderB;
        });
        setBanners(sortedBanners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      alert('Gagal memuat banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingBanner && !imageFile) {
      alert('Silakan pilih gambar');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      // Handle null/undefined values properly - convert to empty string instead of "null"
      // Also filter out the string "null" if it somehow exists
      const cleanValue = (val) => {
        if (!val || val === 'null' || val === null || val === undefined) return '';
        return String(val).trim();
      };
      data.append('title', cleanValue(formData.title));
      data.append('description', cleanValue(formData.description));
      data.append('button_text', cleanValue(formData.button_text));
      data.append('button_link', cleanValue(formData.button_link));
      // Ensure order is a valid integer
      const orderValue = formData.order !== null && formData.order !== undefined 
        ? parseInt(formData.order) 
        : 0;
      data.append('order', orderValue);
      data.append('is_active', formData.is_active ? '1' : '0');
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      let response;
      if (editingBanner) {
        response = await adminService.updateBanner(editingBanner.id, data);
      } else {
        response = await adminService.createBanner(data);
      }

      if (response.success) {
        alert(editingBanner ? 'Banner berhasil diupdate!' : 'Banner berhasil ditambahkan!');
        closeModal();
        fetchBanners();
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Gagal menyimpan banner: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      // Convert null/undefined to empty string to prevent "null" string from being displayed
      title: banner.title && banner.title !== 'null' ? banner.title : '',
      description: banner.description && banner.description !== 'null' ? banner.description : '',
      button_text: banner.button_text && banner.button_text !== 'null' ? banner.button_text : '',
      button_link: banner.button_link && banner.button_link !== 'null' ? banner.button_link : '',
      order: banner.order !== null && banner.order !== undefined ? parseInt(banner.order) : 0,
      is_active: banner.is_active !== undefined ? banner.is_active : true
    });
    setImagePreview(banner.image_url);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus banner ini?')) return;

    try {
      const response = await adminService.deleteBanner(id);
      if (response.success) {
        alert('Banner berhasil dihapus!');
        fetchBanners();
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Gagal menghapus banner');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const response = await adminService.toggleBanner(id);
      if (response.success) {
        fetchBanners();
      }
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('Gagal mengubah status banner');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      button_text: '',
      button_link: '',
      order: 0,
      is_active: true
    });
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        className={`${mobileOpen ? 'block' : 'hidden'} md:block fixed md:relative z-30`}
        onNavigate={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Hero Banners</h1>
                <p className="text-sm text-gray-600">Kelola banner carousel di homepage</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tambah Banner
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat banners...</p>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum ada banner</h3>
              <p className="text-gray-600 mb-6">Tambahkan banner pertama untuk homepage</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Tambah Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {banners.map((banner) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Banner Image */}
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={() => handleToggleActive(banner.id)}
                        className={`p-2 rounded-lg ${
                          banner.is_active
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                        title={banner.is_active ? 'Aktif' : 'Nonaktif'}
                      >
                        {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Banner Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {banner.title || '(Tanpa Judul)'}
                        </h3>
                        {banner.description && (
                          <p className="text-sm text-gray-600">{banner.description}</p>
                        )}
                      </div>
                      <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        Order: {banner.order}
                      </span>
                    </div>

                    {banner.button_text && (
                      <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-600">Button:</span>{' '}
                        <span className="font-medium">{banner.button_text}</span>
                        {banner.button_link && (
                          <span className="text-gray-500 ml-2">→ {banner.button_link}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gambar Banner *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Klik untuk upload atau drag & drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="banner-image"
                    />
                    <label
                      htmlFor="banner-image"
                      className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      {imagePreview ? 'Ganti Gambar' : 'Pilih Gambar'}
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Seni & Budaya Fair (opsional)"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Deskripsi singkat banner"
                    rows="3"
                  />
                </div>

                {/* Button Text & Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Tombol
                    </label>
                    <input
                      type="text"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Lihat Event"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Tombol
                    </label>
                    <input
                      type="text"
                      value={formData.button_link}
                      onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="/events"
                    />
                  </div>
                </div>

                {/* Order & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urutan
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <label className="flex items-center gap-3 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Aktif</span>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingBanner ? 'Update Banner' : 'Simpan Banner'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBanners;
