import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
} from '@mui/material';
import {
  AccountBalance,
  Gavel,
  Security,
  Public,
  VerifiedUser,
  Policy,
} from '@mui/icons-material';

const initiatives = [
  {
    icon: <Gavel sx={{ fontSize: 40 }} />,
    title: 'Regulatory Compliance',
    description: 'We work closely with regulators worldwide to ensure our marketplace meets all legal requirements.',
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Consumer Protection',
    description: 'Partnering with government agencies to protect buyers and sellers from fraud and unsafe products.',
  },
  {
    icon: <Public sx={{ fontSize: 40 }} />,
    title: 'Trade Policy',
    description: 'Advocating for policies that enable small businesses to access global markets.',
  },
  {
    icon: <VerifiedUser sx={{ fontSize: 40 }} />,
    title: 'Intellectual Property',
    description: 'Collaborating with rights holders and agencies to combat counterfeits.',
  },
];

const Government = () => {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 10 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <AccountBalance sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Government Relations
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.8 }}>
            Building trust through transparency and collaboration
          </Typography>
        </Container>
      </Box>

      {/* Our Approach */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          Our Approach
        </Typography>
        <Grid container spacing={4}>
          {initiatives.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.title}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Policy Priorities */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
            Policy Priorities
          </Typography>
          <Paper sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Supporting Small Businesses
              </Typography>
              <Typography color="text.secondary">
                We advocate for policies that help entrepreneurs and small businesses thrive in the digital economy,
                including tax simplification, reduced regulatory burden, and access to global markets.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Platform Accountability
              </Typography>
              <Typography color="text.secondary">
                We support balanced approaches to platform liability that protect consumers while allowing innovation
                and maintaining the diversity of voices on our platform.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Data Privacy
              </Typography>
              <Typography color="text.secondary">
                We support comprehensive federal privacy legislation that protects consumers while providing clear
                rules for businesses to follow.
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Sustainable Commerce
              </Typography>
              <Typography color="text.secondary">
                We promote policies that encourage the circular economy, including incentives for buying and selling
                pre-owned items to reduce waste.
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Contact */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Get in Touch
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          For government and regulatory inquiries, please contact our Government Relations team.
        </Typography>
        <Button variant="contained" size="large" href="mailto:government@ebay.com">
          Contact Government Relations
        </Button>
      </Container>
    </Box>
  );
};

export default Government;
