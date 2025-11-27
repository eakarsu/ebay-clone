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
import Addresses from './pages/Addresses';
import PaymentMethods from './pages/PaymentMethods';

// New Feature Pages
import Collections from './pages/Collections';
import SellerStore from './pages/SellerStore';
import Rewards from './pages/Rewards';
import PaymentPlans from './pages/PaymentPlans';
import PriceAlerts from './pages/PriceAlerts';
import MyOffers from './pages/MyOffers';
import BulkUpload from './pages/BulkUpload';
import ScheduledListings from './pages/ScheduledListings';
import Invoices from './pages/Invoices';
import BidRetractions from './pages/BidRetractions';

// Footer/Info Pages
import Help from './pages/Help';
import Stores from './pages/Stores';
import About from './pages/About';
import Careers from './pages/Careers';
import Policies from './pages/Policies';
import Contact from './pages/Contact';
import SiteMap from './pages/SiteMap';
import Apps from './pages/Apps';
import Legal from './pages/Legal';
import Government from './pages/Government';

// Advanced Feature Pages
import PromotedListings from './pages/PromotedListings';
import SecondChanceOffer from './pages/SecondChanceOffer';
import AuthenticityGuarantee from './pages/AuthenticityGuarantee';
import Motors from './pages/Motors';
import CharityListings from './pages/CharityListings';
import ImportDuties from './pages/ImportDuties';
import SellingLimits from './pages/SellingLimits';
import VolumePricing from './pages/VolumePricing';

// New USER_GUIDE.md Feature Pages
import Membership from './pages/Membership';
import GSP from './pages/GSP';
import SellerPerformance from './pages/SellerPerformance';
import ProxyBidding from './pages/ProxyBidding';
import LocalPickup from './pages/LocalPickup';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';

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
                <Route path="/addresses" element={<Addresses />} />
                <Route path="/payment-methods" element={<PaymentMethods />} />

                {/* New Feature routes */}
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:id" element={<Collections />} />
                <Route path="/store/:username" element={<SellerStore />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/payment-plans" element={<PaymentPlans />} />
                <Route path="/price-alerts" element={<PriceAlerts />} />
                <Route path="/my-offers" element={<MyOffers />} />
                <Route path="/bulk-upload" element={<BulkUpload />} />
                <Route path="/scheduled-listings" element={<ScheduledListings />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/bid-retractions" element={<BidRetractions />} />

                {/* Static pages and redirects */}
                <Route path="/deals" element={<Search />} />
                <Route path="/categories" element={<Search />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/resolution" element={<Disputes />} />

                {/* New USER_GUIDE.md Feature routes */}
                <Route path="/membership" element={<Membership />} />
                <Route path="/gsp" element={<GSP />} />
                <Route path="/global-shipping" element={<GSP />} />
                <Route path="/seller-performance" element={<SellerPerformance />} />
                <Route path="/proxy-bidding" element={<ProxyBidding />} />
                <Route path="/my-bids" element={<ProxyBidding />} />
                <Route path="/local-pickup" element={<LocalPickup />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:conversationId" element={<Messages />} />

                {/* Help and info pages */}
                <Route path="/help" element={<Help />} />
                <Route path="/help/:topic" element={<Help />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/government" element={<Government />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/apps" element={<Apps />} />
                <Route path="/sitemap" element={<SiteMap />} />
                <Route path="/legal/:page" element={<Legal />} />

                {/* Advanced feature routes */}
                <Route path="/promoted-listings" element={<PromotedListings />} />
                <Route path="/second-chance-offers" element={<SecondChanceOffer />} />
                <Route path="/authenticity-guarantee" element={<AuthenticityGuarantee />} />
                <Route path="/motors" element={<Motors />} />
                <Route path="/charity" element={<CharityListings />} />
                <Route path="/import-duties" element={<ImportDuties />} />
                <Route path="/selling-limits" element={<SellingLimits />} />
                <Route path="/volume-pricing" element={<VolumePricing />} />

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
