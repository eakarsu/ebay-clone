import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  PhoneIphone,
  Apple,
  Android,
  ShoppingCart,
  CameraAlt,
  Notifications,
  TrendingUp,
  Security,
  Speed,
  QrCode,
} from '@mui/icons-material';

const features = [
  { icon: <CameraAlt />, title: 'Snap & List', description: 'Take photos and list items in seconds' },
  { icon: <Notifications />, title: 'Instant Alerts', description: 'Get notified about bids, offers, and deals' },
  { icon: <TrendingUp />, title: 'Price Tracking', description: 'Monitor price changes on your watchlist' },
  { icon: <Security />, title: 'Secure Payments', description: 'Pay safely with Apple Pay or Google Pay' },
  { icon: <Speed />, title: 'Fast Checkout', description: 'One-tap checkout with saved info' },
  { icon: <ShoppingCart />, title: 'Easy Shopping', description: 'Browse, bid, and buy on the go' },
];

const Apps = () => {
  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <PhoneIphone sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            eBay Mobile Apps
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
            Shop, sell, and save wherever you go
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="inherit"
              size="large"
              startIcon={<Apple />}
              sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: 'grey.100' } }}
            >
              App Store
            </Button>
            <Button
              variant="contained"
              color="inherit"
              size="large"
              startIcon={<Android />}
              sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Google Play
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          Everything You Need in Your Pocket
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={4} key={feature.title}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* QR Download */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="md">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Download the App
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Scan the QR code with your phone's camera to download the eBay app instantly.
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><Apple /></ListItemIcon>
                  <ListItemText primary="iOS 14.0 or later" secondary="iPhone, iPad, iPod touch" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Android /></ListItemIcon>
                  <ListItemText primary="Android 8.0 or later" secondary="Most Android devices" />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
              <Paper sx={{ p: 4, display: 'inline-block' }}>
                <QrCode sx={{ fontSize: 200, color: 'grey.800' }} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Scan to download
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* App Stats */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                4.8
              </Typography>
              <Typography color="text.secondary">App Store Rating</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                100M+
              </Typography>
              <Typography color="text.secondary">Downloads</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                #1
              </Typography>
              <Typography color="text.secondary">Shopping App</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                24/7
              </Typography>
              <Typography color="text.secondary">Access</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Apps;
