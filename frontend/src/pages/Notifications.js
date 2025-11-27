import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Divider,
  Avatar,
  Badge,
  FormGroup,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Gavel,
  LocalShipping,
  AttachMoney,
  Message,
  Star,
  Timer,
  TrendingDown,
  Info,
  Delete,
  DoneAll,
  Settings,
  ShoppingCart,
  Favorite,
  Campaign,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    outbid: true,
    auctionEnding: true,
    priceDrops: true,
    orderUpdates: true,
    messages: true,
    promotions: false,
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (err) {
      // Use mock data if API fails
      setNotifications([
        {
          id: 1,
          type: 'outbid',
          title: 'You\'ve been outbid!',
          message: 'Someone placed a higher bid on "Vintage Rolex Submariner". Current bid: $3,500',
          read: false,
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          link: '/product/101',
        },
        {
          id: 2,
          type: 'auction_ending',
          title: 'Auction ending soon!',
          message: '"Apple MacBook Pro M3" ends in 1 hour. You\'re currently winning!',
          read: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          link: '/product/102',
        },
        {
          id: 3,
          type: 'order_shipped',
          title: 'Order shipped!',
          message: 'Your order #ORD-12345 has been shipped. Track: 1Z999AA10123456784',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          link: '/orders/12345',
        },
        {
          id: 4,
          type: 'price_drop',
          title: 'Price drop alert!',
          message: '"Nike Air Jordan 1" from your watchlist dropped to $280 (was $350)',
          read: true,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          link: '/product/103',
        },
        {
          id: 5,
          type: 'message',
          title: 'New message',
          message: 'VintageCollector sent you a message about "Antique Clock"',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          link: '/messages',
        },
        {
          id: 6,
          type: 'review',
          title: 'New review received',
          message: 'A buyer left you a 5-star review: "Excellent seller, fast shipping!"',
          read: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          link: '/seller/dashboard',
        },
        {
          id: 7,
          type: 'order_delivered',
          title: 'Order delivered!',
          message: 'Your order #ORD-12340 was delivered. Don\'t forget to leave feedback!',
          read: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          link: '/orders/12340',
        },
        {
          id: 8,
          type: 'promotion',
          title: '20% off electronics!',
          message: 'Limited time offer: Get 20% off all electronics with code SAVE20',
          read: true,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          link: '/search?category=electronics',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      outbid: <Gavel color="error" />,
      auction_ending: <Timer color="warning" />,
      order_shipped: <LocalShipping color="info" />,
      order_delivered: <ShoppingCart color="success" />,
      price_drop: <TrendingDown color="success" />,
      message: <Message color="primary" />,
      review: <Star color="warning" />,
      promotion: <Campaign color="secondary" />,
      watchlist: <Favorite color="error" />,
    };
    return icons[type] || <Info color="action" />;
  };

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      // Still update locally
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const filteredNotifications = () => {
    if (tabValue === 0) return notifications;
    if (tabValue === 1) return notifications.filter(n => !n.read);
    if (tabValue === 2) return notifications.filter(n => ['outbid', 'auction_ending'].includes(n.type));
    if (tabValue === 3) return notifications.filter(n => ['order_shipped', 'order_delivered'].includes(n.type));
    return notifications;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon sx={{ fontSize: 32 }} />
          </Badge>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DoneAll />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
          <IconButton onClick={() => setSettingsDialog(true)}>
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${notifications.length})`} />
          <Tab
            label={
              <Badge badgeContent={unreadCount} color="error" sx={{ pr: 2 }}>
                Unread
              </Badge>
            }
          />
          <Tab label="Bidding" />
          <Tab label="Orders" />
        </Tabs>

        {filteredNotifications().length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 1 ? 'All caught up!' : 'Notifications will appear here'}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredNotifications().map((notification, idx) => (
              <React.Fragment key={notification.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                  onClick={() => {
                    handleMarkAsRead(notification.id);
                    if (notification.link) navigate(notification.link);
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: notification.read ? 'grey.200' : 'primary.light',
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: notification.read ? 400 : 600 }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTimeAgo(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Notification Settings Dialog */}
      <Dialog
        open={settingsDialog}
        onClose={() => setSettingsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose which notifications you want to receive
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.outbid}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, outbid: e.target.checked })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Outbid Alerts</Typography>
                  <Typography variant="caption" color="text.secondary">
                    When someone outbids you on an auction
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.auctionEnding}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, auctionEnding: e.target.checked })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Auction Ending</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reminder before auctions you're watching end
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.priceDrops}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, priceDrops: e.target.checked })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Price Drops</Typography>
                  <Typography variant="caption" color="text.secondary">
                    When items in your watchlist drop in price
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.orderUpdates}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, orderUpdates: e.target.checked })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Order Updates</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Shipping and delivery notifications
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.messages}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, messages: e.target.checked })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Messages</Typography>
                  <Typography variant="caption" color="text.secondary">
                    When you receive a new message
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.promotions}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, promotions: e.target.checked })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Promotions</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Special offers and deals
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsDialog(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Notifications;
