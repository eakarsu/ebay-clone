import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Paper,
  Alert,
} from '@mui/material';
import {
  Email,
  Phone,
  Chat,
  Help,
  Receipt,
  LocalShipping,
  Security,
  Gavel,
} from '@mui/icons-material';

const contactOptions = [
  { icon: <Chat />, label: 'Live Chat', description: 'Chat with a representative', available: '24/7' },
  { icon: <Phone />, label: 'Phone Support', description: '1-866-540-3229', available: 'Mon-Fri 5am-10pm PT' },
  { icon: <Email />, label: 'Email Support', description: 'Get a response within 24 hours', available: '24/7' },
];

const topics = [
  { value: 'order', label: 'Order Issues', icon: <Receipt /> },
  { value: 'shipping', label: 'Shipping & Delivery', icon: <LocalShipping /> },
  { value: 'returns', label: 'Returns & Refunds', icon: <Receipt /> },
  { value: 'account', label: 'Account & Security', icon: <Security /> },
  { value: 'selling', label: 'Selling on eBay', icon: <Receipt /> },
  { value: 'dispute', label: 'Disputes & Claims', icon: <Gavel /> },
  { value: 'other', label: 'Other', icon: <Help /> },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    topic: '',
    subject: '',
    message: '',
    email: '',
    orderNumber: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    setSubmitted(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Email sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Contact Us
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We're here to help. Choose the best way to reach us.
        </Typography>
      </Box>

      {/* Contact Options */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {contactOptions.map((option) => (
          <Grid item xs={12} md={4} key={option.label}>
            <Card sx={{ textAlign: 'center', height: '100%' }}>
              <CardContent>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{option.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {option.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {option.description}
                </Typography>
                <Typography variant="caption" color="primary">
                  {option.available}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Links */}
      <Paper sx={{ p: 3, mb: 6, bgcolor: 'grey.50' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Help Links
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}>
            <Button component={Link} to="/help" fullWidth variant="outlined">
              Help Center
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button component={Link} to="/resolution" fullWidth variant="outlined">
              Resolution Center
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button component={Link} to="/returns" fullWidth variant="outlined">
              Return an Item
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button component={Link} to="/orders" fullWidth variant="outlined">
              Track Order
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button component={Link} to="/profile" fullWidth variant="outlined">
              Account Settings
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button component={Link} to="/policies" fullWidth variant="outlined">
              Policies
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Contact Form */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Send Us a Message
        </Typography>

        {submitted ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Thank you for contacting us! We'll respond within 24 hours.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required
                >
                  {topics.map((topic) => (
                    <MenuItem key={topic.value} value={topic.value}>
                      {topic.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Order Number (optional)"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  placeholder="e.g., 123-456-789"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large">
                  Send Message
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default Contact;
