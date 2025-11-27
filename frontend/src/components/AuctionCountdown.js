import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Timer,
  Gavel,
  TrendingUp,
  Warning,
  NotificationsActive,
} from '@mui/icons-material';

const AuctionCountdown = ({
  endTime,
  currentBid = 0,
  startingBid = 0,
  bidCount = 0,
  reservePrice = null,
  reserveMet = true,
  onPlaceBid,
  isWatching = false,
  userHighBidder = false,
}) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [isEnding, setIsEnding] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidInput, setShowBidInput] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsEnded(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      // Set "ending soon" state when less than 1 hour
      setIsEnding(difference < 3600000);

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const formatTimeUnit = (value, unit) => {
    return (
      <Box sx={{ textAlign: 'center', minWidth: 60 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: isEnding ? 'error.main' : 'primary.main',
            fontFamily: 'monospace',
          }}
        >
          {String(value).padStart(2, '0')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {unit}
        </Typography>
      </Box>
    );
  };

  const minBid = currentBid > 0 ? currentBid + 1 : startingBid;

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    if (amount >= minBid && onPlaceBid) {
      onPlaceBid(amount);
      setBidAmount('');
      setShowBidInput(false);
    }
  };

  if (isEnded) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Gavel color="action" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Auction Ended
          </Typography>
        </Box>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
          ${parseFloat(currentBid).toFixed(2)}
        </Typography>
        <Typography color="text.secondary">
          {bidCount} bids • Winning bid
        </Typography>
        {userHighBidder && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Congratulations! You won this auction.
          </Alert>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        bgcolor: isEnding ? 'error.50' : 'background.paper',
        border: isEnding ? '2px solid' : 'none',
        borderColor: 'error.main',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timer color={isEnding ? 'error' : 'primary'} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {isEnding ? 'Ending Soon!' : 'Time Left'}
          </Typography>
        </Box>
        {isEnding && (
          <Chip
            icon={<Warning />}
            label="Hurry!"
            color="error"
            size="small"
          />
        )}
      </Box>

      {/* Countdown Timer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          mb: 3,
          py: 2,
          bgcolor: 'background.default',
          borderRadius: 1,
        }}
      >
        {timeLeft.days > 0 && formatTimeUnit(timeLeft.days, 'DAYS')}
        {formatTimeUnit(timeLeft.hours, 'HRS')}
        <Typography variant="h4" sx={{ alignSelf: 'flex-start', pt: 0.5 }}>:</Typography>
        {formatTimeUnit(timeLeft.minutes, 'MIN')}
        <Typography variant="h4" sx={{ alignSelf: 'flex-start', pt: 0.5 }}>:</Typography>
        {formatTimeUnit(timeLeft.seconds, 'SEC')}
      </Box>

      {/* Progress Bar (visual indicator of time remaining) */}
      {isEnding && (
        <LinearProgress
          variant="determinate"
          value={Math.max(0, (timeLeft.minutes * 60 + timeLeft.seconds) / 36)}
          color="error"
          sx={{ mb: 2, height: 6, borderRadius: 3 }}
        />
      )}

      {/* Current Bid */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Current Bid
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            ${parseFloat(currentBid || startingBid).toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            [{bidCount} {bidCount === 1 ? 'bid' : 'bids'}]
          </Typography>
        </Box>
        {!reserveMet && reservePrice && (
          <Alert severity="warning" sx={{ mt: 1 }} icon={<Warning />}>
            Reserve not met
          </Alert>
        )}
        {userHighBidder && (
          <Alert severity="success" sx={{ mt: 1 }}>
            You're the high bidder!
          </Alert>
        )}
      </Box>

      {/* Bid Input */}
      {showBidInput ? (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`Enter $${minBid.toFixed(2)} or more`}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText={`Minimum bid: $${minBid.toFixed(2)}`}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              color={isEnding ? 'error' : 'primary'}
              onClick={handlePlaceBid}
              disabled={!bidAmount || parseFloat(bidAmount) < minBid}
              startIcon={<Gavel />}
            >
              Place Bid
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowBidInput(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          fullWidth
          variant="contained"
          size="large"
          color={isEnding ? 'error' : 'primary'}
          onClick={() => setShowBidInput(true)}
          startIcon={<Gavel />}
          sx={{ mb: 2 }}
        >
          {isEnding ? 'Bid Now!' : 'Place Bid'}
        </Button>
      )}

      {/* Quick Bid Options */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {[1, 5, 10].map((increment) => (
          <Button
            key={increment}
            variant="outlined"
            size="small"
            sx={{ flex: 1 }}
            onClick={() => {
              setBidAmount((minBid + increment).toString());
              setShowBidInput(true);
            }}
          >
            ${(minBid + increment).toFixed(0)}
          </Button>
        ))}
      </Box>

      {/* Watch/Notify */}
      <Button
        fullWidth
        variant="text"
        startIcon={<NotificationsActive />}
        color={isWatching ? 'success' : 'inherit'}
      >
        {isWatching ? 'Watching' : 'Watch this auction'}
      </Button>

      {/* Bid Activity Indicator */}
      {bidCount > 5 && (
        <Box
          sx={{
            mt: 2,
            p: 1,
            bgcolor: 'warning.50',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TrendingUp color="warning" fontSize="small" />
          <Typography variant="caption" color="warning.dark">
            High activity - {bidCount} bids placed
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AuctionCountdown;
