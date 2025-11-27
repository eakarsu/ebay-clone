import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Badge,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Send,
  Search,
  AttachFile,
  MoreVert,
  ArrowBack,
  Circle,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const Messages = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      const conv = conversations.find(c => c.id === parseInt(conversationId));
      if (conv) {
        setSelectedConversation(conv);
        fetchMessages(conv.id);
      }
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data.conversations || []);
    } catch (err) {
      // Use mock data if API fails
      setConversations([
        {
          id: 1,
          otherUser: { id: 101, username: 'VintageCollector', avatar: null },
          lastMessage: 'Is this item still available?',
          lastMessageTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          unreadCount: 2,
          product: { id: 201, title: 'Vintage Watch', image: 'https://source.unsplash.com/50x50/?watch' },
        },
        {
          id: 2,
          otherUser: { id: 102, username: 'TechBuyer23', avatar: null },
          lastMessage: 'Thanks for the quick shipping!',
          lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          unreadCount: 0,
          product: { id: 202, title: 'MacBook Pro', image: 'https://source.unsplash.com/50x50/?laptop' },
        },
        {
          id: 3,
          otherUser: { id: 103, username: 'SneakerHead99', avatar: null },
          lastMessage: 'Can you do $200?',
          lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          unreadCount: 1,
          product: { id: 203, title: 'Air Jordan 1', image: 'https://source.unsplash.com/50x50/?sneakers' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const response = await api.get(`/messages/conversations/${convId}`);
      setMessages(response.data.messages || []);
    } catch (err) {
      // Use mock messages
      setMessages([
        {
          id: 1,
          senderId: 101,
          content: 'Hi! I\'m interested in your listing.',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isOwn: false,
        },
        {
          id: 2,
          senderId: 1,
          content: 'Hello! Yes, it\'s still available. Any questions?',
          createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          isOwn: true,
        },
        {
          id: 3,
          senderId: 101,
          content: 'What\'s the condition like? Any scratches?',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          isOwn: false,
        },
        {
          id: 4,
          senderId: 1,
          content: 'It\'s in excellent condition, no scratches. I can send more photos if you\'d like.',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isOwn: true,
        },
        {
          id: 5,
          senderId: 101,
          content: 'Is this item still available?',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          isOwn: false,
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const tempMessage = {
      id: Date.now(),
      senderId: 1,
      content: newMessage,
      createdAt: new Date().toISOString(),
      isOwn: true,
    };

    setMessages([...messages, tempMessage]);
    setNewMessage('');

    try {
      await api.post(`/messages/conversations/${selectedConversation.id}`, {
        content: newMessage,
      });
    } catch (err) {
      // Message already shown locally
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTimeDisplay = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.product?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 150px)' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Messages
        {totalUnread > 0 && (
          <Chip
            label={`${totalUnread} unread`}
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
        {/* Conversations List */}
        <Box
          sx={{
            width: selectedConversation ? { xs: 0, md: 350 } : '100%',
            maxWidth: { md: 350 },
            borderRight: 1,
            borderColor: 'divider',
            display: { xs: selectedConversation ? 'none' : 'flex', md: 'flex' },
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {filteredConversations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <Typography color="text.secondary">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </Typography>
              </Box>
            ) : (
              filteredConversations.map((conv) => (
                <React.Fragment key={conv.id}>
                  <ListItem
                    button
                    selected={selectedConversation?.id === conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      fetchMessages(conv.id);
                    }}
                    sx={{
                      bgcolor: conv.unreadCount > 0 ? 'action.hover' : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={conv.unreadCount}
                        color="primary"
                        invisible={conv.unreadCount === 0}
                      >
                        <Avatar src={conv.otherUser.avatar}>
                          {conv.otherUser.username[0].toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: conv.unreadCount > 0 ? 600 : 400 }}
                          >
                            {conv.otherUser.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getTimeDisplay(conv.lastMessageTime)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: conv.unreadCount > 0 ? 500 : 400,
                            }}
                          >
                            {conv.lastMessage}
                          </Typography>
                          {conv.product && (
                            <Typography variant="caption" color="primary">
                              Re: {conv.product.title}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            )}
          </List>
        </Box>

        {/* Message Thread */}
        {selectedConversation ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <IconButton
                sx={{ display: { md: 'none' } }}
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowBack />
              </IconButton>
              <Avatar>{selectedConversation.otherUser.username[0].toUpperCase()}</Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {selectedConversation.otherUser.username}
                </Typography>
                {selectedConversation.product && (
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/product/${selectedConversation.product.id}`)}
                  >
                    Re: {selectedConversation.product.title}
                  </Typography>
                )}
              </Box>
              <IconButton>
                <MoreVert />
              </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: msg.isOwn ? 'primary.main' : 'white',
                      color: msg.isOwn ? 'white' : 'text.primary',
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="body2">{msg.content}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                        textAlign: 'right',
                      }}
                    >
                      {getTimeDisplay(msg.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small">
                  <AttachFile />
                </IconButton>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={4}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  <Send />
                </Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.50',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a conversation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose from your existing conversations or start a new one
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Messages;
