import api from '../config/api';

export const wishlistService = {
  // Get all wishlisted events
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  // Add event to wishlist
  addToWishlist: async (eventId) => {
    const response = await api.post('/wishlist', { event_id: eventId });
    return response.data;
  },

  // Remove event from wishlist
  removeFromWishlist: async (eventId) => {
    const response = await api.delete(`/wishlist/${eventId}`);
    return response.data;
  },

  // Check if event is wishlisted
  checkWishlist: async (eventId) => {
    const response = await api.get(`/wishlist/check/${eventId}`);
    return response.data;
  },
};
