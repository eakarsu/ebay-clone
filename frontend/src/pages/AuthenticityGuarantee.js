import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  VerifiedUser,
  CheckCircle,
  LocalShipping,
  Search,
  Shield,
  ExpandMore,
  Watch,
  DiamondOutlined,
  Checkroom,
  SportsBasketball,
  Category,
  ArrowForward,
} from '@mui/icons-material';

const categories = [
  {
    id: 'watches',
    name: 'Watches',
    icon: <Watch />,
    description: 'Luxury watches over $2,000',
    brands: ['Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet', 'Cartier', 'IWC'],
    minValue: 2000,
  },
  {
    id: 'sneakers',
    name: 'Sneakers',
    icon: <SportsBasketball />,
    description: 'All sneakers over $100',
    brands: ['Nike', 'Jordan', 'Adidas Yeezy', 'New Balance', 'Converse'],
    minValue: 100,
  },
  {
    id: 'handbags',
    name: 'Handbags',
    icon: <Checkroom />,
    description: 'Designer handbags over $500',
    brands: ['Louis Vuitton', 'Chanel', 'Gucci', 'Hermès', 'Prada', 'Dior'],
    minValue: 500,
  },
  {
    id: 'jewelry',
    name: 'Fine Jewelry',
    icon: <DiamondOutlined />,
    description: 'Fine jewelry over $500',
    brands: ['Tiffany & Co.', 'Cartier', 'Van Cleef & Arpels', 'Bvlgari', 'David Yurman'],
    minValue: 500,
  },
];

const steps = [
  {
    label: 'Purchase',
    description: 'Buy an eligible item with the Authenticity Guarantee badge',
  },
  {
    label: 'Seller Ships',
    description: 'Seller ships the item to our authentication center',
  },
  {
    label: 'Expert Inspection',
    description: 'Our trained authenticators verify the item\'s authenticity',
  },
  {
    label: 'Secure Packaging',
    description: 'Authenticated items receive an official Authenticity Guarantee tag',
  },
  {
    label: 'Delivery',
    description: 'Your verified authentic item is shipped directly to you',
  },
];

const faqs = [
  {
    question: 'What is Authenticity Guarantee?',
    answer: 'Authenticity Guarantee is eBay\'s program that verifies the authenticity of eligible items before they reach the buyer. Items are inspected by trained authenticators at our dedicated authentication centers.',
  },
  {
    question: 'Which items are eligible?',
    answer: 'Eligible items include luxury watches over $2,000, sneakers over $100, designer handbags over $500, and fine jewelry over $500 from select brands.',
  },
  {
    question: 'How much does authentication cost?',
    answer: 'Authentication is free for buyers! The service is included at no additional cost for eligible items.',
  },
  {
    question: 'What happens if an item fails authentication?',
    answer: 'If an item fails authentication, it will be returned to the seller and you will receive a full refund. The seller may face account restrictions.',
  },
  {
    question: 'How long does authentication take?',
    answer: 'Authentication typically takes 2-4 business days after the item arrives at our authentication center. Total delivery time is usually 7-10 business days.',
  },
  {
    question: 'Can I return an authenticated item?',
    answer: 'Yes, authenticated items can be returned within 30 days. The item must be returned with the original Authenticity Guarantee tag attached.',
  },
];

const AuthenticityGuarantee = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(null);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'grey.900',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <VerifiedUser sx={{ fontSize: 80, mb: 2, color: 'primary.light' }} />
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Authenticity Guarantee
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
            Shop with confidence. Every eligible item is verified authentic.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip
              icon={<CheckCircle />}
              label="Free Authentication"
              sx={{ bgcolor: 'white', color: 'grey.900' }}
            />
            <Chip
              icon={<Shield />}
              label="100% Authentic"
              sx={{ bgcolor: 'white', color: 'grey.900' }}
            />
            <Chip
              icon={<LocalShipping />}
              label="Secure Shipping"
              sx={{ bgcolor: 'white', color: 'grey.900' }}
            />
          </Box>
        </Container>
      </Box>

      {/* How It Works */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          How It Works
        </Typography>
        <Stepper orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label} active={true}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography color="text.secondary">{step.description}</Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Container>

      {/* Categories */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
            Eligible Categories
          </Typography>
          <Tabs
            value={selectedCategory}
            onChange={(e, v) => setSelectedCategory(v)}
            centered
            sx={{ mb: 4 }}
          >
            {categories.map((cat) => (
              <Tab key={cat.id} icon={cat.icon} label={cat.name} />
            ))}
          </Tabs>

          <Paper sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {categories[selectedCategory].name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {categories[selectedCategory].description}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Minimum Value</Typography>
                  <Chip
                    label={`$${categories[selectedCategory].minValue.toLocaleString()}+`}
                    color="primary"
                  />
                </Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Eligible Brands</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {categories[selectedCategory].brands.map((brand) => (
                    <Chip key={brand} label={brand} variant="outlined" size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 4,
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <VerifiedUser sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Look for the Badge
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Eligible items display the Authenticity Guarantee badge on the listing page
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* Benefits */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          Benefits
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 4 }}>
                <Search sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Expert Inspection
                </Typography>
                <Typography color="text.secondary">
                  Every item is carefully examined by trained authenticators using industry-leading
                  verification methods and technology.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 4 }}>
                <Shield sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Money Back Guarantee
                </Typography>
                <Typography color="text.secondary">
                  If your item doesn't pass authentication, you'll receive a full refund.
                  Shop with complete confidence.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 4 }}>
                <LocalShipping sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Secure Delivery
                </Typography>
                <Typography color="text.secondary">
                  Authenticated items are securely packaged with tamper-evident tags and
                  shipped with full insurance.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* FAQs */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              expanded={expandedFaq === index}
              onChange={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* CTA */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Ready to Shop Authentic?
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Browse our selection of verified authentic items
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/search?authenticity=true&category=watches"
            endIcon={<ArrowForward />}
          >
            Shop Watches
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/search?authenticity=true&category=sneakers"
            endIcon={<ArrowForward />}
          >
            Shop Sneakers
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/search?authenticity=true&category=handbags"
            endIcon={<ArrowForward />}
          >
            Shop Handbags
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthenticityGuarantee;
