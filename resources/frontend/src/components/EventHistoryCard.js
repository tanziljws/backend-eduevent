import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Award, 
  Download,
  Eye,
  AlertCircle,
  Hash
} from 'lucide-react';
import { userService } from '../services/userService';
import { eventService } from '../services/eventService';
import { useState, useEffect } from 'react';

const EventHistoryCard = ({ eventData, onRefresh }) => {
  const { event, attendance, certificate: initialCertificate, registration_date, overall_status, registration_id } = eventData;
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localCertificate, setLocalCertificate] = useState(initialCertificate);
  
  // Update local certificate when eventData changes
  useEffect(() => {
    setLocalCertificate(eventData.certificate);
  }, [eventData.certificate]);
  
  // Use local certificate if available, otherwise use initial
  const certificate = localCertificate || initialCertificate;

  // Handle certificate download
  const handleDownloadCertificate = async (e) => {
    e.preventDefault();
    
    if (!certificate || !certificate.id) {
      console.error('Certificate ID not found in data:', certificate);
      alert('Certificate ID tidak ditemukan. Silakan refresh halaman dan coba lagi.');
      return;
    }
    
    // If certificate is still pending and not available, show message
    if (certificate.status === 'pending' && !certificate.available) {
      alert('Sertifikat masih dalam proses. Silakan coba lagi dalam beberapa saat atau refresh halaman.');
      // Refresh data to check for updates
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 1000);
      }
      return;
    }
    
    try {
      setIsDownloading(true);
      await userService.downloadCertificate(certificate.id);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      
      // Try to extract error message from blob response
      let errorMessage = 'Gagal mengunduh sertifikat';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          errorMessage = json.message || errorMessage;
        } catch (e) {
          // If parsing fails, use default message
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // If certificate file not found or 500 error, it might still be processing
      if (error.response?.status === 404 || error.response?.status === 500 || errorMessage.includes('not found') || errorMessage.includes('processing')) {
        alert('File sertifikat belum tersedia. Sertifikat masih dalam proses. Silakan refresh halaman dalam beberapa saat.');
        // Refresh data to check for updates
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 1000);
        }
      } else {
        alert(`Error: ${errorMessage}. Silakan coba lagi.`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle certificate generation
  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    
    if (!registration_id) {
      alert('Registration ID tidak ditemukan. Silakan refresh halaman dan coba lagi.');
      return;
    }
    
    try {
      setIsGenerating(true);
      const response = await eventService.generateCertificate(registration_id, {});
      
      if (response.success) {
        // Update local certificate state immediately
        if (response.certificate) {
          setLocalCertificate({
            id: response.certificate.id,
            available: response.certificate.available || false,
            status: response.certificate.status,
            certificate_number: response.certificate.certificate_number,
            certificate_url: response.certificate.certificate_url,
          });
        }
        
        // If certificate is available, show success message
        if (response.certificate?.available) {
          alert('Sertifikat sudah tersedia!');
        } else {
          alert('Sertifikat sedang diproses. Silakan refresh halaman dalam beberapa saat.');
        }
        
        // Refresh data after a short delay to update the UI with latest data
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 1500);
        }
      } else {
        alert(response.message || 'Gagal membuat sertifikat. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      let errorMessage = 'Gagal membuat sertifikat';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}. Silakan coba lagi.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: <Award className="w-4 h-4" />,
          text: 'Selesai'
        };
      case 'attended':
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Hadir'
        };
      case 'upcoming':
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: <Clock className="w-4 h-4" />,
          text: 'Akan Datang'
        };
      case 'missed':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Terlewat'
        };
      case 'cancelled':
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Dibatalkan'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(overall_status);

  // Debug: Log data to console for all events
  React.useEffect(() => {
    console.log('EventHistoryCard Debug:', {
      eventTitle: event.title,
      overall_status,
      certificate,
      hasCertificate: !!certificate?.id,
      registration_id,
      shouldShowButton: overall_status === 'completed' || overall_status === 'attended',
    });
  }, [overall_status, certificate, event.title, registration_id]);

  return (
    <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-gray-800 text-base mb-1 line-clamp-2">
              {event.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${statusConfig.color} border`}>
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.text}</span>
              </Badge>
              {/* Show certificate badge if event is completed/attended or attendance is present */}
              {((overall_status === 'completed' || overall_status === 'attended') || attendance?.is_present) && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border">
                  <Award className="w-3 h-3 mr-1" />
                  Sertifikat
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Event Details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{event.formatted_date}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{event.formatted_time} WIB</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Registration Info */}
        <div className="bg-gray-50 rounded-lg p-2.5 space-y-2.5">
          <div className="text-xs text-gray-600">
            Terdaftar: {new Date(registration_date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          {/* Token Display - Always show for registered events */}
          <div className="bg-white rounded-md p-2 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Hash className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Token OTP</span>
              </div>
              {attendance.token_used && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Digunakan
                </div>
              )}
            </div>
            
            {/* Show token if available */}
            {eventData.registration?.token_plain ? (
              <div className="font-mono text-sm text-gray-800 bg-blue-50 px-3 py-2 rounded border border-blue-200 text-center tracking-wider">
                {eventData.registration.token_plain}
              </div>
            ) : eventData.token_plain ? (
              <div className="font-mono text-sm text-gray-800 bg-blue-50 px-3 py-2 rounded border border-blue-200 text-center tracking-wider">
                {eventData.token_plain}
              </div>
            ) : attendance.token_used ? (
              <div className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                {attendance.token_used}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Token dikirim ke email saat registrasi
              </div>
            )}
          </div>
          
          {/* Attendance Status */}
          {attendance.is_present ? (
            <div className="flex items-center gap-2 text-green-600 text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Hadir pada {attendance.formatted_attendance_time}</span>
            </div>
          ) : overall_status === 'upcoming' ? (
            <div className="flex items-center gap-2 text-yellow-600 text-xs">
              <Clock className="w-3 h-3" />
              <span>Belum waktunya absen</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <XCircle className="w-3 h-3" />
              <span>Tidak hadir</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Link to={`/events/${event.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              Detail Event
            </Link>
          </Button>

          {/* Show certificate button for completed/attended events */}
          {/* Also show if attendance is present (fallback check) */}
          {((overall_status === 'completed' || overall_status === 'attended') || attendance?.is_present) && (
            certificate?.id ? (
              // Certificate exists (even if pending) - show download button
              // If certificate is available, it will download. If not, backend will handle error
              <Button
                onClick={handleDownloadCertificate}
                size="sm"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={isDownloading || (certificate?.status === 'pending' && !certificate?.available)}
              >
                {certificate?.status === 'pending' && !certificate?.available ? (
                  <>
                    <Award className="w-4 h-4 mr-1" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    {isDownloading ? 'Mengunduh...' : 'Sertifikat'}
                  </>
                )}
              </Button>
            ) : (
              // Certificate doesn't exist - show generate button
              <Button
                onClick={handleGenerateCertificate}
                size="sm"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={isGenerating}
              >
                <Award className="w-4 h-4 mr-1" />
                {isGenerating ? 'Memproses...' : 'Sertifikat'}
              </Button>
            )
          )}

          {overall_status === 'upcoming' && !attendance?.is_present && (
            <Button
              asChild
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link to={`/events/${event.id}/attendance`}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Absen
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventHistoryCard;
