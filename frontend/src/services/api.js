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

// Some backend endpoints return raw DB columns (snake_case) while others manually
// map to camelCase. Rather than chase every controller, normalize on the way in:
// for every object response, mirror each snake_case key to its camelCase form,
// while keeping the original key so code that still reads snake_case keeps working.
// Leaves primitives, arrays-of-primitives, and non-plain objects (File, Blob, etc.) alone.
const snakeToCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const addCamelKeys = (value) => {
  if (Array.isArray(value)) return value.map(addCamelKeys);
  if (
    value &&
    typeof value === 'object' &&
    (value.constructor === Object || Object.getPrototypeOf(value) === null)
  ) {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      const mapped = addCamelKeys(v);
      out[key] = mapped;
      const camel = snakeToCamel(key);
      if (camel !== key && !(camel in value)) {
        out[camel] = mapped;
      }
    }
    return out;
  }
  return value;
};

api.interceptors.response.use(
  (response) => {
    // Don't rewrite blobs/streams (file downloads).
    const isJsonBody =
      response.data &&
      typeof response.data === 'object' &&
      !(response.data instanceof Blob) &&
      !(response.data instanceof ArrayBuffer);
    if (isJsonBody) {
      response.data = addCamelKeys(response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const serverError = error.response?.data?.error;
    // Treat invalid/expired/missing-token responses as "not authenticated" and reset.
    // Some auth middleware historically returned 403 for invalid tokens, so cover both.
    const isAuthFailure =
      status === 401 ||
      (status === 403 &&
        typeof serverError === 'string' &&
        /token|access token/i.test(serverError));

    if (isAuthFailure) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Avoid bouncing away from the login page itself.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
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
  getFilters: (params) => api.get('/products/filters', { params }),
};

// Ranked search + autocomplete
export const searchService = {
  search: (params) => api.get('/search', { params }),
  suggest: (q) => api.get('/search/suggest', { params: { q } }),
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
  // targetType: 'question' | 'answer'
  upvote: (targetType, targetId) =>
    api.post(`/questions/upvote/${targetType}/${targetId}`),
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
  getMyAlerts: () => api.get('/price-alerts'),
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

// Upload Service
export const uploadService = {
  uploadSingle: (formData) => api.post('/upload/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadMultiple: (formData) => api.post('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadProductImages: (productId, formData) => api.post(`/upload/product/${productId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProductImage: (productId, imageId) => api.delete(`/upload/product/${productId}/image/${imageId}`),
  setPrimaryImage: (productId, imageId) => api.put(`/upload/product/${productId}/image/${imageId}/primary`),
  reorderImages: (productId, imageOrder) => api.put(`/upload/product/${productId}/reorder`, { imageOrder }),
  uploadAvatar: (formData) => api.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// AI Service (OpenRouter powered)
export const aiService = {
  generateDescription: (data) => api.post('/ai/generate-description', data),
  suggestPrice: (data) => api.post('/ai/suggest-price', data),
  getRecommendations: (data) => api.post('/ai/recommendations', data),
  answerQuestion: (data) => api.post('/ai/answer-question', data),
  analyzeListingQuality: (data) => api.post('/ai/analyze-listing', data),
  generateItemSpecifics: (data) => api.post('/ai/generate-specifics', data),
  getSearchSuggestions: (data) => api.post('/ai/search-suggestions', data),
  analyzeFraudRisk: (data) => api.post('/ai/fraud-analysis', data),
  chat: (data) => api.post('/ai/chat', data),
  generateMessageReply: (data) => api.post('/ai/message-reply', data),
  analyzeImage: (data) => api.post('/ai/analyze-image', data),
  getBackgroundSuggestions: (data) => api.post('/ai/background-suggestions', data),
};

// Seller Performance
export const sellerPerformanceService = {
  getMyPerformance: () => api.get('/seller-performance/my'),
  getDashboard: () => api.get('/seller-performance/dashboard'),
  getSellerPerformance: (sellerId) => api.get(`/seller-performance/seller/${sellerId}`),
  calculatePerformance: () => api.post('/seller-performance/calculate'),
  getDefects: (params) => api.get('/seller-performance/defects', { params }),
  appealDefect: (defectId, data) => api.post(`/seller-performance/defects/${defectId}/appeal`, data),
  getBenefits: () => api.get('/seller-performance/benefits'),
  getHistory: (params) => api.get('/seller-performance/history', { params }),
};

// Membership / eBay Plus
export const membershipService = {
  getPlans: () => api.get('/membership/plans'),
  getCurrentMembership: () => api.get('/membership/current'),
  subscribe: (data) => api.post('/membership/subscribe', data),
  cancel: () => api.post('/membership/cancel'),
  updateAutoRenew: (data) => api.put('/membership/auto-renew', data),
  getBenefits: (params) => api.get('/membership/benefits', { params }),
  getExclusiveDeals: () => api.get('/membership/exclusive-deals'),
  checkMemberPricing: (productId) => api.get(`/membership/pricing/${productId}`),
  getHistory: () => api.get('/membership/history'),
  upgrade: (data) => api.post('/membership/upgrade', data),
};

// Shipping Service
export const shippingService = {
  getCarriers: () => api.get('/shipping/carriers'),
  getRates: (carrierId) => api.get(`/shipping/carriers/${carrierId}/rates`),
  getAllRates: () => api.get('/shipping/rates'),
  calculateShipping: (data) => api.post('/shipping/calculate', data),
  createLabel: (orderId, data) => api.post(`/shipping/orders/${orderId}/label`, data),
  getLabel: (id) => api.get(`/shipping/labels/${id}`),
  trackShipment: (trackingNumber) => api.get(`/shipping/track/${trackingNumber}`),
  getOrderShipping: (orderId) => api.get(`/shipping/orders/${orderId}`),
  voidLabel: (id) => api.delete(`/shipping/labels/${id}`),
  getSellerLabels: (params) => api.get('/shipping/seller/labels', { params }),
};

// Daily Deals Service
export const dealsService = {
  getAll: (params) => api.get('/deals', { params }),
  getFeatured: () => api.get('/deals/featured'),
  getCategories: () => api.get('/deals/categories'),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  delete: (id) => api.delete(`/deals/${id}`),
  purchase: (id) => api.post(`/deals/${id}/purchase`),
};

// eBay Live Service
export const liveService = {
  getStreams: (params) => api.get('/live/streams', { params }),
  getActiveStreams: () => api.get('/live/streams/active'),
  getStream: (id) => api.get(`/live/streams/${id}`),
  createStream: (data) => api.post('/live/streams', data),
  updateStream: (id, data) => api.put(`/live/streams/${id}`, data),
  startStream: (id) => api.post(`/live/streams/${id}/start`),
  endStream: (id) => api.post(`/live/streams/${id}/end`),
  joinStream: (id) => api.post(`/live/streams/${id}/join`),
  leaveStream: (id) => api.post(`/live/streams/${id}/leave`),
  getChat: (id) => api.get(`/live/streams/${id}/chat`),
  sendChat: (id, data) => api.post(`/live/streams/${id}/chat`, data),
  pinChat: (streamId, messageId) => api.post(`/live/streams/${streamId}/chat/${messageId}/pin`),
  getProducts: (id) => api.get(`/live/streams/${id}/products`),
  addProduct: (id, data) => api.post(`/live/streams/${id}/products`, data),
  createFlashDeal: (streamId, productId, data) => api.post(`/live/streams/${streamId}/products/${productId}/flash`, data),
  getCategories: () => api.get('/live/categories'),
};

// Team Access Service
export const teamService = {
  getMembers: () => api.get('/team/members'),
  inviteMember: (data) => api.post('/team/invite', data),
  acceptInvite: (token) => api.post('/team/accept', { token }),
  updateMember: (id, data) => api.put(`/team/members/${id}`, data),
  removeMember: (id) => api.delete(`/team/members/${id}`),
  getActivityLog: (params) => api.get('/team/activity', { params }),
  getRoles: () => api.get('/team/roles'),
};

// Vault Service
export const vaultService = {
  getItems: (params) => api.get('/vault/items', { params }),
  getItem: (id) => api.get(`/vault/items/${id}`),
  submitItem: (data) => api.post('/vault/submit', data),
  updateItem: (id, data) => api.put(`/vault/items/${id}`, data),
  requestShipOut: (id, data) => api.post(`/vault/items/${id}/ship-out`, data),
  listItem: (id, data) => api.post(`/vault/items/${id}/list`, data),
  getServices: () => api.get('/vault/services'),
  getStats: () => api.get('/vault/stats'),
};

// Security Audit Service
export const securityAuditService = {
  getAll: (params) => api.get('/security-audit', { params }),
  getStats: () => api.get('/security-audit/stats'),
  getById: (id) => api.get(`/security-audit/${id}`),
  update: (id, data) => api.put(`/security-audit/${id}`, data),
  delete: (id) => api.delete(`/security-audit/${id}`),
};

// Token Blacklist Service
export const tokenBlacklistService = {
  getAll: (params) => api.get('/token-blacklist', { params }),
  getStats: () => api.get('/token-blacklist/stats'),
  getById: (id) => api.get(`/token-blacklist/${id}`),
  delete: (id) => api.delete(`/token-blacklist/${id}`),
  cleanup: () => api.post('/token-blacklist/cleanup'),
};

// Error Log Service
export const errorLogService = {
  getAll: (params) => api.get('/error-logs', { params }),
  getStats: () => api.get('/error-logs/stats'),
  getById: (id) => api.get(`/error-logs/${id}`),
  create: (data) => api.post('/error-logs', data),
  update: (id, data) => api.put(`/error-logs/${id}`, data),
  delete: (id) => api.delete(`/error-logs/${id}`),
};

// Password Policy Service
export const passwordPolicyService = {
  getAll: (params) => api.get('/password-policies', { params }),
  getActive: () => api.get('/password-policies/active'),
  getById: (id) => api.get(`/password-policies/${id}`),
  create: (data) => api.post('/password-policies', data),
  update: (id, data) => api.put(`/password-policies/${id}`, data),
  delete: (id) => api.delete(`/password-policies/${id}`),
  validate: (data) => api.post('/password-policies/validate', data),
};

// Validation Rule Service
export const validationRuleService = {
  getAll: (params) => api.get('/validation-rules', { params }),
  getById: (id) => api.get(`/validation-rules/${id}`),
  create: (data) => api.post('/validation-rules', data),
  update: (id, data) => api.put(`/validation-rules/${id}`, data),
  delete: (id) => api.delete(`/validation-rules/${id}`),
};

// Listing Templates Service
export const listingTemplateService = {
  list: () => api.get('/listing-templates'),
  get: (id) => api.get(`/listing-templates/${id}`),
  create: (data) => api.post('/listing-templates', data),
  update: (id, data) => api.put(`/listing-templates/${id}`, data),
  remove: (id) => api.delete(`/listing-templates/${id}`),
  apply: (id) => api.post(`/listing-templates/${id}/apply`),
};

// Vacation Mode Service
export const vacationService = {
  getStatus: () => api.get('/vacation/me'),
  updateStatus: (data) => api.put('/vacation/me', data),
  getSellerStatus: (sellerId) => api.get(`/vacation/seller/${sellerId}`),
};

// Compare Service
export const compareService = {
  compare: (productIds) => api.post('/compare', { productIds }),
};

// Gift Cards Service
export const giftCardService = {
  purchase: (data) => api.post('/gift-cards/purchase', data),
  redeem: (code) => api.post('/gift-cards/redeem', { code }),
  getBalance: () => api.get('/gift-cards/balance'),
  myPurchased: () => api.get('/gift-cards/my'),
};

// Public Wishlist Service
export const publicWishlistService = {
  setVisibility: (isPublic) => api.put('/public-wishlist/visibility', { isPublic }),
  rotateToken: () => api.post('/public-wishlist/rotate-token'),
  getByToken: (token) => api.get(`/public-wishlist/${token}`),
};

// Seller Earnings Service
export const sellerEarningsService = {
  get: (days = 30) => api.get('/seller/earnings', { params: { days } }),
};

// Bundle Discounts Service
export const bundleDiscountService = {
  listMine: () => api.get('/bundle-discounts/my'),
  create: (data) => api.post('/bundle-discounts', data),
  update: (id, data) => api.put(`/bundle-discounts/${id}`, data),
  delete: (id) => api.delete(`/bundle-discounts/${id}`),
  forSeller: (sellerId) => api.get(`/bundle-discounts/seller/${sellerId}`),
  calculateForCart: (items) => api.post('/bundle-discounts/calculate', { items }),
};

// Coupon Service
export const couponService = {
  validate: (code, subtotal, categoryId) =>
    api.post('/coupons/validate', { code, subtotal, categoryId }),
  listAvailable: () => api.get('/coupons/available'),
  listMine: (params) => api.get('/coupons/my', { params }),
  get: (id) => api.get(`/coupons/${id}`),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// Analytics Service
export const analyticsService = {
  track: (event, data = {}) => api.post('/analytics/track', { event, ...data }),
  sellerDashboard: (days = 30) => api.get('/analytics/seller-dashboard', { params: { days } }),
  topEvents: (days = 7) => api.get('/analytics/top-events', { params: { days } }),
  retention: () => api.get('/analytics/retention'),
  funnel: (steps, days = 7) =>
    api.get('/analytics/funnel', { params: { steps: steps?.join(','), days } }),
};

// API Keys Service
export const apiKeyService = {
  list: () => api.get('/api-keys'),
  create: (data) => api.post('/api-keys', data),
  rotate: (id) => api.post(`/api-keys/${id}/rotate`),
  delete: (id) => api.delete(`/api-keys/${id}`),
};

// Promotion Service (seller-side promoted listings)
export const promotionService = {
  slots: (categoryId, slots = 4) =>
    api.get('/promotions/slots', { params: { categoryId, slots } }),
  click: (promoId) => api.post('/promotions/click', { promoId }),
  create: (data) => api.post('/promotions', data),
  listMine: () => api.get('/promotions/mine'),
  setStatus: (id, status) => api.patch(`/promotions/${id}`, { status }),
};

// Motors Service — eBay Motors: vehicle listings, VIN lookups, parts-fit
export const motorsService = {
  searchVehicles: (params) => api.get('/motors/vehicles/search', { params }),
  getByVin: (vin) => api.get(`/motors/vehicles/vin/${vin}`),
  decodeVin: (vin) => api.get(`/motors/vehicles/vin/${vin}/decode`),
  getHistory: (vin) => api.get(`/motors/vehicles/vin/${vin}/history`),
  createVehicle: (data) => api.post('/motors/vehicles', data),
  getPartCompatibility: (productId) => api.get(`/motors/parts/${productId}/compatibility`),
  checkFitment: (params) => api.get('/motors/parts/check-compatibility', { params }),
  addPartCompatibility: (data) => api.post('/motors/parts/compatibility', data),
  requestInspection: (data) => api.post('/motors/inspections', data),
  getInspection: (vehicleId) => api.get(`/motors/inspections/${vehicleId}`),
};

// Authenticity Guarantee Service
export const authenticityService = {
  listCategories: () => api.get('/authenticity/categories'),
  checkRequired: (categoryName, itemValue) =>
    api.get('/authenticity/check-required', { params: { categoryName, itemValue } }),
  verify: (params) => api.get('/authenticity/verify', { params }),
  createRequest: (data) => api.post('/authenticity/requests', data),
  getRequest: (id) => api.get(`/authenticity/requests/${id}`),
  updateRequest: (id, data) => api.put(`/authenticity/requests/${id}`, data),
  listMine: (type = 'buyer') => api.get('/authenticity/user/requests', { params: { type } }),
};

export const bestMatchService = {
  qualityFactors: () => api.get('/best-match/quality-factors'),
  updateScore: (productId) => api.put(`/best-match/products/${productId}/quality-score`),
  batchUpdate: () => api.post('/best-match/batch-update'),
};

export const experimentService = {
  list: () => api.get('/experiments'),
  results: (key) => api.get(`/experiments/${key}/results`),
  assign: (key, sessionId) => api.get(`/experiments/assign/${key}`, { params: { sessionId } }),
  convert: (data) => api.post('/experiments/convert', data),
};

// Auction Chat Service
export const auctionChatService = {
  getChat: (productId, limit = 50) => api.get(`/auction-chat/${productId}`, { params: { limit } }),
  post: (productId, message) => api.post(`/auction-chat/${productId}`, { message }),
};

// Category Follows Service
export const categoryFollowService = {
  listMine: () => api.get('/category-follows/my'),
  getFeed: (params) => api.get('/category-follows/feed', { params }),
  isFollowing: (categoryId) => api.get(`/category-follows/is-following/${categoryId}`),
  follow: (categoryId) => api.post('/category-follows', { categoryId }),
  unfollow: (categoryId) => api.delete(`/category-follows/${categoryId}`),
};

// Low-stock Alerts Service
export const lowStockService = {
  list: () => api.get('/low-stock'),
  setThreshold: (productId, threshold) =>
    api.put(`/low-stock/${productId}`, { threshold }),
};

// Price History Service
export const priceHistoryService = {
  get: (productId, params) => api.get(`/price-history/${productId}`, { params }),
};

// Saved Search Alerts (admin trigger)
export const savedSearchAlertService = {
  triggerAll: (frequency) => api.post('/saved-searches/run-alerts', { frequency }),
};

// Image Search — accepts a File (multipart) OR { imageUrl }
export const imageSearchService = {
  byFile: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/image-search', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  byUrl: (imageUrl) => api.post('/image-search', { imageUrl }),
};

// AI Shopping Assistant
export const shoppingAssistantService = {
  chat: (messages) => api.post('/shopping-assistant/chat', { messages }),
};

// Wallet / store credit
export const walletService = {
  get: () => api.get('/wallet'),
  topUp: (amount, note) => api.post('/wallet/topup', { amount, note }),
};

// Referrals
export const referralService = {
  me: () => api.get('/referrals/me'),
};

// Flash sales
export const flashSaleService = {
  listActive: () => api.get('/flash-sales/active'),
  listMine: () => api.get('/flash-sales/mine'),
  create: (payload) => api.post('/flash-sales', payload),
  cancel: (id) => api.delete(`/flash-sales/${id}`),
};

// Seller follows + activity feed
export const followService = {
  status: (sellerId) => api.get(`/sellers/${sellerId}/follow-status`),
  follow: (sellerId) => api.post(`/sellers/${sellerId}/follow`),
  unfollow: (sellerId) => api.delete(`/sellers/${sellerId}/follow`),
  feed: (limit) => api.get('/feed', { params: { limit } }),
  myFollowing: () => api.get('/me/following'),
};

// Order timeline
export const orderTimelineService = {
  get: (orderId) => api.get(`/orders/${orderId}/timeline`),
};

// Trust score
export const trustScoreService = {
  get: (userId) => api.get(`/trust-score/${userId}`),
};

// Smart pricing (AI-assisted, server-side comparables)
export const smartPricingService = {
  suggest: ({ title, categoryId, condition }) =>
    api.post('/ai/smart-price', { title, categoryId, condition }),
};

// AI description
export const aiDescriptionService = {
  generate: ({ title, category, condition, price, features }) =>
    api.post('/ai/generate-description', { title, category, condition, price, features }),
};

// For-you feed
export const forYouService = {
  get: () => api.get('/recommendations/for-you'),
};

// Inventory forecast (seller)
export const inventoryForecastService = {
  get: () => api.get('/seller/inventory-forecast'),
};

// Group buys
export const groupBuyService = {
  listOpen: () => api.get('/group-buys'),
  get: (id) => api.get(`/group-buys/${id}`),
  create: (payload) => api.post('/group-buys', payload),
  commit: (id, quantity) => api.post(`/group-buys/${id}/commit`, { quantity }),
  withdraw: (id) => api.delete(`/group-buys/${id}/commit`),
};

export default api;
