import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Category from './pages/Category';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Watchlist from './pages/Watchlist';
import SellItem from './pages/SellItem';
import SellerDashboard from './pages/SellerDashboard';
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Disputes from './pages/Disputes';
import Returns from './pages/Returns';
import SecuritySettings from './pages/SecuritySettings';
import SavedSearches from './pages/SavedSearches';
import Profile from './pages/Profile';
import MyListings from './pages/MyListings';

// Material UI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3665f3',
      light: '#6b8ff7',
      dark: '#2a4dc4',
    },
    secondary: {
      main: '#e53238',
    },
    success: {
      main: '#86b817',
    },
    warning: {
      main: '#f5af02',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Main routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/sell" element={<SellItem />} />
                <Route path="/sell/edit/:id" element={<SellItem />} />

                {/* Auth routes */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Seller routes */}
                <Route path="/seller/dashboard" element={<SellerDashboard />} />
                <Route path="/seller/orders" element={<SellerDashboard />} />
                <Route path="/my-listings" element={<MyListings />} />

                {/* Admin routes */}
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/*" element={<AdminPanel />} />

                {/* User account routes */}
                <Route path="/disputes" element={<Disputes />} />
                <Route path="/disputes/:id" element={<Disputes />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/returns/:id" element={<Returns />} />
                <Route path="/security" element={<SecuritySettings />} />
                <Route path="/saved-searches" element={<SavedSearches />} />

                {/* Static pages and redirects */}
                <Route path="/deals" element={<Search />} />
                <Route path="/categories" element={<Search />} />
                <Route path="/notifications" element={<Orders />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/resolution" element={<Disputes />} />

                {/* Help and info pages - redirect to home for now */}
                <Route path="/help" element={<Home />} />
                <Route path="/help/*" element={<Home />} />
                <Route path="/about" element={<Home />} />
                <Route path="/contact" element={<Home />} />
                <Route path="/policies" element={<Home />} />
                <Route path="/careers" element={<Home />} />
                <Route path="/government" element={<Home />} />
                <Route path="/stores" element={<Search />} />
                <Route path="/apps" element={<Home />} />
                <Route path="/sitemap" element={<Home />} />
                <Route path="/legal/*" element={<Home />} />

                {/* Catch-all route */}
                <Route path="*" element={<Home />} />
              </Routes>
            </Layout>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
