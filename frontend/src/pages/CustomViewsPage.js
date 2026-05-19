import React from 'react';
import { Container, Grid, Typography, Box, Stack } from '@mui/material';
import ListingSalesChart from '../components/CustomViews/ListingSalesChart';
import CategoryHeatmap from '../components/CustomViews/CategoryHeatmap';
import ShippingLabelPdf from '../components/CustomViews/ShippingLabelPdf';
import ListingRulesEditor from '../components/CustomViews/ListingRulesEditor';

export default function CustomViewsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }} data-testid="custom-views-page">
      <Stack spacing={1} mb={2}>
        <Typography variant="h4">Seller Views</Typography>
        <Typography variant="body2" color="text.secondary">
          Custom seller-focused dashboards: sales trends, category heatmap, shipping label/invoice PDF, and listing rules editor.
        </Typography>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <ListingSalesChart days={14} />
        </Grid>
        <Grid item xs={12} md={5}>
          <CategoryHeatmap />
        </Grid>
        <Grid item xs={12} md={5}>
          <ShippingLabelPdf />
        </Grid>
        <Grid item xs={12} md={7}>
          <ListingRulesEditor />
        </Grid>
      </Grid>
      <Box mt={4}>
        <Typography variant="caption" color="text.secondary">
          /api/custom-views/* &middot; 4 endpoints &middot; 2 VIZ + 2 NON-VIZ
        </Typography>
      </Box>
    </Container>
  );
}
