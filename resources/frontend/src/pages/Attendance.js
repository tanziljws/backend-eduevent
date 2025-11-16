import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, MapPin, Calendar, Award, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { eventService } from '../services/eventService';

function Attendance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEventAndStatus();
  }, [id, user, navigate]);

  const fetchEventAndStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const eventResponse = await eventService.getEvent(id);
      setEvent(eventResponse);
      
      // Check attendance status
      const statusResponse = await eventService.getAttendanceStatus(id);
      setAttendanceStatus(statusResponse);
      
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Event tidak ditemukan atau belum waktunya untuk absen');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token || token.length < 6) {
      setError('Token harus diisi dengan benar');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Call backend API to verify token and mark attendance
      const response = await eventService.markAttendance(id, { token });
      
      if (response.data) {
        // Attendance successful - mark certificate as earned
        localStorage.setItem('certificateEarned', 'true');
        localStorage.setItem('attendanceCompleted', 'true');
        setSuccess(true);
      }
    } catch (error) {
      console.error('Attendance error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Memuat halaman kehadiran...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link to="/profile?section=transactions" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Kembali ke Transaksi Event</span>
            </Link>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">🎉 Selamat! Absensi Berhasil!</h1>
            <p className="text-gray-700 text-lg mb-8">
              Kehadiran Anda telah tercatat. Sertifikat keikutsertaan sudah tersedia untuk diunduh.
            </p>
          </div>

          {/* Certificate Card */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 mb-8 text-center">
            <div className="bg-white/90 rounded-xl p-6 shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sertifikat Keikutsertaan</h2>
              <p className="text-gray-700 mb-4">Workshop Testing Sertifikat - EduFest 2025</p>
              <p className="text-gray-600 text-sm mb-6">
                Diterbitkan pada: {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <Button 
                asChild 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3"
              >
                <Link to="/certificates">
                  <Download className="w-5 h-5 mr-2" />
                  Download Sertifikat
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/events">📅 Lihat Event Lain</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to="/dashboard">🏠 Ke Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link 
            to="/profile?section=transactions" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Kembali ke Transaksi Event</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Daftar Hadir</h1>
              <p className="text-gray-600 mt-1">{event?.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Form */}
          <div>
            <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Input Token Kehadiran</span>
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2 ml-13">
                  Masukkan token 10 digit yang dikirim ke email Anda
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Status Check */}
                {attendanceStatus && (
                  <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${
                    attendanceStatus.active 
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : attendanceStatus.is_event_passed
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-semibold">{attendanceStatus.message}</span>
                    </div>
                    {!attendanceStatus.active && (
                      <div className="mt-2 text-xs">
                        <p>Hari kegiatan: <span className="font-semibold">{attendanceStatus.event_date || 'N/A'}</span></p>
                        <p>Jam mulai: <span className="font-semibold">{attendanceStatus.start_time || 'N/A'}</span></p>
                        <p>Waktu sekarang: <span className="font-semibold">
                          {attendanceStatus.current_time 
                            ? (typeof attendanceStatus.current_time === 'string' 
                              ? new Date(attendanceStatus.current_time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                              : new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))
                            : new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                        </span></p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                      Token Kehadiran <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="token"
                      name="token"
                      placeholder="Masukkan token kehadiran"
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      maxLength={10}
                      required
                      className="w-full text-center text-lg font-mono tracking-widest bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Token berupa 10 digit yang dikirim ke email Anda saat registrasi
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Cara Menggunakan:
                    </h4>
                    <ol className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600 min-w-[20px]">1.</span>
                        <span>Buka email konfirmasi registrasi</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600 min-w-[20px]">2.</span>
                        <span>Salin token 10 digit dari email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600 min-w-[20px]">3.</span>
                        <span>Masukkan token di form di atas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600 min-w-[20px]">4.</span>
                        <span>Klik "Catat Kehadiran"</span>
                      </li>
                    </ol>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !token || token.length < 6 || (attendanceStatus && !attendanceStatus.active)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        Memproses...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Catat Kehadiran
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Event Info */}
          <div>
            <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <span>Informasi Kegiatan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {event?.title || 'Loading...'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {event?.description || 'Memuat deskripsi...'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {event?.event_date ? 
                        new Date(event.event_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 
                        'Loading...'
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5" />
                    <span>{event?.start_time || 'Loading...'} WIB</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5" />
                    <span>{event?.location || 'Loading...'}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className={`rounded-xl p-4 border ${
                    attendanceStatus?.active 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                      : attendanceStatus?.is_event_passed
                      ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
                      : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                  }`}>
                    <h4 className="font-semibold text-gray-900 mb-3">Status Kehadiran:</h4>
                    <div className="flex items-center gap-3">
                      {attendanceStatus?.active ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-700 font-medium">Daftar hadir sedang dibuka</span>
                        </>
                      ) : attendanceStatus?.is_event_passed ? (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-red-700 font-medium">Daftar hadir sudah ditutup</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-600 font-medium">Daftar hadir belum dibuka</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
