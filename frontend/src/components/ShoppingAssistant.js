import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Fab,
  Paper,
  Box,
  Typography,
  IconButton,
  TextField,
  Stack,
  Avatar,
  CircularProgress,
  Divider,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { shoppingAssistantService, getImageUrl } from '../services/api';

const initialBot = {
  role: 'assistant',
  content:
    "Hi! I'm your shopping assistant. Tell me what you're looking for — a brand, a budget, a use case — and I'll surface matching listings.",
  picks: [],
};

const ShoppingAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([initialBot]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await shoppingAssistantService.chat(
        next.map(({ role, content }) => ({ role, content }))
      );
      setMessages([
        ...next,
        { role: 'assistant', content: res.data.reply || '…', picks: res.data.picks || [] },
      ]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: `Sorry — I hit an error: ${err.response?.data?.error || err.message}`,
          picks: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="shopping assistant"
        onClick={() => setOpen((v) => !v)}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 92,
            right: 24,
            width: { xs: 'calc(100% - 32px)', sm: 380 },
            height: 520,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Shopping assistant
            </Typography>
            <Typography variant="caption">Powered by AI · finds real listings from our catalog</Typography>
          </Box>

          <Box
            ref={scrollRef}
            sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}
          >
            <Stack gap={1.5}>
              {messages.map((m, i) => (
                <MessageBubble key={i} msg={m} />
              ))}
              {loading && (
                <Stack direction="row" alignItems="center" gap={1} sx={{ ml: 1 }}>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    thinking…
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          <Divider />
          <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="What are you shopping for?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={loading}
            />
            <IconButton color="primary" onClick={send} disabled={loading || !input.trim()}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <Box sx={{ maxWidth: '85%' }}>
        <Paper
          sx={{
            px: 1.5,
            py: 1,
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {msg.content}
          </Typography>
        </Paper>

        {msg.picks && msg.picks.length > 0 && (
          <Stack gap={1} sx={{ mt: 1 }}>
            {msg.picks.map((p) => (
              <Paper
                key={p.id}
                component={Link}
                to={`/product/${p.id}`}
                variant="outlined"
                sx={{
                  p: 1,
                  display: 'flex',
                  gap: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                  alignItems: 'center',
                }}
              >
                {p.imageUrl && (
                  <Avatar
                    src={getImageUrl(p.imageUrl)}
                    variant="rounded"
                    sx={{ width: 44, height: 44 }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                    {p.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {p.reason}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  ${p.price?.toFixed(2)}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default ShoppingAssistant;
