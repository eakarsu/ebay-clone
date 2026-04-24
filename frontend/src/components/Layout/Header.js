import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  InputBase,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Container,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Favorite as WatchlistIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  Sell as SellIcon,
  LocalOffer as DealsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Receipt as OrdersIcon,
  Message as MessageIcon,
  Gavel as BidsIcon,
  CardMembership as MembershipIcon,
  TrendingUp as PerformanceIcon,
  Public as GlobalIcon,
  LocationOn as PickupIcon,
  AutoAwesome as AIIcon,
  LiveTv as LiveIcon,
  Security as VaultIcon,
  Group as TeamIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useThemeMode } from '../../context/ThemeContext';
import { getImageUrl } from '../../services/api';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { mode, toggleMode } = useThemeMode();

  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live search with debounce - navigates to search page as user types
  useEffect(() => {
    // Don't trigger on empty query or if already on search page with same query
    if (!searchQuery.trim()) return;

    const params = new URLSearchParams(location.search);
    const currentQuery = params.get('q');
    if (location.pathname === '/search' && currentQuery === searchQuery) return;

    const debounceTimer = setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleCloseMenu();
    navigate('/');
  };

  return (
    <>
      {/* Top bar */}
      <AppBar position="static" sx={{ bgcolor: 'background.paper', color: 'text.primary' }} elevation={0}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, fontSize: '0.75rem' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {user ? (
                <Typography variant="body2">Hi, {user.firstName || user.username}!</Typography>
              ) : (
                <>
                  <Typography variant="body2">
                    Hi! <Link to="/login" style={{ color: '#3665f3', textDecoration: 'none' }}>Sign in</Link> or{' '}
                    <Link to="/register" style={{ color: '#3665f3', textDecoration: 'none' }}>register</Link>
                  </Typography>
                </>
              )}
              <Link to="/deals" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2">Daily Deals</Typography>
              </Link>
              <Link to="/flash-sales" style={{ color: '#e53238', textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Flash Sales</Typography>
              </Link>
              <Link to="/group-buys" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2">Group Buys</Typography>
              </Link>
              <Link to="/live" style={{ color: '#e53238', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LiveIcon sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>eBay Live</Typography>
              </Link>
              <Link to="/help" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2">Help & Contact</Typography>
              </Link>
              <Link to="/ai-features" style={{ color: '#3665f3', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AIIcon sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>AI Features</Typography>
              </Link>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link to="/sell" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2">Sell</Typography>
              </Link>
              {user && (
                <Link to="/watchlist" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Typography variant="body2">Watchlist</Typography>
                </Link>
              )}
              {user && (
                <Link to="/orders" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Typography variant="body2">My Orders</Typography>
                </Link>
              )}
            </Box>
          </Box>
        </Container>
      </AppBar>

      {/* Main header */}
      <AppBar position="sticky" sx={{ bgcolor: 'background.paper', color: 'text.primary' }} elevation={1}>
        <Container maxWidth="xl">
          <Toolbar sx={{ py: 1 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileMenuOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#e53238',
                  mr: 0.5,
                }}
              >
                e
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0064d2', mr: 0.5 }}>
                B
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f5af02', mr: 0.5 }}>
                a
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#86b817' }}>
                y
              </Typography>
            </Link>

            {/* Search */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                flexGrow: 1,
                mx: 3,
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'grey.100',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'grey.300',
                '&:focus-within': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <InputBase
                placeholder="Search for anything... (live)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1, px: 2, py: 1 }}
              />
              <IconButton
                component={Link}
                to="/image-search"
                aria-label="search by photo"
                sx={{ mx: 0.5 }}
              >
                <PhotoCameraIcon />
              </IconButton>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  borderRadius: '0 6px 6px 0',
                  px: 3,
                  py: 1.2,
                  bgcolor: '#3665f3',
                  '&:hover': { bgcolor: '#2a4dc4' },
                }}
              >
                <SearchIcon />
              </Button>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={toggleMode} aria-label="toggle dark mode">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <LanguageSwitcher />
              {user ? (
                <>
                  <IconButton component={Link} to="/messages">
                    <Badge badgeContent={2} color="error">
                      <MessageIcon />
                    </Badge>
                  </IconButton>
                  <IconButton component={Link} to="/notifications">
                    <Badge badgeContent={3} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                  <IconButton component={Link} to="/cart">
                    <Badge badgeContent={cart.summary.itemCount} color="error">
                      <CartIcon />
                    </Badge>
                  </IconButton>
                  <IconButton onClick={handleUserMenu}>
                    <Avatar
                      src={getImageUrl(user.avatarUrl)}
                      sx={{ width: 32, height: 32 }}
                    >
                      {user.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                    PaperProps={{ sx: { width: 220 } }}
                  >
                    <MenuItem component={Link} to="/profile" onClick={handleCloseMenu}>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText>My Profile</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/orders" onClick={handleCloseMenu}>
                      <ListItemIcon><OrdersIcon /></ListItemIcon>
                      <ListItemText>Purchases</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/watchlist" onClick={handleCloseMenu}>
                      <ListItemIcon><WatchlistIcon /></ListItemIcon>
                      <ListItemText>Watchlist</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/my-offers" onClick={handleCloseMenu}>
                      <ListItemIcon><DealsIcon /></ListItemIcon>
                      <ListItemText>My Offers</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/my-coupons" onClick={handleCloseMenu}>
                      <ListItemIcon><DealsIcon /></ListItemIcon>
                      <ListItemText>My Coupons</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/wallet" onClick={handleCloseMenu}>
                      <ListItemIcon><DealsIcon /></ListItemIcon>
                      <ListItemText>Wallet</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/referrals" onClick={handleCloseMenu}>
                      <ListItemIcon><DealsIcon /></ListItemIcon>
                      <ListItemText>Refer a Friend</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/my-bids" onClick={handleCloseMenu}>
                      <ListItemIcon><BidsIcon /></ListItemIcon>
                      <ListItemText>My Bids</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/membership" onClick={handleCloseMenu}>
                      <ListItemIcon><MembershipIcon /></ListItemIcon>
                      <ListItemText>Membership</ListItemText>
                    </MenuItem>
                    <MenuItem component={Link} to="/vault" onClick={handleCloseMenu}>
                      <ListItemIcon><VaultIcon /></ListItemIcon>
                      <ListItemText>Vault</ListItemText>
                    </MenuItem>
                    {user.isSeller && (
                      <>
                        <Divider />
                        <MenuItem component={Link} to="/seller/dashboard" onClick={handleCloseMenu}>
                          <ListItemIcon><DashboardIcon /></ListItemIcon>
                          <ListItemText>Seller Dashboard</ListItemText>
                        </MenuItem>
                        <MenuItem component={Link} to="/my-listings" onClick={handleCloseMenu}>
                          <ListItemIcon><InventoryIcon /></ListItemIcon>
                          <ListItemText>My Listings</ListItemText>
                        </MenuItem>
                        <MenuItem component={Link} to="/seller/coupons" onClick={handleCloseMenu}>
                          <ListItemIcon><DealsIcon /></ListItemIcon>
                          <ListItemText>Coupon Codes</ListItemText>
                        </MenuItem>
                        <MenuItem component={Link} to="/orders?type=sales" onClick={handleCloseMenu}>
                          <ListItemIcon><OrdersIcon /></ListItemIcon>
                          <ListItemText>Sales</ListItemText>
                        </MenuItem>
                        <MenuItem component={Link} to="/seller-performance" onClick={handleCloseMenu}>
                          <ListItemIcon><PerformanceIcon /></ListItemIcon>
                          <ListItemText>Seller Performance</ListItemText>
                        </MenuItem>
                        <MenuItem component={Link} to="/gsp" onClick={handleCloseMenu}>
                          <ListItemIcon><GlobalIcon /></ListItemIcon>
                          <ListItemText>Global Shipping</ListItemText>
                        </MenuItem>
                        <MenuItem component={Link} to="/team" onClick={handleCloseMenu}>
                          <ListItemIcon><TeamIcon /></ListItemIcon>
                          <ListItemText>Team Access</ListItemText>
                        </MenuItem>
                      </>
                    )}
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon><LogoutIcon /></ListItemIcon>
                      <ListItemText>Sign Out</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    to="/login"
                    variant="outlined"
                    sx={{ borderRadius: 5, textTransform: 'none' }}
                  >
                    Sign in
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    sx={{
                      borderRadius: 5,
                      textTransform: 'none',
                      bgcolor: '#3665f3',
                      '&:hover': { bgcolor: '#2a4dc4' },
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }}>
          <List>
            <ListItem button component={Link} to="/" onClick={() => setMobileMenuOpen(false)}>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button component={Link} to="/categories" onClick={() => setMobileMenuOpen(false)}>
              <ListItemText primary="Categories" />
            </ListItem>
            <ListItem button component={Link} to="/deals" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><DealsIcon /></ListItemIcon>
              <ListItemText primary="Daily Deals" />
            </ListItem>
            <ListItem button component={Link} to="/live" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><LiveIcon sx={{ color: '#e53238' }} /></ListItemIcon>
              <ListItemText primary="eBay Live" primaryTypographyProps={{ sx: { color: '#e53238', fontWeight: 600 } }} />
            </ListItem>
            <ListItem button component={Link} to="/sell" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><SellIcon /></ListItemIcon>
              <ListItemText primary="Sell" />
            </ListItem>
            <ListItem button component={Link} to="/vault" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><VaultIcon /></ListItemIcon>
              <ListItemText primary="Vault" />
            </ListItem>
            <Divider />
            <ListItem button component={Link} to="/messages" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><MessageIcon /></ListItemIcon>
              <ListItemText primary="Messages" />
            </ListItem>
            <ListItem button component={Link} to="/notifications" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><NotificationsIcon /></ListItemIcon>
              <ListItemText primary="Notifications" />
            </ListItem>
            <ListItem button component={Link} to="/my-bids" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><BidsIcon /></ListItemIcon>
              <ListItemText primary="My Bids" />
            </ListItem>
            <ListItem button component={Link} to="/membership" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><MembershipIcon /></ListItemIcon>
              <ListItemText primary="Membership" />
            </ListItem>
            <ListItem button component={Link} to="/local-pickup" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><PickupIcon /></ListItemIcon>
              <ListItemText primary="Local Pickup" />
            </ListItem>
            <ListItem button component={Link} to="/ai-features" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><AIIcon color="primary" /></ListItemIcon>
              <ListItemText primary="AI Features" />
            </ListItem>
            <Divider />
            <ListItem button component={Link} to="/help" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><HelpIcon /></ListItemIcon>
              <ListItemText primary="Help & Contact" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
