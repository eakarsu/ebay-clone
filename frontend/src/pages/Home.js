import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  ArrowForward,
  LocalOffer,
  Verified,
  LocalShipping,
} from '@mui/icons-material';
import { productService, categoryService } from '../services/api';
import ProductGrid from '../components/Products/ProductGrid';

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featuredRes, recentRes] = await Promise.all([
          categoryService.getAll(),
          productService.getAll({ limit: 4, sortBy: 'view_count', sortOrder: 'desc' }),
          productService.getAll({ limit: 8, sortBy: 'created_at', sortOrder: 'desc' }),
        ]);

        setCategories(catRes.data.categories);
        setFeaturedProducts(featuredRes.data.products);
        setRecentProducts(recentRes.data.products);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heroBanners = [
    {
      title: 'Up to 60% off tech',
      subtitle: 'The best deals on electronics',
      image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200',
      link: '/category/electronics',
      color: '#f5f5f5',
    },
  ];

  return (
    <Box>
      {/* Hero Banner */}
      <Box
        sx={{
          bgcolor: heroBanners[0].color,
          py: { xs: 4, md: 6 },
          mb: 4,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                {heroBanners[0].title}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                {heroBanners[0].subtitle}
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => navigate(heroBanners[0].link)}
                sx={{
                  borderRadius: 5,
                  px: 4,
                  bgcolor: '#3665f3',
                  '&:hover': { bgcolor: '#2a4dc4' },
                }}
              >
                Shop now
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={heroBanners[0].image}
                alt="Hero"
                sx={{
                  width: '100%',
                  height: 300,
                  objectFit: 'cover',
                  borderRadius: 2,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Features */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            { icon: <LocalOffer />, title: 'Daily Deals', desc: 'All discounts in one place' },
            { icon: <Verified />, title: 'eBay Money Back', desc: 'Get the item you ordered or your money back' },
            { icon: <LocalShipping />, title: 'Free Shipping', desc: 'On millions of items' },
          ].map((feature, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }} elevation={0}>
                <Box sx={{ color: 'primary.main' }}>{feature.icon}</Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.desc}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Categories */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Explore Popular Categories
            </Typography>
            <Button component={Link} to="/categories" endIcon={<ArrowForward />}>
              See all
            </Button>
          </Box>
          <Grid container spacing={2}>
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <Grid item xs={6} sm={4} md={2} key={idx}>
                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))
              : categories.slice(0, 6).map((category) => (
                  <Grid item xs={6} sm={4} md={2} key={category.id}>
                    <Card
                      component={Link}
                      to={`/category/${category.slug}`}
                      sx={{
                        textDecoration: 'none',
                        textAlign: 'center',
                        p: 2,
                        '&:hover': { boxShadow: 4 },
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        <Typography variant="h5">
                          {category.name.charAt(0)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {category.name}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
          </Grid>
        </Box>

        {/* Featured Products */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Trending Now
            </Typography>
            <Button component={Link} to="/search?sortBy=view_count" endIcon={<ArrowForward />}>
              See all
            </Button>
          </Box>
          <ProductGrid products={featuredProducts} loading={loading} />
        </Box>

        {/* Recently Listed */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Recently Listed
            </Typography>
            <Button component={Link} to="/search?sortBy=created_at" endIcon={<ArrowForward />}>
              See all
            </Button>
          </Box>
          <ProductGrid products={recentProducts} loading={loading} />
        </Box>

        {/* Selling CTA */}
        <Paper
          sx={{
            p: 4,
            mb: 6,
            bgcolor: '#f7f7f7',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Start selling today
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Turn your unused items into cash. List for free and reach millions of buyers.
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/sell"
            variant="contained"
            size="large"
            sx={{
              borderRadius: 5,
              px: 4,
              bgcolor: '#3665f3',
              '&:hover': { bgcolor: '#2a4dc4' },
            }}
          >
            Start selling
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home;
