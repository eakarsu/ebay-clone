import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PlayCircle,
  Videocam,
  Schedule,
  Visibility,
  Send,
  ShoppingCart,
  LocalOffer,
  Timer,
  PushPin,
  Chat,
  Close,
  Add,
  ArrowBack,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Stream Card Component
const StreamCard = ({ stream, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      },
      position: 'relative',
    }}
  >
    {stream.status === 'live' && (
      <Chip
        icon={<Videocam />}
        label="LIVE"
        color="error"
        size="small"
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1,
          fontWeight: 700,
        }}
      />
    )}
    <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
      <Chip
        icon={<Visibility sx={{ fontSize: 14 }} />}
        label={stream.viewerCount || 0}
        size="small"
        sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
      />
    </Box>

    <CardMedia
      component="img"
      height="180"
      image={stream.thumbnailUrl || 'https://via.placeholder.com/320x180?text=eBay+Live'}
      alt={stream.title}
      sx={{ bgcolor: '#000' }}
    />

    <CardContent>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 600,
          mb: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {stream.title}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar src={stream.seller?.avatarUrl} sx={{ width: 24, height: 24 }}>
          {stream.seller?.username?.[0]?.toUpperCase()}
        </Avatar>
        <Typography variant="body2" color="text.secondary">
          {stream.seller?.username}
        </Typography>
      </Box>

      {stream.status === 'scheduled' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <Schedule sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            {new Date(stream.scheduledStart).toLocaleString()}
          </Typography>
        </Box>
      )}

      {stream.productCount > 0 && (
        <Chip
          icon={<ShoppingCart sx={{ fontSize: 14 }} />}
          label={`${stream.productCount} products`}
          size="small"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      )}
    </CardContent>
  </Card>
);

// Flash Deal Component
const FlashDeal = ({ product, onBuy }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    if (!product.flashEnd) return null;
    const diff = new Date(product.flashEnd) - new Date();
    if (diff <= 0) return { expired: true };
    return {
      minutes: Math.floor(diff / 60000),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    if (!product.flashEnd) return;
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [product.flashEnd]);

  if (!product.flashPrice || timeLeft?.expired) return null;

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: '#ff6b6b',
        color: 'white',
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(255, 107, 107, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0)' },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LocalOffer />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          FLASH DEAL!
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Timer />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {timeLeft?.minutes}:{String(timeLeft?.seconds).padStart(2, '0')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          component="img"
          src={product.image}
          sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" noWrap>
            {product.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              ${product.flashPrice?.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ textDecoration: 'line-through', opacity: 0.8 }}>
              ${product.price?.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" color="inherit" sx={{ color: '#ff6b6b' }} onClick={onBuy}>
          Buy Now
        </Button>
      </Box>
    </Paper>
  );
};

const EbayLive = () => {
  const navigate = useNavigate();
  const { streamId } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const chatEndRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Data
  const [liveStreams, setLiveStreams] = useState([]);
  const [scheduledStreams, setScheduledStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [streamProducts, setStreamProducts] = useState([]);

  // Chat
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(true);

  // Create stream dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    scheduledStart: '',
  });

  useEffect(() => {
    if (streamId) {
      fetchStream(streamId);
    } else {
      fetchStreams();
    }
  }, [streamId]);

  useEffect(() => {
    if (selectedStream?.status === 'live') {
      // Poll for new chat messages
      const interval = setInterval(() => {
        fetchChat(selectedStream.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedStream]);

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const [liveRes, scheduledRes] = await Promise.all([
        api.get('/live/streams?status=live'),
        api.get('/live/streams?status=scheduled'),
      ]);
      setLiveStreams(liveRes.data.streams || []);
      setScheduledStreams(scheduledRes.data.streams || []);
    } catch (err) {
      // Mock data
      setLiveStreams([
        {
          id: '1',
          title: 'Vintage Watch Collection Sale',
          status: 'live',
          viewerCount: 1234,
          thumbnailUrl: 'https://source.unsplash.com/320x180/?watch',
          productCount: 15,
          seller: { username: 'WatchCollector', avatarUrl: null },
        },
        {
          id: '2',
          title: 'Designer Handbags Unboxing',
          status: 'live',
          viewerCount: 856,
          thumbnailUrl: 'https://source.unsplash.com/320x180/?handbag',
          productCount: 8,
          seller: { username: 'LuxuryFinds', avatarUrl: null },
        },
      ]);
      setScheduledStreams([
        {
          id: '3',
          title: 'Pokemon Card Opening Event',
          status: 'scheduled',
          scheduledStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          viewerCount: 0,
          thumbnailUrl: 'https://source.unsplash.com/320x180/?pokemon',
          productCount: 25,
          seller: { username: 'CardMaster', avatarUrl: null },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStream = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/live/streams/${id}`);
      setSelectedStream(res.data);
      setStreamProducts(res.data.products || []);
      fetchChat(id);

      // Join stream
      if (user && res.data.status === 'live') {
        api.post(`/live/streams/${id}/join`).catch(() => {});
      }
    } catch (err) {
      setError('Failed to load stream');
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async (id) => {
    try {
      const res = await api.get(`/live/streams/${id}/chat`);
      setChatMessages(res.data.messages || []);
    } catch (err) {
      // Keep existing messages
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !selectedStream) return;

    try {
      await api.post(`/live/streams/${selectedStream.id}/chat`, { message: chatMessage });
      setChatMessage('');
      fetchChat(selectedStream.id);
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleCreateStream = async () => {
    try {
      await api.post('/live/streams', newStream);
      setCreateDialog(false);
      setNewStream({ title: '', description: '', scheduledStart: '' });
      fetchStreams();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create stream');
    }
  };

  const handleBuyProduct = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await addToCart(product.id, 1);
      // Show success
    } catch (err) {
      setError('Failed to add to cart');
    }
  };

  // Stream viewer page
  if (selectedStream) {
    const activeFlashDeal = streamProducts.find(
      (p) => p.flashPrice && new Date(p.flashEnd) > new Date()
    );

    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Button startIcon={<Close />} onClick={() => navigate('/live')} sx={{ mb: 2 }}>
          Back to Live
        </Button>

        <Grid container spacing={2}>
          {/* Video Player */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ bgcolor: '#000', position: 'relative', paddingTop: '56.25%' }}>
              {selectedStream.status === 'live' ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <PlayCircle sx={{ fontSize: 80, mb: 2 }} />
                    <Typography variant="h6">Live Stream</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Video player would connect to stream here
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${selectedStream.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Schedule sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">Stream starts</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {new Date(selectedStream.scheduledStart).toLocaleString()}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Stream info overlay */}
              <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {selectedStream.status === 'live' && (
                    <Chip icon={<Videocam />} label="LIVE" color="error" />
                  )}
                  <Chip
                    icon={<Visibility />}
                    label={`${selectedStream.viewerCount} watching`}
                    sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Stream info */}
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {selectedStream.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={selectedStream.seller?.avatarUrl}>
                  {selectedStream.seller?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">{selectedStream.seller?.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStream.seller?.totalSales} sales
                  </Typography>
                </Box>
              </Box>
              {selectedStream.description && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {selectedStream.description}
                </Typography>
              )}
            </Paper>

            {/* Flash Deal */}
            {activeFlashDeal && (
              <Box sx={{ mt: 2 }}>
                <FlashDeal product={activeFlashDeal} onBuy={() => handleBuyProduct(activeFlashDeal)} />
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
              <Tabs value={showChat ? 0 : 1} onChange={(e, v) => setShowChat(v === 0)}>
                <Tab icon={<Chat />} label="Chat" />
                <Tab icon={<ShoppingCart />} label={`Products (${streamProducts.length})`} />
              </Tabs>

              {/* Chat */}
              {showChat ? (
                <>
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {chatMessages.map((msg) => (
                      <Box key={msg.id} sx={{ mb: 1 }}>
                        {msg.isPinned && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: 'primary.main',
                              mb: 0.5,
                            }}
                          >
                            <PushPin sx={{ fontSize: 12 }} />
                            <Typography variant="caption">Pinned</Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {msg.user?.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {msg.user?.username}
                            </Typography>
                            <Typography variant="body2">{msg.message}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                    <div ref={chatEndRef} />
                  </Box>

                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    {user ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Say something..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                        />
                        <IconButton onClick={handleSendChat} color="primary">
                          <Send />
                        </IconButton>
                      </Box>
                    ) : (
                      <Button fullWidth variant="outlined" onClick={() => navigate('/login')}>
                        Sign in to chat
                      </Button>
                    )}
                  </Box>
                </>
              ) : (
                /* Products */
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <List>
                    {streamProducts.map((product) => (
                      <React.Fragment key={product.id}>
                        <ListItem
                          secondaryAction={
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleBuyProduct(product)}
                            >
                              ${product.flashPrice || product.price}
                            </Button>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar variant="rounded" src={product.image} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={product.title}
                            secondary={
                              product.flashPrice ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LocalOffer color="error" sx={{ fontSize: 14 }} />
                                  <Typography variant="caption" color="error">
                                    Flash Deal!
                                  </Typography>
                                </Box>
                              ) : (
                                product.condition
                              )
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Stream listing page
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Videocam sx={{ fontSize: 40, color: '#e53238' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              eBay Live
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shop live with your favorite sellers
            </Typography>
          </Box>
        </Box>
        {user?.isSeller && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog(true)}
            sx={{ bgcolor: '#e53238' }}
          >
            Go Live
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Live Now */}
          {liveStreams.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge color="error" variant="dot">
                  <Videocam color="error" />
                </Badge>
                Live Now
              </Typography>
              <Grid container spacing={3}>
                {liveStreams.map((stream) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={stream.id}>
                    <StreamCard stream={stream} onClick={() => navigate(`/live/${stream.id}`)} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Upcoming */}
          {scheduledStreams.length > 0 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                Upcoming Streams
              </Typography>
              <Grid container spacing={3}>
                {scheduledStreams.map((stream) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={stream.id}>
                    <StreamCard stream={stream} onClick={() => navigate(`/live/${stream.id}`)} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Empty state */}
          {liveStreams.length === 0 && scheduledStreams.length === 0 && (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Videocam sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No live streams at the moment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later or start your own stream!
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Create Stream Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule a Live Stream</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Stream Title"
            value={newStream.title}
            onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={newStream.description}
            onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Start Time"
            type="datetime-local"
            value={newStream.scheduledStart}
            onChange={(e) => setNewStream({ ...newStream, scheduledStart: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateStream} disabled={!newStream.title}>
            Schedule Stream
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EbayLive;
