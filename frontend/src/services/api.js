import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:4000';

// Helper to get full image URL from relative path
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Products
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Categories
export const categoryService = {
  getAll: () => api.get('/categories'),
  getWithSubcategories: () => api.get('/categories/with-subcategories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
};

// Bids
export const bidService = {
  place: (data) => api.post('/bids', data),
  getForProduct: (productId) => api.get(`/bids/product/${productId}`),
  getUserBids: () => api.get('/bids/my-bids'),
};

// Orders
export const orderService = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

// Cart
export const cartService = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (itemId, data) => api.put(`/cart/item/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/item/${itemId}`),
  clear: () => api.delete('/cart/clear'),
};

// Watchlist
export const watchlistService = {
  get: () => api.get('/watchlist'),
  add: (productId) => api.post('/watchlist', { productId }),
  remove: (productId) => api.delete(`/watchlist/${productId}`),
  check: (productId) => api.get(`/watchlist/check/${productId}`),
};

// Reviews
export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getForProduct: (productId) => api.get(`/reviews/product/${productId}`),
  getForUser: (userId, type) => api.get(`/reviews/user/${userId}`, { params: { type } }),
};

// Messages
export const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  send: (data) => api.post('/messages', data),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// Notifications
export const notificationService = {
  get: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Addresses
export const addressService = {
  getAll: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
};

// Offers (Make an Offer / Best Offer)
export const offerService = {
  getForProduct: (productId) => api.get(`/offers/product/${productId}`),
  getSentOffers: () => api.get('/offers/my'),           // Offers I sent as buyer
  getMyOffers: () => api.get('/offers/received'),       // Offers I received as seller
  getReceivedOffers: () => api.get('/offers/received'), // Alias for received offers
  create: (data) => api.post('/offers', data),
  respond: (id, data) => api.put(`/offers/${id}/respond`, data),
  withdraw: (id) => api.put(`/offers/${id}/withdraw`),
  counter: (id, data) => api.put(`/offers/${id}/counter`, data),
};

// Product Q&A
export const questionService = {
  getForProduct: (productId) => api.get(`/questions/product/${productId}`),
  ask: (data) => api.post('/questions', data),
  answer: (id, data) => api.post(`/questions/${id}/answer`, data),
  markHelpful: (id) => api.post(`/questions/${id}/helpful`),
  getMyQuestions: () => api.get('/questions/my'),
};

// Recently Viewed
export const recentlyViewedService = {
  get: () => api.get('/recently-viewed'),
  track: (productId) => api.post('/recently-viewed', { productId }),
  clear: () => api.delete('/recently-viewed'),
};

// Recommendations / Similar Items
export const recommendationService = {
  getSimilar: (productId) => api.get(`/recommendations/similar/${productId}`),
  getPersonalized: () => api.get('/recommendations/personalized'),
  getTrending: () => api.get('/recommendations/trending'),
  getForCategory: (categoryId) => api.get(`/recommendations/category/${categoryId}`),
};

// Price Drop Alerts
export const priceAlertService = {
  getMyAlerts: () => api.get('/price-alerts/my'),
  create: (data) => api.post('/price-alerts', data),
  update: (id, data) => api.put(`/price-alerts/${id}`, data),
  delete: (id) => api.delete(`/price-alerts/${id}`),
  getPriceHistory: (productId) => api.get(`/price-alerts/history/${productId}`),
};

// Collections / Lists
export const collectionService = {
  getMyCollections: () => api.get('/collections/my'),
  getPublicCollections: () => api.get('/collections/public'),
  getById: (id) => api.get(`/collections/${id}`),
  create: (data) => api.post('/collections', data),
  update: (id, data) => api.put(`/collections/${id}`, data),
  delete: (id) => api.delete(`/collections/${id}`),
  addItem: (id, productId) => api.post(`/collections/${id}/items`, { productId }),
  removeItem: (id, productId) => api.delete(`/collections/${id}/items/${productId}`),
  follow: (id) => api.post(`/collections/${id}/follow`),
  unfollow: (id) => api.delete(`/collections/${id}/follow`),
};

// Social Sharing
export const socialShareService = {
  share: (data) => api.post('/social/share', data),
  getShareStats: (productId) => api.get(`/social/stats/${productId}`),
  trackClick: (shareId) => api.post(`/social/click/${shareId}`),
};

// Bulk Upload
export const bulkUploadService = {
  getTemplates: () => api.get('/bulk-upload/templates'),
  upload: (formData) => api.post('/bulk-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getJobs: () => api.get('/bulk-upload/jobs'),
  getJobStatus: (jobId) => api.get(`/bulk-upload/jobs/${jobId}`),
};

// Scheduled Listings
export const scheduledListingService = {
  getMyScheduled: () => api.get('/scheduled-listings/my'),
  create: (data) => api.post('/scheduled-listings', data),
  update: (id, data) => api.put(`/scheduled-listings/${id}`, data),
  delete: (id) => api.delete(`/scheduled-listings/${id}`),
  publishNow: (id) => api.post(`/scheduled-listings/${id}/publish`),
};

// Seller Stores
export const storeService = {
  getByUsername: (username) => api.get(`/stores/${username}`),
  getProducts: (username, params) => api.get(`/stores/${username}/products`, { params }),
  getCategories: (username) => api.get(`/stores/${username}/categories`),
  getMyStore: () => api.get('/stores/my'),
  update: (data) => api.put('/stores/my', data),
  subscribe: (username) => api.post(`/stores/${username}/subscribe`),
  unsubscribe: (username) => api.delete(`/stores/${username}/subscribe`),
  getSubscribers: () => api.get('/stores/my/subscribers'),
};

// Invoices
export const invoiceService = {
  getForOrder: (orderId) => api.get(`/invoices/order/${orderId}`),
  generate: (orderId) => api.post(`/invoices/generate/${orderId}`),
  download: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  getMyInvoices: () => api.get('/invoices/my'),
  markPaid: (id) => api.put(`/invoices/${id}/paid`),
};

// Rewards / eBay Bucks
export const rewardsService = {
  getMyRewards: () => api.get('/rewards/my'),
  getTransactions: () => api.get('/rewards/transactions'),
  getTiers: () => api.get('/rewards/tiers'),
  redeem: (data) => api.post('/rewards/redeem', data),
  earnPoints: (data) => api.post('/rewards/earn', data),
};

// Payment Plans (Buy Now Pay Later)
export const paymentPlanService = {
  getMyPlans: () => api.get('/payment-plans/my'),
  checkEligibility: (amount) => api.get('/payment-plans/eligibility', { params: { amount } }),
  getPlan: (id) => api.get(`/payment-plans/${id}`),
  create: (data) => api.post('/payment-plans', data),
  payInstallment: (planId, installmentId) => api.post(`/payment-plans/${planId}/pay/${installmentId}`),
};

// Live Chat Support
export const supportChatService = {
  getMyChats: () => api.get('/support/chats'),
  getChatMessages: (chatId) => api.get(`/support/chats/${chatId}`),
  startChat: (data) => api.post('/support/chats', data),
  sendMessage: (chatId, data) => api.post(`/support/chats/${chatId}/message`, data),
  closeChat: (chatId) => api.put(`/support/chats/${chatId}/close`),
  getAgentDashboard: () => api.get('/support/agent/dashboard'),
};

// Multi-Currency
export const currencyService = {
  getCurrencies: () => api.get('/currencies'),
  convert: (amount, from, to) => api.get('/currencies/convert', { params: { amount, from, to } }),
  getPreference: () => api.get('/currencies/preference'),
  setPreference: (data) => api.put('/currencies/preference', data),
};

// Bid Retraction
export const bidRetractionService = {
  getMyRetractions: () => api.get('/bid-retractions/my'),
  getPending: () => api.get('/bid-retractions/pending'),
  request: (data) => api.post('/bid-retractions', data),
  review: (id, data) => api.put(`/bid-retractions/${id}/review`, data),
};

export default api;
