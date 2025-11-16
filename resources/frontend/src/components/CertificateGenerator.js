import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Sparkles, Clock, CheckCircle, AlertCircle, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CertificateGenerator = ({ registration, onGenerate, onDownload, isGenerating = false }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('random');
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = [
    {
      id: 'random',
      name: 'Random',
      description: 'Sistem akan memilih template terbaik',
      icon: '🎲',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Desain modern dengan gradient dan efek visual',
      icon: '✨',
      color: 'from-blue-500 to-purple-500'
    },
    {
      id: 'classic',
      name: 'Classic',
      description: 'Desain klasik dengan elemen tradisional',
      icon: '🏆',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'default',
      name: 'Default',
      description: 'Template standar yang sederhana',
      icon: '📜',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const handleGenerate = () => {
    onGenerate(registration.id, selectedTemplate);
  };

  const getStatusInfo = () => {
    if (registration.certificate) {
      return {
        status: 'completed',
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        text: 'Sertifikat siap diunduh'
      };
    }
    
    if (isGenerating) {
      return {
        status: 'generating',
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        text: 'Sedang membuat sertifikat...'
      };
    }
    
    if (!registration.attendance || registration.attendance.status !== 'present') {
      return {
        status: 'not_attended',
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        text: 'Anda harus hadir terlebih dahulu'
      };
    }
    
    return {
      status: 'ready',
      icon: Sparkles,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      text: 'Siap untuk dibuat'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Generator Sertifikat
          </CardTitle>
          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Event Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">{registration.event?.title}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📅 {new Date(registration.event?.event_date).toLocaleDateString('id-ID')}</p>
            <p>📍 {registration.event?.location}</p>
            <p>👤 {registration.user?.name}</p>
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Pilih Template
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              {showTemplates ? 'Sembunyikan' : 'Lihat Pilihan'}
            </Button>
          </div>
          
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2"
              >
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative cursor-pointer rounded-lg p-3 border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className={`w-full h-16 rounded-md bg-gradient-to-r ${template.color} flex items-center justify-center text-white text-2xl mb-2`}>
                      {template.icon}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {registration.certificate ? (
            <Button
              onClick={() => onDownload(registration.certificate.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Unduh Sertifikat
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || statusInfo.status === 'not_attended'}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Buat Sertifikat
                </>
              )}
            </Button>
          )}
        </div>

        {/* Status Message */}
        {statusInfo.status === 'not_attended' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              ⚠️ Anda harus hadir di event terlebih dahulu sebelum dapat membuat sertifikat.
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              🔄 Sertifikat sedang dibuat dengan template {templates.find(t => t.id === selectedTemplate)?.name}...
              Proses ini memakan waktu 30-60 detik.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateGenerator;







