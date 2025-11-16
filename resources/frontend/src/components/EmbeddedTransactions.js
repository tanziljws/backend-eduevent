import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { userService } from '../services/userService';
import { CalendarDays, CreditCard, FileWarning } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmbeddedTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function run() {
      try {
        setError('');
        const res = await userService.getTransactions();
        const list = res?.data?.events || res?.data || [];
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        setError('Terjadi kesalahan saat mengambil transaksi');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  if (loading) return <div className="text-sm text-gray-600">Memuat transaksi...</div>;

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
        <CardContent className="p-6 text-center text-sm text-gray-700">Belum ada transaksi event.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((t) => (
        <Card key={t.registration_id || t.id} className="bg-white border-gray-200">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{t.event?.title}</div>
                <div className="text-xs text-gray-600 truncate flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{t.event?.formatted_date || t.event?.event_date}</span>
                  <span>•</span>
                  <span className="capitalize">{t.overall_status || t.attendance_status}</span>
                </div>
              </div>
            </div>
            <Link to={`/events/${t.event?.id}`} className="text-sm text-blue-600 hover:underline whitespace-nowrap">Detail</Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
