import React from 'react';
import ProfileSidebar from '../components/ProfileSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
// import { userService } from '../services/userService';
import { useLocation } from 'react-router-dom';
import EmbeddedEventHistory from '../components/EmbeddedEventHistory';
import EmbeddedWishlist from '../components/EmbeddedWishlist';
import ChangePassword from '../components/ChangePassword';

export default function Profile() {
  const { user } = useAuth();
  // const navigate = useNavigate();
  const location = useLocation();

  // const [recentEvents, setRecentEvents] = useState([]); // last 5
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   let mounted = true;
  //   async function load() {
  //     try {
  //       const res = await userService.getEventHistory();
  //       if (mounted && res?.success) {
  //         const list = Array.isArray(res.data?.events) ? res.data.events.slice(0, 5) : [];
  //         setRecentEvents(list);
  //       }
  //     } finally {
  //       if (mounted) setLoading(false);
  //     }
  //   }
  //   load();
  //   return () => { mounted = false; };
  // }, []);

  // const StatusBadge = ({ status }) => {
  //   const map = {
  //     completed: 'bg-green-100 text-green-700 border-green-200',
  //     attended: 'bg-blue-100 text-blue-700 border-blue-200',
  //     upcoming: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  //     missed: 'bg-red-100 text-red-700 border-red-200',
  //     cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  //   };
  //   const label = {
  //     completed: 'Selesai',
  //     attended: 'Hadir',
  //     upcoming: 'Akan Datang',
  //     missed: 'Terlewat',
  //     cancelled: 'Dibatalkan',
  //   }[status] || '—';
  //   return <span className={`text-xs px-2 py-1 rounded border ${map[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{label}</span>;
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-3">
          <ProfileSidebar />
        </div>

        {/* Content */}
        <div className="md:col-span-9 space-y-6">
          {/* Decide section based on query - default to transactions (Daftar Event) */}
          {(() => {
            const section = (new URLSearchParams(location.search)).get('section') || 'transactions';
            return section === 'settings' ? (
          <>
          {/* Account Settings Card */}
          <Card className="bg-white/90 border-gray-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Pengaturan Akun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <Input value={user?.name || ''} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input value={user?.email || ''} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Handphone</label>
                  <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500" placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                  <input type="date" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea rows={3} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500" placeholder="Masukkan alamat lengkap" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pendidikan Terakhir</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>Pilih pendidikan terakhir</option>
                    <option>SMA/SMK</option>
                    <option>D3</option>
                    <option>S1</option>
                    <option>S2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>Pilih jenis kelamin</option>
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Negara</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>Indonesia</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button variant="outline">Batal</Button>
                <Button disabled className="bg-blue-600 text-white" title="Coming soon">Simpan Perubahan</Button>
              </div>
            </CardContent>
          </Card>
          
          </>
          ) : section === 'wishlist' ? (
            <>
              <Card className="bg-white/90 border-gray-200 shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="text-gray-800">My Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmbeddedWishlist />
                </CardContent>
              </Card>
            </>
          ) : section === 'password' ? (
            <>
              <ChangePassword />
            </>
          ) : section === 'transactions' ? (
            // Transaksi Event section (default)
            <Card className="bg-white/90 border-gray-200 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-gray-800">Transaksi Event</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Semua event yang telah Anda ikuti</p>
              </CardHeader>
              <CardContent>
                <EmbeddedEventHistory />
              </CardContent>
            </Card>
          ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
