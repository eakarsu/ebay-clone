import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Grid, Typography, Divider, IconButton } from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  YouTube,
} from '@mui/icons-material';

const Footer = () => {
  const footerLinks = {
    'Buy': [
      { label: 'Registration', to: '/register' },
      { label: 'Bidding & buying help', to: '/help/buying' },
      { label: 'Stores', to: '/stores' },
      { label: 'Seasonal Sales', to: '/deals' },
    ],
    'Sell': [
      { label: 'Start selling', to: '/sell' },
      { label: 'How to sell', to: '/help/selling' },
      { label: 'Seller Center', to: '/seller/dashboard' },
      { label: 'Seller fees', to: '/help/fees' },
    ],
    'Tools & Apps': [
      { label: 'Mobile apps', to: '/apps' },
      { label: 'Site map', to: '/sitemap' },
    ],
    'About eBay': [
      { label: 'Company info', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Policies', to: '/policies' },
      { label: 'Government relations', to: '/government' },
    ],
    'Help & Contact': [
      { label: 'Contact us', to: '/contact' },
      { label: 'Help center', to: '/help' },
      { label: 'Resolution Center', to: '/resolution' },
    ],
  };

  return (
    <Box component="footer" sx={{ bgcolor: 'grey.100', mt: 'auto' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {Object.entries(footerLinks).map(([category, links]) => (
            <Grid item xs={6} sm={4} md={2} key={category}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                {category}
              </Typography>
              {links.map((link) => (
                <Typography
                  key={link.label}
                  component={Link}
                  to={link.to}
                  variant="body2"
                  sx={{
                    display: 'block',
                    color: 'text.secondary',
                    textDecoration: 'none',
                    mb: 1,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Grid>
          ))}
          <Grid item xs={12} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Stay connected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <Facebook />
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <Twitter />
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <Instagram />
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <YouTube />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Copyright © 1995-2024 eBay Clone Inc. All Rights Reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {['Accessibility', 'User Agreement', 'Privacy', 'Cookies', 'AdChoice'].map((item) => (
              <Typography
                key={item}
                component={Link}
                to={`/legal/${item.toLowerCase().replace(' ', '-')}`}
                variant="body2"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {item}
              </Typography>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
