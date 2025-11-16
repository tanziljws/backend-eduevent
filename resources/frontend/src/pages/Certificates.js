import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Search, Download, Calendar, Award, Filter, RefreshCw } from 'lucide-react';
import { userService } from '../services/userService';
import { eventService } from '../services/eventService';
import CertificateGenerator from '../components/CertificateGenerator';

function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [generatingCertificates, setGeneratingCertificates] = useState(new Set());

  useEffect(() => {
    // Check for search parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const isAuth = !!localStorage.getItem('auth_token');
      
      if (!isAuth) {
        setCertificates([]);
        setRegistrations([]);
        setLoading(false);
        return;
      }

      const [certificatesResponse, registrationsResponse] = await Promise.all([
        userService.getCertificates()
          .catch(err => {
            console.error('Certificates API error:', err?.response?.status, err?.response?.data || err?.message);
            return [];
          }),
        eventService.getMyRegistrations()
          .catch(err => {
            console.error('Registrations API error:', err?.response?.status, err?.response?.data || err?.message);
            return { data: [] };
          })
      ]);
      
      // Backend returns array directly for certificates
      const certs = Array.isArray(certificatesResponse) ? certificatesResponse : [];
      const regs = registrationsResponse.data || registrationsResponse || [];
      
      // Map certificates to match UI format
      const categoryMap = {
        'teknologi': 'Teknologi',
        'seni_budaya': 'Seni & Budaya',
        'olahraga': 'Olahraga',
        'akademik': 'Akademik',
        'sosial': 'Sosial'
      };
      
      const mappedCerts = certs.map(cert => ({
        id: cert.id,
        serial_number: cert.serial_number,
        title: `Sertifikat ${cert.registration?.event?.title || 'Event'}`,
        event_name: cert.registration?.event?.title || 'Unknown Event',
        participant_name: cert.registration?.user?.name || 'Unknown',
        issued_date: cert.issued_at || cert.created_at,
        status: 'available',
        category: categoryMap[cert.registration?.event?.category] || 'Umum',
        achievement: 'Peserta',
        file_path: cert.file_path,
        download_url: cert.download_url
      }));
      
      console.log('Fetched certificates:', mappedCerts);
      setCertificates(mappedCerts);
      setRegistrations(Array.isArray(regs) ? regs : []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = !searchTerm || 
                         cert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = async (certificateId) => {
    try {
      console.log('Downloading certificate ID:', certificateId);
      await userService.downloadCertificate(certificateId);
      console.log('Download successful');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      console.error('Error response:', error?.response);
      const message =
        error?.response?.data?.message ||
        (error?.response?.status === 404
          ? 'Sertifikat tidak ditemukan atau bukan milik akun Anda.'
          : 'Gagal mengunduh sertifikat. Silakan coba lagi.');
      alert(message);
    }
  };

  const handleGenerateCertificate = async (registrationId, template) => {
    try {
      setGeneratingCertificates(prev => new Set([...prev, registrationId]));
      
      const response = await eventService.generateCertificate(registrationId, { template });
      
      if (response.data.status === 'processing') {
        // Poll for completion
        setTimeout(() => {
          fetchCertificates();
          setGeneratingCertificates(prev => {
            const newSet = new Set(prev);
            newSet.delete(registrationId);
            return newSet;
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Gagal membuat sertifikat. Silakan coba lagi.');
      setGeneratingCertificates(prev => {
        const newSet = new Set(prev);
        newSet.delete(registrationId);
        return newSet;
      });
    }
  };

  const handleRefresh = () => {
    fetchCertificates();
  };

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'available', label: 'Tersedia' },
    { value: 'processing', label: 'Diproses' },
    { value: 'expired', label: 'Kedaluwarsa' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sertifikat Saya</h1>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari sertifikat berdasarkan nama atau kegiatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Certificate Generator Section */}
        {registrations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Generator Sertifikat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((registration) => (
                <CertificateGenerator
                  key={registration.id}
                  registration={registration}
                  onGenerate={handleGenerateCertificate}
                  onDownload={handleDownload}
                  isGenerating={generatingCertificates.has(registration.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Certificates Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Memuat sertifikat...</div>
          </div>
        ) : filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert, index) => (
              <Card key={cert.id || index} className="bg-white border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-yellow-100 to-yellow-200">
                  {/* Certificate Image Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center">
                      <Award className="w-8 h-8 text-yellow-700" />
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant={cert.status === 'available' ? 'default' : cert.status === 'processing' ? 'secondary' : 'destructive'}
                      className={`text-xs ${
                        cert.status === 'available' ? 'bg-green-500 text-white' :
                        cert.status === 'processing' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      }`}
                    >
                      {cert.status === 'available' ? 'Tersedia' : 
                       cert.status === 'processing' ? 'Diproses' : 'Kedaluwarsa'}
                    </Badge>
                  </div>
                  
                  {/* Achievement Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-white/90 text-gray-700 text-xs">
                      {cert.achievement}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <CardTitle className="text-lg font-bold mb-2 line-clamp-2 text-gray-800">
                    {cert.event_name}
                  </CardTitle>
                  
                  <p className="text-gray-600 text-sm mb-2">
                    Sertifikat untuk: <span className="font-semibold text-gray-800">{cert.participant_name}</span>
                  </p>
                  
                  <p className="text-xs text-gray-500 mb-4 font-mono">
                    No. {cert.serial_number}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>
                        Diterbitkan: {new Date(cert.issued_date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>Kategori: {cert.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      disabled={cert.status !== 'available'}
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Lihat
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={cert.status !== 'available'}
                      onClick={() => handleDownload(cert.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tidak ada sertifikat ditemukan' 
                : 'Belum ada sertifikat'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all'
                ? 'Coba ubah kata kunci pencarian atau filter status'
                : 'Sertifikat akan muncul setelah Anda menghadiri event dan admin menerbitkannya'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link to="/events">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Jelajahi Event
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Certificates;
