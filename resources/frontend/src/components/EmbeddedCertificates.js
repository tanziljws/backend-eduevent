import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { userService } from '../services/userService';
import { Award, Download, FileWarning } from 'lucide-react';

export default function EmbeddedCertificates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function run() {
      try {
        setError('');
        const res = await userService.getCertificates();
        if (res?.success || res?.data) {
          // API may return {success:true,data:[...]} or directly {data:[...]}; normalize
          const list = res.data || res?.data?.certificates || [];
          setItems(Array.isArray(list) ? list : []);
        } else {
          setError(res?.message || 'Gagal mengambil sertifikat');
        }
      } catch (e) {
        setError('Terjadi kesalahan saat mengambil sertifikat');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  if (loading) return <div className="text-sm text-gray-600">Memuat sertifikat...</div>;

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-3 text-sm text-red-700 flex items-center gap-2">
          <FileWarning className="w-4 h-4" /> {error}
        </CardContent>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6 text-center text-sm text-gray-700">Belum ada sertifikat.</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((c) => (
        <Card key={c.id} className="bg-white border-gray-200">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{c.event_name || c.title || 'Sertifikat'}</div>
                <div className="text-xs text-gray-600 truncate">{c.participant_name || 'Peserta'} • {c.issued_date?.slice(0,10) || ''}</div>
              </div>
            </div>
            {c.certificate_url && (
              <Button asChild size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                <a href={c.certificate_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-1" /> Unduh
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
