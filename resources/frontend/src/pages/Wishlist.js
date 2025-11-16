import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { wishlistService } from '../services/wishlistService';
import { Card, CardContent } from '../components/ui/card';
import { Heart, Calendar, MapPin, Trash2, ArrowLeft } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';
import Footer from '../components/Footer';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getWishlist();
      setWishlist(response.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (eventId) => {
    try {
      await wishlistService.removeFromWishlist(eventId);
      setWishlist(prev => prev.filter(item => item.event.id !== eventId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const placeholderByCategory = (category) => {
    const placeholders = {
      teknologi: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
      seni_budaya: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop',
      olahraga: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop',
      akademik: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
      sosial: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop',
    };
    return placeholders[category] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-600">Memuat wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 fill-white" />
            <h1 className="text-3xl font-bold">Wishlist Event</h1>
          </div>
          <p className="text-white/90">Event yang Anda simpan untuk nanti</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Wishlist Kosong
            </h3>
            <p className="text-gray-600 mb-6">
              Belum ada event yang disimpan. Mulai tambahkan event favorit Anda!
            </p>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Jelajahi Event
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {wishlist.length} event tersimpan
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Card 
                    className="group bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col"
                    onClick={() => navigate(`/events/${item.event.id}`)}
                  >
                    {/* Event Image */}
                    <div className="relative w-full overflow-hidden" style={{ height: '220px' }}>
                      {item.event.flyer_url ? (
                        <img
                          src={item.event.flyer_url}
                          alt={item.event.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={placeholderByCategory(item.event.category)}
                          alt="Event"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.event.id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 z-10 group/btn"
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col">
                      {/* Title */}
                      <h3 className="font-bold text-gray-900 mb-2 text-[17px] leading-snug line-clamp-2">
                        {item.event.title}
                      </h3>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-[14px] text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(item.event.event_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2 text-[14px] text-gray-500 mb-auto">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{item.event.location}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                        <span className="text-[14px] text-gray-600">Mulai Dari</span>
                        <span className="text-[17px] font-bold text-gray-900">
                          {item.event.is_free ? 'Free' : `Rp ${item.event.price?.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Wishlist;
