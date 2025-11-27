import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Policy,
  Gavel,
  Security,
  Block,
  LocalShipping,
  Payment,
  Undo,
  Copyright,
  VerifiedUser,
} from '@mui/icons-material';

const policies = [
  {
    icon: <Gavel />,
    title: 'User Agreement',
    description: 'Terms and conditions for using eBay',
    link: '/legal/user-agreement',
  },
  {
    icon: <Security />,
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your data',
    link: '/legal/privacy',
  },
  {
    icon: <Block />,
    title: 'Prohibited Items',
    description: 'Items that cannot be sold on eBay',
    link: '/policies/prohibited',
  },
  {
    icon: <LocalShipping />,
    title: 'Shipping Policies',
    description: 'Guidelines for shipping and handling',
    link: '/policies/shipping',
  },
  {
    icon: <Payment />,
    title: 'Payment Policies',
    description: 'Accepted payment methods and guidelines',
    link: '/policies/payment',
  },
  {
    icon: <Undo />,
    title: 'Returns & Refunds',
    description: 'Return policy requirements for sellers',
    link: '/policies/returns',
  },
  {
    icon: <Copyright />,
    title: 'Intellectual Property',
    description: 'Copyright and trademark policies',
    link: '/policies/ip',
  },
  {
    icon: <VerifiedUser />,
    title: 'Buyer Protection',
    description: 'Your rights as a buyer on eBay',
    link: '/policies/buyer-protection',
  },
];

const sellerStandards = [
  'Ship items within handling time',
  'Provide accurate tracking information',
  'Respond to buyer messages within 24 hours',
  'Maintain low defect rate (< 2%)',
  'Keep late shipment rate below 3%',
  'Honor your return policy',
];

const buyerGuidelines = [
  'Pay for items within 4 days',
  'Communicate respectfully with sellers',
  'Leave honest feedback after transactions',
  'Report issues through Resolution Center',
  'Read listing descriptions carefully',
  'Check seller ratings before buying',
];

const Policies = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Policy sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          eBay Policies
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Our policies help create a safe and fair marketplace for everyone
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {policies.map((policy) => (
          <Grid item xs={12} sm={6} md={3} key={policy.title}>
            <Card
              component={Link}
              to={policy.link}
              sx={{
                height: '100%',
                textDecoration: 'none',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{policy.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {policy.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {policy.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Seller Standards
              </Typography>
              <List>
                {sellerStandards.map((standard, i) => (
                  <ListItem key={i}>
                    <ListItemIcon>
                      <VerifiedUser color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={standard} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Buyer Guidelines
              </Typography>
              <List>
                {buyerGuidelines.map((guideline, i) => (
                  <ListItem key={i}>
                    <ListItemIcon>
                      <VerifiedUser color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={guideline} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Policies;
