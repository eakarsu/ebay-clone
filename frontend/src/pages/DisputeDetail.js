import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Gavel,
  Person,
  Send,
  AttachFile,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dispute, setDispute] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDispute();
  }, [id]);

  const fetchDispute = async () => {
    try {
      const response = await api.get(`/disputes/${id}`);
      setDispute(response.data.dispute);
      setMessages(response.data.messages || []);
    } catch (err) {
      setError('Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await api.post(`/disputes/${id}/messages`, { message: newMessage });
      setNewMessage('');
      fetchDispute();
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'warning',
      pending_seller_response: 'info',
      pending_buyer_response: 'info',
      under_review: 'primary',
      resolved: 'success',
      closed: 'default',
      escalated: 'error',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dispute) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Dispute not found</Alert>
        <Button onClick={() => navigate('/disputes')} sx={{ mt: 2 }}>
          Back to Disputes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/disputes')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Dispute Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order #{dispute.orderNumber}
          </Typography>
        </Box>
        <Chip
          label={dispute.status?.replace(/_/g, ' ')}
          color={getStatusColor(dispute.status)}
          sx={{ textTransform: 'capitalize' }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Dispute Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Gavel /> Dispute Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Dispute Type
              </Typography>
              <Typography sx={{ textTransform: 'capitalize' }}>
                {dispute.disputeType?.replace(/_/g, ' ')}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Desired Resolution
              </Typography>
              <Typography sx={{ textTransform: 'capitalize' }}>
                {dispute.desiredResolution?.replace(/_/g, ' ') || 'Not specified'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Opened On
              </Typography>
              <Typography>
                {new Date(dispute.createdAt).toLocaleDateString()}
              </Typography>
            </Box>

            {dispute.resolvedAt && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Resolved On
                </Typography>
                <Typography>
                  {new Date(dispute.resolvedAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}

            {dispute.refundAmount && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Refund Amount
                </Typography>
                <Typography color="success.main" fontWeight={600}>
                  ${dispute.refundAmount}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Parties Involved */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person /> Parties Involved
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Opened By
              </Typography>
              <Typography>{dispute.openedByUsername || 'You'}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Against
              </Typography>
              <Typography>{dispute.againstUsername || 'Seller'}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Reason & Messages */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Reason for Dispute
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
              {dispute.reason}
            </Typography>
          </Paper>

          {/* Resolution Notes */}
          {dispute.resolutionNotes && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Resolution
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                {dispute.resolutionNotes}
              </Typography>
            </Paper>
          )}

          {/* Messages */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Messages
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {messages.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No messages yet. Start the conversation below.
              </Typography>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {messages.map((msg, index) => (
                  <ListItem
                    key={index}
                    alignItems="flex-start"
                    sx={{
                      bgcolor: msg.senderId === user?.id ? 'primary.light' : 'grey.100',
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>{msg.senderName?.[0] || 'U'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={msg.senderName || 'User'}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {msg.message}
                          </Typography>
                          <br />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {new Date(msg.createdAt).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {/* New Message Input */}
            {!['resolved', 'closed'].includes(dispute.status) && (
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  multiline
                  maxRows={4}
                />
                <IconButton color="primary">
                  <AttachFile />
                </IconButton>
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  startIcon={<Send />}
                >
                  Send
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DisputeDetail;
