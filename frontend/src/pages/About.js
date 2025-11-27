import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Divider,
} from '@mui/material';
import {
  Public,
  People,
  TrendingUp,
  Security,
  Recycling,
  Diversity3,
} from '@mui/icons-material';

const stats = [
  { value: '150M+', label: 'Active buyers worldwide' },
  { value: '1.7B', label: 'Listings' },
  { value: '190', label: 'Markets' },
  { value: '$74B', label: 'GMV in 2023' },
];

const values = [
  {
    icon: <People sx={{ fontSize: 40 }} />,
    title: 'People First',
    description: 'We believe in the power of connection. Our platform brings buyers and sellers together from around the world.',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 40 }} />,
    title: 'Innovation',
    description: 'We continuously evolve our technology to provide the best marketplace experience possible.',
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Trust & Safety',
    description: 'We\'re committed to creating a safe, fair marketplace with buyer and seller protections.',
  },
  {
    icon: <Recycling sx={{ fontSize: 40 }} />,
    title: 'Sustainability',
    description: 'We promote sustainable commerce through pre-owned items and eco-friendly shipping options.',
  },
  {
    icon: <Diversity3 sx={{ fontSize: 40 }} />,
    title: 'Diversity',
    description: 'We celebrate diversity and inclusion in our workforce and seller community.',
  },
  {
    icon: <Public sx={{ fontSize: 40 }} />,
    title: 'Global Impact',
    description: 'We empower entrepreneurs worldwide to build businesses and reach global audiences.',
  },
];

const About = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
            About eBay
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9 }}>
            Connecting millions of buyers and sellers around the world
          </Typography>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Our Story */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
            Our Story
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Founded in 1995, eBay was one of the first companies to create an online marketplace
            that connected buyers and sellers from around the world. What started as a simple
            auction site has grown into a global commerce platform.
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Today, we're more than just an auction site. We're a place where passionate collectors
            find rare treasures, where entrepreneurs build thriving businesses, and where everyday
            people discover great deals on the things they need.
          </Typography>
          <Typography variant="body1">
            Our mission is to be the world's most accessible and inclusive marketplace, where
            anyone can sell and anyone can find what they're looking for.
          </Typography>
        </Container>
      </Box>

      {/* Our Values */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          Our Values
        </Typography>
        <Grid container spacing={3}>
          {values.map((value) => (
            <Grid item xs={12} sm={6} md={4} key={value.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{value.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Join Our Community
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.8 }}>
            Whether you're looking to buy, sell, or build a business, there's a place for you on eBay.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" color="primary" component={Link} to="/register" size="large">
              Sign Up
            </Button>
            <Button variant="outlined" color="inherit" component={Link} to="/careers" size="large">
              View Careers
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default About;
