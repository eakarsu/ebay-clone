import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  Fab,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import {
  Chat,
  Send,
  Close,
  SupportAgent,
  Person,
  Minimize,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { supportChatService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LiveChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchChats();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await supportChatService.getMyChats();
      setChats(response.data || []);

      // Auto-select the first open chat
      const openChat = response.data?.find(c => c.status === 'open');
      if (openChat) {
        selectChat(openChat);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const selectChat = async (chat) => {
    setCurrentChat(chat);
    try {
      const response = await supportChatService.getChatMessages(chat.id);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const startNewChat = async () => {
    setLoading(true);
    try {
      const response = await supportChatService.startChat({
        subject: 'General Support',
        message: 'Hello, I need help.',
      });
      setCurrentChat(response.data.chat);
      setMessages([response.data.message]);
      fetchChats();
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;

    const messageText = newMessage;
    setNewMessage('');

    // Optimistic update
    const tempMessage = {
      id: Date.now(),
      message: messageText,
      senderId: user.id,
      senderType: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await supportChatService.sendMessage(currentChat.id, { message: messageText });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const closeChat = async () => {
    if (!currentChat) return;
    try {
      await supportChatService.closeChat(currentChat.id);
      setCurrentChat(null);
      setMessages([]);
      fetchChats();
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat FAB */}
      <Fab
        color="primary"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Badge badgeContent={chats.filter(c => c.status === 'open').length} color="error">
          <Chat />
        </Badge>
      </Fab>

      {/* Chat Window */}
      <Collapse in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            width: 360,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SupportAgent />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Live Support
              </Typography>
            </Box>
            <Box>
              <IconButton size="small" sx={{ color: 'white' }} onClick={() => setIsOpen(false)}>
                <Minimize />
              </IconButton>
              <IconButton size="small" sx={{ color: 'white' }} onClick={() => setIsOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          {!currentChat ? (
            <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                How can we help you today?
              </Typography>

              {chats.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Recent Conversations
                  </Typography>
                  <List dense>
                    {chats.slice(0, 3).map((chat) => (
                      <ListItem
                        key={chat.id}
                        button
                        onClick={() => selectChat(chat)}
                        sx={{ borderRadius: 1, mb: 0.5 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <SupportAgent fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={chat.subject}
                          secondary={formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                        />
                        <Chip
                          label={chat.status}
                          size="small"
                          color={chat.status === 'open' ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={startNewChat}
                disabled={loading}
                startIcon={<Chat />}
              >
                Start New Conversation
              </Button>
            </Box>
          ) : (
            <>
              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      justifyContent: msg.senderType === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '80%',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: msg.senderType === 'user' ? 'primary.main' : 'grey.100',
                        color: msg.senderType === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body2">{msg.message}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.7,
                          textAlign: 'right',
                        }}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                  />
                  <IconButton color="primary" onClick={sendMessage}>
                    <Send />
                  </IconButton>
                </Box>
                <Button size="small" onClick={closeChat} sx={{ mt: 1 }}>
                  End Chat
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Collapse>
    </>
  );
};

export default LiveChat;
