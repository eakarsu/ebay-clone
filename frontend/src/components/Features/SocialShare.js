import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Tooltip,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Share,
  Facebook,
  Twitter,
  Pinterest,
  Email,
  Link as LinkIcon,
  WhatsApp,
} from '@mui/icons-material';
import { socialShareService } from '../../services/api';

const SocialShare = ({ product, variant = 'icon' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const shareUrl = `${window.location.origin}/product/${product?.id}`;
  const shareTitle = product?.title || 'Check out this item';
  const shareText = `${shareTitle} - $${product?.buyNowPrice?.toFixed(2) || product?.currentPrice?.toFixed(2)}`;

  const handleShare = async (platform) => {
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'pinterest':
        const imageUrl = product?.images?.[0]?.url || '';
        url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(shareText)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`Check out this item: ${shareUrl}`)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
        } catch (err) {
          setSnackbar({ open: true, message: 'Failed to copy link', severity: 'error' });
        }
        setAnchorEl(null);
        return;
      default:
        return;
    }

    // Track the share
    try {
      await socialShareService.share({
        productId: product?.id,
        platform,
        shareUrl,
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }

    // Open share URL
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }

    setAnchorEl(null);
  };

  const shareOptions = [
    { platform: 'facebook', icon: <Facebook sx={{ color: '#1877F2' }} />, label: 'Facebook' },
    { platform: 'twitter', icon: <Twitter sx={{ color: '#1DA1F2' }} />, label: 'Twitter' },
    { platform: 'pinterest', icon: <Pinterest sx={{ color: '#E60023' }} />, label: 'Pinterest' },
    { platform: 'whatsapp', icon: <WhatsApp sx={{ color: '#25D366' }} />, label: 'WhatsApp' },
    { platform: 'email', icon: <Email color="action" />, label: 'Email' },
    { platform: 'copy', icon: <LinkIcon color="action" />, label: 'Copy Link' },
  ];

  return (
    <>
      <Tooltip title="Share">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Share />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 220 } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Share this item
          </Typography>
        </Box>
        <Divider />
        {shareOptions.map((option) => (
          <MenuItem key={option.platform} onClick={() => handleShare(option.platform)}>
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default SocialShare;
