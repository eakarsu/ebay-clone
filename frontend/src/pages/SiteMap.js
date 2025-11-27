import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Map } from '@mui/icons-material';

const siteMapSections = [
  {
    title: 'Buy',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Search', to: '/search' },
      { label: 'Categories', to: '/categories' },
      { label: 'Daily Deals', to: '/deals' },
      { label: 'Stores', to: '/stores' },
      { label: 'Watchlist', to: '/watchlist' },
      { label: 'My Offers', to: '/my-offers' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Start Selling', to: '/sell' },
      { label: 'Seller Dashboard', to: '/seller/dashboard' },
      { label: 'My Listings', to: '/my-listings' },
      { label: 'Bulk Upload', to: '/bulk-upload' },
      { label: 'Scheduled Listings', to: '/scheduled-listings' },
      { label: 'Seller Fees', to: '/help/fees' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', to: '/login' },
      { label: 'Register', to: '/register' },
      { label: 'My Profile', to: '/profile' },
      { label: 'My Orders', to: '/orders' },
      { label: 'Security Settings', to: '/security' },
      { label: 'Addresses', to: '/profile?tab=addresses' },
    ],
  },
  {
    title: 'Orders & Payments',
    links: [
      { label: 'My Orders', to: '/orders' },
      { label: 'Cart', to: '/cart' },
      { label: 'Checkout', to: '/checkout' },
      { label: 'Payment Plans', to: '/payment-plans' },
      { label: 'Invoices', to: '/invoices' },
    ],
  },
  {
    title: 'Help & Support',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'Buying Help', to: '/help/buying' },
      { label: 'Selling Help', to: '/help/selling' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Resolution Center', to: '/resolution' },
      { label: 'Returns', to: '/returns' },
      { label: 'Disputes', to: '/disputes' },
    ],
  },
  {
    title: 'About eBay',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Policies', to: '/policies' },
      { label: 'Government Relations', to: '/government' },
    ],
  },
  {
    title: 'Features',
    links: [
      { label: 'Price Alerts', to: '/price-alerts' },
      { label: 'Saved Searches', to: '/saved-searches' },
      { label: 'Collections', to: '/collections' },
      { label: 'Rewards', to: '/rewards' },
      { label: 'Bid Retractions', to: '/bid-retractions' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'User Agreement', to: '/legal/user-agreement' },
      { label: 'Privacy Policy', to: '/legal/privacy' },
      { label: 'Cookies Policy', to: '/legal/cookies' },
      { label: 'Accessibility', to: '/legal/accessibility' },
    ],
  },
];

const SiteMap = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Map sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Site Map
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find your way around eBay
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {siteMapSections.map((section) => (
          <Grid item xs={12} sm={6} md={3} key={section.title}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                {section.title}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense>
                {section.links.map((link) => (
                  <ListItem
                    key={link.label}
                    component={Link}
                    to={link.to}
                    sx={{
                      px: 0,
                      '&:hover': { bgcolor: 'grey.50' },
                    }}
                  >
                    <ListItemText
                      primary={link.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: { color: 'text.primary', '&:hover': { color: 'primary.main' } },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SiteMap;
