import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { wishlistService } from '../services/wishlistService';
import { Card, CardContent } from './ui/card';
import { Heart, Calendar, MapPin, Trash2 } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';

export default function EmbeddedWishlist() {
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
    // Return empty string to let image error handler show placeholder
    return '';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-gray-600">Memuat wishlist...</p>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <p className="text-sm text-gray-600">{wishlist.length} event tersimpan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlist.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <Card 
              className="group bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col"
              onClick={() => navigate(`/events/${item.event.id}`)}
            >
              {/* Event Image */}
              <div className="relative w-full overflow-hidden" style={{ height: '180px' }}>
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
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 z-10 hover:scale-110"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>
              </div>

              <CardContent className="p-4 flex-1 flex flex-col">
                {/* Title */}
                <h3 className="font-bold text-gray-900 mb-2 text-[15px] leading-snug line-clamp-2">
                  {item.event.title}
                </h3>

                {/* Date */}
                <div className="flex items-center gap-2 text-[13px] text-gray-600 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(item.event.event_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 text-[13px] text-gray-500 mb-auto">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{item.event.location}</span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                  <span className="text-[12px] text-gray-600">Mulai Dari</span>
                  <span className="text-[15px] font-bold text-gray-900">
                    {item.event.is_free ? 'Free' : `Rp ${item.event.price?.toLocaleString('id-ID')}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
