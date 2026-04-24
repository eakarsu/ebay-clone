import React, { useEffect, useRef, useState } from 'react';
import {
  Paper, Box, Typography, TextField, Button, Stack, Avatar, Alert,
} from '@mui/material';
import { Send, Chat } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { auctionChatService, getImageUrl } from '../../services/api';
import { getSocket, joinAuction, leaveAuction } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

// Live chat for auction watchers. Subscribes to the same `auction:{id}` room
// we already use for bids; new messages arrive via `auction:chat` events so
// every tab viewing this product stays in sync without polling.
export default function AuctionChat({ productId, sellerId, disabled = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const isOwnAuction = user && sellerId && user.id === sellerId;

  // Load history + subscribe to the room.
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    auctionChatService.getChat(productId, 50)
      .then(({ data }) => {
        if (!cancelled) setMessages(data.messages || []);
      })
      .catch(() => { /* chat is best-effort */ });

    joinAuction(productId);
    const socket = getSocket();
    const onChat = (msg) => {
      // Ignore messages for other rooms (shared socket).
      if (msg.product_id !== productId) return;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    socket.on('auction:chat', onChat);

    return () => {
      cancelled = true;
      socket.off('auction:chat', onChat);
      leaveAuction(productId);
    };
  }, [productId]);

  // Auto-scroll to latest message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError('');
    try {
      await auctionChatService.post(productId, body);
      setText('');
      // The socket event will append it — no need to optimistically insert.
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chat color="primary" />
        <Typography variant="h6">Watcher chat</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          Live — visible to everyone watching this auction
        </Typography>
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          height: 260,
          overflowY: 'auto',
          bgcolor: 'grey.50',
          borderRadius: 1,
          p: 1.5,
          mb: 1.5,
        }}
      >
        {messages.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center', py: 4 }}>
            No messages yet. Say hi to other bidders!
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {messages.map(m => (
              <Box key={m.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Avatar
                  src={m.avatar_url ? getImageUrl(m.avatar_url) : undefined}
                  sx={{ width: 28, height: 28, fontSize: 13 }}
                >
                  {(m.username || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    @{m.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </Typography>
                  <Typography variant="body2">{m.message}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      {!user ? (
        <Typography variant="body2" color="text.secondary">
          Sign in to chat with other watchers.
        </Typography>
      ) : isOwnAuction ? (
        <Typography variant="body2" color="text.secondary">
          Sellers can't chat in their own auction room. Use Q&amp;A to respond to questions.
        </Typography>
      ) : disabled ? (
        <Typography variant="body2" color="text.secondary">
          This auction is no longer active.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Type a message…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            inputProps={{ maxLength: 500 }}
            fullWidth
          />
          <Button
            variant="contained"
            endIcon={<Send />}
            disabled={sending || !text.trim()}
            onClick={send}
          >
            Send
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
