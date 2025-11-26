import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

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

export default api;
