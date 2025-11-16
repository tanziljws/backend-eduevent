import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, MailOpen, Trash2, Filter, MessageSquare, User, Menu } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import AdminSidebar from '../../components/admin/AdminSidebar';

function AdminMessages() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMessages();
  }, [filter, search, currentPage]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `http://127.0.0.1:8000/api/admin/messages?page=${currentPage}`;
      if (filter !== 'all') url += `&status=${filter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      console.log('Fetching messages from:', url);

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Messages data:', data);
        setMessages(data.messages.data || []);
        setStats(data.stats || { total: 0, unread: 0, read: 0 });
        setTotalPages(data.messages.last_page || 1);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`http://127.0.0.1:8000/api/admin/messages/${id}/mark-read`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        fetchMessages(); // Refresh list
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pesan ini?')) return;

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`http://127.0.0.1:8000/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        fetchMessages(); // Refresh list
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-0 z-50 md:relative md:z-0 ${mobileOpen ? 'block' : 'hidden md:block'}`}>
        <AdminSidebar 
          className="h-full" 
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Menu Button */}
        <div className="md:hidden p-4 bg-white border-b">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages from Users</h1>
          <p className="text-gray-600">Manage messages and inquiries from users</p>
        </div>

        {/* Stats Cards - Softer colors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Pesan</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Belum Dibaca</p>
                  <p className="text-3xl font-bold text-orange-500">{stats.unread}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sudah Dibaca</p>
                  <p className="text-3xl font-bold text-green-500">{stats.read}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <MailOpen className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Cari nama, email, atau subjek..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'outline'}
                className={filter === 'all' ? 'bg-blue-600 text-white' : ''}
              >
                Semua
              </Button>
              <Button
                onClick={() => setFilter('unread')}
                variant={filter === 'unread' ? 'default' : 'outline'}
                className={filter === 'unread' ? 'bg-orange-600 text-white' : ''}
              >
                Belum Dibaca
              </Button>
              <Button
                onClick={() => setFilter('read')}
                variant={filter === 'read' ? 'default' : 'outline'}
                className={filter === 'read' ? 'bg-green-600 text-white' : ''}
              >
                Sudah Dibaca
              </Button>
            </div>
          </div>
        </div>

        {/* Messages List - Testimonial Style */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600">Memuat pesan...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada pesan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200 relative h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Unread Indicator - Subtle dot */}
                    {!message.is_read && (
                      <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    )}

                    {/* Header with Avatar */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-sm">
                        {getInitials(message.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-0.5">{message.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{message.email}</p>
                      </div>
                    </div>

                    {/* Subject Badge - More subtle */}
                    <div className="mb-3">
                      <span className="inline-block px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-md border border-gray-200">
                        {message.subject}
                      </span>
                    </div>

                    {/* Message Preview - Lighter text */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3 leading-relaxed flex-grow">
                      {message.message}
                    </p>

                    {/* Date - Smaller and lighter */}
                    <p className="text-xs text-gray-400 mb-4">
                      {formatDate(message.created_at)}
                    </p>

                    {/* Actions - More subtle buttons */}
                    <div className="flex gap-2 mt-auto">
                      {!message.is_read && (
                        <Button
                          onClick={() => handleMarkAsRead(message.id)}
                          size="sm"
                          className="flex-1 bg-white border border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 shadow-none"
                        >
                          <MailOpen className="w-3.5 h-3.5 mr-1.5" />
                          <span className="text-xs">Tandai Dibaca</span>
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(message.id)}
                        size="sm"
                        variant="outline"
                        className="border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default AdminMessages;
