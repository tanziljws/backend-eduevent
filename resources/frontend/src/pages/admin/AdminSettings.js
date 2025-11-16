import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

const AdminSettings = () => {
  // Call hook unconditionally, then safely read properties
  const auth = useAuth();
  const user = auth?.user;
  const setUser = auth?.setUser ?? (() => {});
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingApp, setSavingApp] = useState(false);
  const [notice, setNotice] = useState(null); // {type, message}

  const [profile, setProfile] = useState({
    name: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [app, setApp] = useState({
    school_name: 'SMKN 4 Bogor',
    brand_name: 'EduFest',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [p, s] = await Promise.all([
          adminService.getAdminProfile().catch(() => null),
          adminService.getAppSettings().catch(() => null),
        ]);
        if (p) setProfile({ name: p.name || '', email: p.email || '' });
        if (s) setApp({
          school_name: s.school_name ?? app.school_name,
          brand_name: s.brand_name ?? app.brand_name,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await adminService.updateAdminProfile(profile);
      if (setUser && res) setUser({ ...(user || {}), name: res.name, email: res.email });
      setNotice({ type: 'success', message: 'Profil berhasil diperbarui.' });
    } catch (e1) {
      setNotice({ type: 'error', message: e1?.response?.data?.message || 'Gagal memperbarui profil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      setSavingPassword(true);
      if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
        setNotice({ type: 'error', message: 'Konfirmasi password tidak cocok.' });
        return;
      }
      await adminService.changeAdminPassword(passwordForm);
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      setNotice({ type: 'success', message: 'Password berhasil diubah.' });
    } catch (e2) {
      setNotice({ type: 'error', message: e2?.response?.data?.message || 'Gagal mengubah password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const saveApp = async (e) => {
    e.preventDefault();
    try {
      setSavingApp(true);
      await adminService.updateAppSettings(app);
      setNotice({ type: 'success', message: 'Pengaturan aplikasi disimpan.' });
    } catch (e3) {
      setNotice({ type: 'error', message: e3?.response?.data?.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setSavingApp(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      <div className="flex-1">
        <div className="bg-white border-b px-4 sm:px-8 py-5">
          <h1 className="text-[22px] sm:text-2xl font-semibold text-gray-900 tracking-tight">Admin Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Kelola profil admin, kata sandi, dan identitas aplikasi.</p>
        </div>

        {notice && (
          <div className={`max-w-6xl mx-auto px-4 sm:px-8 mt-4`}>
            <div className={`${notice.type==='success' ? 'bg-green-50 border-green-200 text-green-800' : notice.type==='error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'} border rounded-lg px-4 py-3 text-sm`}>{notice.message}</div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Profil Admin</h2>
              <p className="text-sm text-gray-500 mb-4">Perbarui informasi akun administrator.</p>
              <form onSubmit={saveProfile} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700">Nama</label>
                  <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400" placeholder="Nama lengkap" value={profile.name} onChange={(e)=>setProfile({...profile,name:e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700">Email</label>
                  <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400" placeholder="email@sekolah.sch.id" value={profile.email} onChange={(e)=>setProfile({...profile,email:e.target.value})} />
                </div>
                <div className="flex justify-end">
                  <button disabled={savingProfile} className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            </div>

            {/* App Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Identitas Aplikasi</h2>
              <p className="text-sm text-gray-500 mb-4">Nama sekolah dan branding yang tampil pada antarmuka.</p>
              <form onSubmit={saveApp} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700">Nama Sekolah</label>
                  <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={app.school_name} onChange={(e)=>setApp({...app,school_name:e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700">Nama Aplikasi</label>
                  <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={app.brand_name} onChange={(e)=>setApp({...app,brand_name:e.target.value})} />
                </div>
                <div className="flex justify-end">
                  <button disabled={savingApp} className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {savingApp ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-6 lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Ubah Password</h2>
              <p className="text-sm text-gray-500 mb-4">Pastikan password baru kuat dan rahasia.</p>
              <form onSubmit={changePassword} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700">Password Saat Ini</label>
                  <input type="password" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={passwordForm.current_password} onChange={(e)=>setPasswordForm({...passwordForm,current_password:e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700">Password Baru</label>
                  <input type="password" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={passwordForm.new_password} onChange={(e)=>setPasswordForm({...passwordForm,new_password:e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700">Konfirmasi Password Baru</label>
                  <input type="password" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={passwordForm.new_password_confirmation} onChange={(e)=>setPasswordForm({...passwordForm,new_password_confirmation:e.target.value})} />
                </div>
                <div className="flex justify-end">
                  <button disabled={savingPassword} className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
