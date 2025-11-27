import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  Paper,
  Grid,
  LinearProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Star,
  Verified,
  LocalShipping,
  Speed,
  EmojiEvents,
  Shield,
  ThumbUp,
  Schedule,
  TrendingUp,
  Storefront,
} from '@mui/icons-material';

const badgeConfig = {
  topRated: {
    icon: <EmojiEvents />,
    label: 'Top Rated Seller',
    color: '#FFD700',
    bgColor: '#FFF9E6',
    description: 'Consistently provides excellent service with fast shipping and accurate descriptions',
    requirements: ['99%+ positive feedback', '100+ sales', 'Same-day handling', '<2% defect rate'],
  },
  topRatedPlus: {
    icon: <EmojiEvents />,
    label: 'Top Rated Plus',
    color: '#FF6B00',
    bgColor: '#FFF0E6',
    description: 'Highest level of seller performance with exceptional buyer experience',
    requirements: ['Top Rated status', 'Same-day shipping', '30-day returns', 'Tracking on all orders'],
  },
  powerSeller: {
    icon: <TrendingUp />,
    label: 'Power Seller',
    color: '#7B68EE',
    bgColor: '#F0EDFF',
    description: 'High-volume seller with consistent sales and good standing',
    requirements: ['$1,000+ monthly sales', '98%+ feedback', '100+ transactions/year'],
  },
  fastShipping: {
    icon: <LocalShipping />,
    label: 'Fast & Free Shipping',
    color: '#00A86B',
    bgColor: '#E6F7F0',
    description: 'Offers free shipping with same-day or 1-day handling',
    requirements: ['Free shipping on eligible items', '1-day handling time'],
  },
  authenticityVerified: {
    icon: <Verified />,
    label: 'Authenticity Verified',
    color: '#1E90FF',
    bgColor: '#E6F3FF',
    description: 'Participates in eBay Authenticity Guarantee program',
    requirements: ['Verified authentic items', 'Expert inspection'],
  },
  businessSeller: {
    icon: <Storefront />,
    label: 'Business Seller',
    color: '#4A4A4A',
    bgColor: '#F5F5F5',
    description: 'Registered business seller with professional standards',
    requirements: ['Verified business registration', 'VAT registered (if applicable)'],
  },
};

const SellerBadge = ({ type, size = 'medium', showTooltip = true }) => {
  const badge = badgeConfig[type];
  if (!badge) return null;

  const chipContent = (
    <Chip
      icon={React.cloneElement(badge.icon, {
        style: { color: badge.color },
        fontSize: size === 'small' ? 'small' : 'medium'
      })}
      label={badge.label}
      size={size}
      sx={{
        bgcolor: badge.bgColor,
        color: badge.color,
        fontWeight: 600,
        '& .MuiChip-icon': {
          color: badge.color,
        },
        border: `1px solid ${badge.color}20`,
      }}
    />
  );

  if (!showTooltip) return chipContent;

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {badge.label}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {badge.description}
          </Typography>
          <Typography variant="caption" color="grey.300">
            Requirements:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {badge.requirements.map((req, i) => (
              <li key={i}>
                <Typography variant="caption">{req}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      }
      arrow
    >
      {chipContent}
    </Tooltip>
  );
};

const SellerStats = ({
  feedbackScore = 0,
  positivePercent = 0,
  salesCount = 0,
  memberSince = '',
  responseTime = '',
  shippingSpeed = '',
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Seller Performance
      </Typography>

      {/* Feedback Score */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Feedback Score
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {feedbackScore.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              sx={{
                color: i < Math.floor(positivePercent / 20) ? '#FFD700' : '#E0E0E0',
                fontSize: 20,
              }}
            />
          ))}
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
            {positivePercent}% positive
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Stats Grid */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThumbUp fontSize="small" color="action" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Items Sold
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {salesCount.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule fontSize="small" color="action" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Member Since
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {memberSince}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed fontSize="small" color="action" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Response Time
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {responseTime}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping fontSize="small" color="action" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Ships Within
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {shippingSpeed}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

const DetailedSellerMetrics = ({
  accurateDescription = 0,
  communication = 0,
  shippingTime = 0,
  shippingCost = 0,
}) => {
  const metrics = [
    { label: 'Item as Described', value: accurateDescription, icon: <Shield /> },
    { label: 'Communication', value: communication, icon: <ThumbUp /> },
    { label: 'Shipping Time', value: shippingTime, icon: <Speed /> },
    { label: 'Shipping Cost', value: shippingCost, icon: <LocalShipping /> },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Detailed Seller Ratings
      </Typography>
      {metrics.map((metric, index) => (
        <Box key={metric.label} sx={{ mb: index < metrics.length - 1 ? 2 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(metric.icon, { fontSize: 'small', color: 'action' })}
              <Typography variant="body2">{metric.label}</Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {metric.value.toFixed(1)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(metric.value / 5) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: metric.value >= 4.5 ? 'success.main' : metric.value >= 4 ? 'primary.main' : 'warning.main',
              },
            }}
          />
        </Box>
      ))}
    </Paper>
  );
};

const SellerBadgesDisplay = ({ badges = [], compact = false }) => {
  if (badges.length === 0) return null;

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {badges.map((badge) => (
          <SellerBadge key={badge} type={badge} size="small" />
        ))}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Seller Badges
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {badges.map((badge) => (
          <SellerBadge key={badge} type={badge} />
        ))}
      </Box>
    </Paper>
  );
};

export {
  SellerBadge,
  SellerStats,
  DetailedSellerMetrics,
  SellerBadgesDisplay,
  badgeConfig,
};

export default SellerBadgesDisplay;
